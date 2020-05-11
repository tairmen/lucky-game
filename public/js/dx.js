class DataEx {
  async getGames(id, limit) {
    try {
      if (typeof limit != "number" || limit < 0) {
        limit = null;
      }
      let response = await axios.get("/game/get", {
        params: {
          id: id,
          limit: limit,
        },
      });
      return response.data;
    } catch (error) {
      console.error(error);
    }
  }
  async pushGame(data) {
    try {
      let response = await axios.post("/game/set", data);
      if (response.statusText == "OK") {
        return { status: "success" };
      } else {
        return { status: "fail" };
      }
    } catch (error) {
      console.error(error);
    }
  }
  async getUsers() {
    try {
      let response = await axios.get("/user/get");
      return response.data;
    } catch (error) {
      console.error(error);
    }
  }
  async deleteUserById(id) {
    try {
      let response = await axios.get(`/user/delete?id=${id}`);
      if (response.statusText == "OK") {
        return { status: "success" };
      } else {
        return { status: "fail" };
      }
    } catch (error) {
      console.error(error);
    }
  }
  async genURL(id, url) {
    try {
      let response = await axios.get(`/urlgenerate?id=${id}&url=${url}`);
      if (response.statusText == "OK") {
        return response.data;
      } else {
        return { status: "fail" };
      }
    } catch (error) {
      console.error(error);
    }
  }
  async delURL(id, url) {
    try {
      let response = await axios.get(`/urldelete?id=${id}&url=${url}`);
      if (response.statusText == "OK") {
        return { status: "success" };
      } else {
        return { status: "fail" };
      }
    } catch (error) {
      console.error(error);
    }
  }
}
