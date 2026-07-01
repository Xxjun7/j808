const API = "https://cors.j808vip.workers.dev/";

async function load(){

const res = await fetch(API);
const data = await res.json();

cash_buy.innerText = data.cash_buy;
cash_sell.innerText = data.cash_sell;
spot_buy.innerText = data.spot_buy;
spot_sell.innerText = data.spot_sell;

}

load();
setInterval(load, 30000);
