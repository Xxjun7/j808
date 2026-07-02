const API = "https://cors.j808vip.workers.dev/";

let lastSpotSell = null;

async function load() {

  const status = document.getElementById("status");

  try {

    const res = await fetch(API + "?t=" + Date.now());
    const data = await res.json();

    updateUI(data);

    status.innerText = "更新成功";

  } catch (e) {

    status.innerText = "錯誤：" + e.message;

  }
}

function updateUI(data) {

  const value = data.spot_sell;

  const el = document.getElementById("spot_sell");

  // 顯示數值
  el.innerText = value;

  // 漲跌顏色（跟上一筆比）
  if (lastSpotSell !== null) {
    if (value > lastSpotSell) {
      el.style.color = "#22c55e"; // 綠
    } else if (value < lastSpotSell) {
      el.style.color = "#ef4444"; // 紅
    } else {
      el.style.color = "#fff";
    }
  }

  lastSpotSell = value;

  document.getElementById("time").innerText =
    "更新時間：" + new Date().toLocaleString("zh-TW");
}

load();

// ⏱ 改成 5 分鐘更新
setInterval(load, 5 * 60 * 1000);
