const dx = new DataEx();
const currentUserId = document.getElementById('currentUserId').textContent;

function copyUrl() {
  let copyText = document.getElementById("urlText");
  copyText.select();
  copyText.setSelectionRange(0, 99999);
  document.execCommand("copy");
}

async function deactivateUrl() {
  let resp = await dx.delURL(currentUserId, window.location.pathname.slice(1));
  document.location.reload(true);
}

async function generateUrl() {
  let resp = await dx.genURL(currentUserId, window.location.pathname.slice(1));
  window.location.href = `/${resp}`;
}

async function play() {
  let html = "";
  function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }
  let resNumber = getRandomInt(1000) + 1;
  let isWin = resNumber % 2 == 0 ? true : false;
  let winValue = 0;
  if (isWin) {
    if (resNumber > 900) {
      winValue = resNumber * 0.7;
    }
    if (resNumber > 600 && resNumber <= 900) {
      winValue = resNumber * 0.5;
    }
    if (resNumber > 300 && resNumber <= 600) {
      winValue = resNumber * 0.3;
    }
    if (resNumber <= 300) {
      winValue = resNumber * 0.1;
    }
  }
  let data = {userId: currentUserId, isWin, resNumber, winValue};
  let resp = await dx.pushGame(data);
  let isWinText = isWin ? "WIN" : "LOSE"
  html = `<p>score: ${resNumber}</p><p>res: ${isWinText}</p><p>${winValue.toFixed(2)} $</p>`
  document.querySelector(".game-panel").innerHTML = html;
}

async function history() {
  let limit = 3;
  let res = await dx.getGames(currentUserId, limit);
  let html = "";
  if (res.length > 0) {
    html += "<table align='center'>"
    html += "<thead><tr>"
    for (let prop in res[0]) {
      if (prop != "userId" && prop != "id") {
        html += `<td>${prop}</td>`
      }    
    }
    html += "</tr></thead><tbody>"
    res.forEach(el => {
      html += "<tr>"
      for (let prop in el) {
        if (prop != "userId" && prop != "id") {
          if (prop == "winValue") {
            html += `<td>${el[prop].toFixed(2)}</td>`
          } else if (prop == 'created') {
            let date = new Date(el[prop]);
            let strDate = date.toLocaleString();
            html += `<td>${strDate}</td>`
          } else {
            html += `<td>${el[prop]}</td>`
          }      
        }       
      }    
      html += "</tr>"
    });
    html += "</tbody></table>"
  } else {
    html = "<p>NO DATA</p>"
  }
  document.querySelector(".game-panel").innerHTML = html;
}
