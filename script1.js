const API = "https://cors.j808vip.workers.dev/";

let lastData = null;

async function load(){

const status = document.getElementById("status");

try{

const res = await fetch(API + "?t=" + Date.now());
const data = await res.json();

updateUI(data);

status.innerText = "更新成功";

}catch(e){

status.innerText = "錯誤：" + e.message;

}

}

function updateUI(data){

setText("cash_buy", data.cash_buy);
setText("cash_sell", data.cash_sell);
setText("spot_buy", data.spot_buy);
setText("spot_sell", data.spot_sell);

document.getElementById("time").innerText =
"更新時間：" + new Date().toLocaleString();

}

function setText(id, value){

const el = document.getElementById(id);
if(!el) return;

const old = parseFloat(el.innerText);

el.innerText = value;

// 漲跌顏色
if(!isNaN(old) && !isNaN(value)){
    el.style.color = value > old ? "#22c55e" :
                    value < old ? "#ef4444" : "#fff";
}

}

load();

// 🔁 改成 5 分鐘更新
setInterval(load, 5 * 60 * 1000);
