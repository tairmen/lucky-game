var express = require("express");
var router = express.Router();
var app = express();
var pgp = require("pg-promise")(/*options*/);
const database = {
  host: "localhost",
  port: "5432",
  user: "postgres",
  password: "admin",
  name: "postgres",
};
const db = pgp(
  `postgres://${database.user}:${database.password}@${database.host}:${database.port}/${database.name}`
);

let adminURL;
db.one("SELECT url FROM users WHERE id=1")
  .then(function (data) {
    adminURL = data.url;
  })
  .catch(function (error) {
    console.log("ERROR:", error);
  });

const uuid = () =>
  "xxxxxxxx-xxxx-4xxx".replace(/[xy]/g, (c, r) =>
    ("x" == c ? (r = (Math.random() * 16) | 0) : (r & 0x3) | 0x8).toString(16)
  );

const INTERVAL = "7 * interval '1 day'";

deleteRoute = (path) => {
  let ind = router.stack.findIndex((el) => {
    return el.route.path == `/${path}`;
  });
  router.stack.splice(ind, 1);
};

checkActive = (id, callback = () => {}) => {
  db.any(
    `SELECT * FROM users WHERE id=${id} and created <= (CURRENT_TIMESTAMP - ${INTERVAL})`
  )
    .then((data) => {
      if (data.length > 0) {
        let user = data[0];
        if (user.active) {
          db.none(`UPDATE users SET active=FALSE WHERE id=${user.id}`)
            .then(() => {
              deleteRoute(user.url);
              let errObj = {
                message: "URL DEACTIVATED",
                error: { status: 404 },
              };
              callback(false, errObj);
              console.log("user with id =", id, "; DEACTIVED");
            })
            .catch(function (error) {
              console.log("ERROR:", error);
            });
        } else {
          let errObj = {
            message: "URL DEACTIVATED",
            error: { status: 404 },
          };
          callback(false, errObj);
        }
      } else {
        console.log("user with id =", id, "; OK");
        callback(true);
      }
    })
    .catch(function (error) {
      console.log("ERROR:", error);
    });
};

db.any("SELECT * FROM users WHERE active=TRUE")
  .then(function (data) {
    data.forEach((el) => {
      router.get(`/${el.url}`, function (req, res, next) {
        if (el.id == 1) {
          res.render("admin");
        } else {
          checkActive(el.id, (active, err) => {
            if (active) {
              res.render("user", {
                name: el.name,
                tel: el.tel,
                url: el.url,
                id: el.id,
              });
            } else {
              res.render("error", err);
            }
          });
        }
      });
    });
  })
  .catch(function (error) {
    console.log("ERROR:", error);
  });

router.get("/", function (req, res, next) {
  res.render("auth", { title: "Authorization" });
});

router.post("/", function (req, res, next) {
  let name = req.body.uname;
  let tel = req.body.tel;
  db.any("SELECT * FROM users WHERE tel=$1 and name=$2", [tel, name])
    .then(function (data) {
      // console.log('finded:', data);
      if (data.length == 0) {
        let url = uuid();
        db.none("INSERT INTO users(tel, name, url) VALUES($1, $2, $3)", [
          tel,
          name,
          url,
        ])
          .then(function () {
            db.one("SELECT * FROM users WHERE url=$1", url)
              .then(function (data) {
                // console.log('new:', data);
                if (data) {
                  router.get(`/${data.url}`, function (req, res, next) {
                    res.render("user", {
                      name: data.name,
                      tel: data.tel,
                      url: data.url,
                      id: data.id,
                    });
                  });
                  res.redirect(`/${data.url}`);
                } else {
                  console.log("ERROR:", "New user not generated");
                }
              })
              .catch(function (error) {
                console.log("ERROR:", error);
              });
          })
          .catch(function (error) {
            console.log("ERROR:", error);
          });
      } else {
        checkActive(data[0].id, (active, err) => {
          if (active) {
            if (
              !router.stack.find((el) => {
                return el.route.path == `/${data[0].url}`;
              })
            ) {
              router.get(`/${data[0].url}`, function (req, res, next) {
                res.render("user", {
                  name: data[0].name,
                  tel: data[0].tel,
                  url: data[0].url,
                  id: data[0].id,
                });
              });
              res.redirect(`/${data[0].url}`);
            } else {
              res.redirect(`/${data[0].url}`);
            }
          } else {
            res.render("error", err);
          }
        });
      }
    })
    .catch(function (error) {
      console.log("ERROR:", error);
    });
});

router.post("/game/set", function (req, res, next) {
  let data = req.body;
  checkActive(data.userId, (active, err) => {
    if (active) {
      db.none(
        'INSERT INTO games("userId", "winValue", "isWin", "resNumber") VALUES($1, $2, $3, $4)',
        [data.userId, data.winValue, data.isWin, data.resNumber]
      )
        .then(function () {
          res.sendStatus(200);
        })
        .catch(function (error) {
          console.log("ERROR:", error);
        });
    } else {
      res.render("error", err);
    }
  });
});

