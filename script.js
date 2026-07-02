const API = "https://cors.j808vip.workers.dev/";

let lastSpotSell = null;

async function load() {

  const status = document.getElementById("status");

  try {

    const res = await fetch(API + "?t=" + Date.now());
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "API error");

    updateUI(data);

    status.innerText = "更新成功";

  } catch (e) {

    status.innerText = "錯誤：" + e.message;

  }
}

function updateUI(data) {

  const el = document.getElementById("spot_sell");
  const timeEl = document.getElementById("time");

  if (!el) {
    console.error("❌ HTML 缺少 spot_sell");
    return;
  }

  const value = data.spot_sell;

  el.innerText = value;

  // 漲跌顏色
  if (lastSpotSell !== null) {
    if (value > lastSpotSell) {
      el.style.color = "#22c55e"; // 綠
    } else if (value < lastSpotSell) {
      el.style.color = "#ef4444"; // 紅
    } else {
      el.style.color = "#ffffff";
    }
  }

  lastSpotSell = value;

  if (timeEl) {
    timeEl.innerText =
      "更新時間：" + new Date().toLocaleString("zh-TW");
  }
}

// 🚀 初次載入
load();

// 🔁 每 5 分鐘更新
setInterval(load, 5 * 60 * 1000);
