const dx = new DataEx();

function onReady() {
  async function genUsersTable() {
    let html = "";
    let data = await dx.getUsers();
    html += "<table><tr><thead>";
    for (let prop in data[0]) {
      if (prop != "id") {
        html += `<td>${prop}</td>`;
      }
    }
    html += "</tr></thead><tbody>";
    data.forEach((el) => {
      html += `<tr ondblclick='rowClick(this)' id="${el.id}">`;
      for (let prop in el) {
        if (prop != "id") {
          if (prop == "created" || prop == "updated") {
            let date = new Date(el[prop]);
            let strDate = date.toLocaleString();
            html += `<td>${strDate}</td>`;
          } else {
            html += `<td>${el[prop]}</td>`;
          }
        }
      }
      if (el.id != 1) {
        html += `<td><button id="del${el.id}" class="del-button" onclick="delUser(this)">DEL</button></td>`;
      }    
      html += "</tr>";
    });
    html += "</tbody></table>";
    document.querySelector(".users-table").innerHTML = html;
  }
  genUsersTable();
}

function rowClick(row) {
  window.location.href = `/edit?id=${row.id}`;
}

async function delUser(btn) {
  let strId = btn.id.slice(3, btn.id.length);
  let resp = await dx.deleteUserById(parseInt(strId));
  if (resp.status == "success") {
    let element = document.getElementById(strId);
    element.parentNode.removeChild(element);
  }
}

function addUser() {
  window.location.href = `/edit`;
}

onReady();