router.get("/game/get", function (req, res, next) {
  // console.log(req.query);
  let limit = req.query.limit;
  limit = limit ? limit : 9999;
  let id = req.query.id;
  checkActive(id, (active, err) => {
    if (active) {
      db.any(
        `SELECT * FROM games WHERE "userId"=${id} ORDER BY created DESC LIMIT ${limit}`
      )
        .then((data) => {
          res.send(data);
        })
        .catch(function (error) {
          console.log("ERROR:", error);
        });
    } else {
      res.render("error", err);
    }
  });
});

router.get("/urldelete", function (req, res, next) {
  let id = req.query.id;
  let url = req.query.url;
  console.log(req.query);
  db.none(`UPDATE users SET active=FALSE WHERE id=${id}`)
    .then(() => {
      deleteRoute(url);
      res.sendStatus(200);
    })
    .catch(function (error) {
      console.log("ERROR:", error);
    });
});

router.get("/urlgenerate", function (req, res, next) {
  let id = req.query.id;
  let url = req.query.url;
  let newURL = uuid();
  checkActive(id, (active, err) => {
    if (active) {
      db.none(
        `UPDATE users SET url='${newURL}', updated=CURRENT_TIMESTAMP WHERE id=${id}`
      )
        .then(() => {
          deleteRoute(url);
          db.one(`SELECT * FROM users WHERE url='${newURL}'`)
            .then((data) => {
              router.get(`/${data.url}`, function (req, res, next) {
                res.render("user", {
                  name: data.name,
                  tel: data.tel,
                  url: data.url,
                  id: data.id,
                });
              });
              res.send(data.url);
            })
            .catch(function (error) {
              console.log("ERROR:", error);
            });
        })
        .catch(function (error) {
          console.log("ERROR:", error);
        });
    } else {
      res.render("error", err);
    }
  });
});

router.get("/user/get", function (req, res, next) {
  db.any("SELECT * FROM users ORDER BY name")
    .then((data) => {
      res.send(data);
    })
    .catch(function (error) {
      console.log("ERROR:", error);
    });
});

router.get("/edit", function (req, res, next) {
  let id = req.query.id;
  if (id) {
    db.one("SELECT * FROM users WHERE id=$1", id)
      .then((data) => {
        res.render("editUser", {
          title: "Edit User",
          name: data.name,
          tel: data.tel,
          url: data.url,
          id: data.id,
          active: data.active,
        });
      })
      .catch(function (error) {
        console.log("ERROR:", error);
      });
  } else {
    res.render("editUser", {
      title: "Add User",
      name: "",
      tel: "",
      url: uuid(),
      id: null,
      active: true,
    });
  }
});

router.post("/edit", function (req, res, next) {
  let data = req.body;
  // console.log(data);
  if (data.id) {
    db.one("SELECT url FROM users WHERE id=$1", data.id)
      .then(function (user) {
        deleteRoute(user.url);
        db.none(
          "UPDATE users SET name=$1, tel=$2, url=$3, updated=$4, active=$5 WHERE id=$6",
          [
            data.uname,
            data.tel,
            data.url,
            new Date().toISOString(),
            data.active,
            data.id,
          ]
        )
          .then(function () {
            if (data.id == 1) {
              adminURL = data.url;
              router.get(`/${data.url}`, function (req, res, next) {
                adminURL = data.url;
                res.render("admin");
              });
            } else {
              router.get(`/${data.url}`, function (req, res, next) {
                checkActive(el.id, (active, err) => {
                  if (active) {
                    res.render("user", {
                      name: data.name,
                      tel: data.tel,
                      url: data.url,
                      id: data.id,
                    });
                  } else {
                    res.render("error", err);
                  }
                });
              });
            }
            res.redirect(`/${adminURL}`);
          })
          .catch(function (error) {
            console.log("ERROR:", error);
          });
      })
      .catch(function (error) {
        console.log("ERROR:", error);
      });
  } else {
    db.none(
      'INSERT INTO users("name", "tel", "url", "active") VALUES($1, $2, $3, $4)',
      [data.uname, data.tel, data.url, data.active]
    )
      .then(function () {
        res.redirect(`/${adminURL}`);
      })
      .catch(function (error) {
        console.log("ERROR:", error);
      });
  }
});

router.get("/user/delete", function (req, res, next) {
  let data = req.query;
  console.log(data);
  if (data.id) {
    db.none("DELETE FROM users WHERE id=$1", [data.id])
      .then(function () {
        res.sendStatus(200);
      })
      .catch(function (error) {
        console.log("ERROR:", error);
      });
  } else {
    res.status(500).send("Query is empty");
  }
});

module.exports = router;
