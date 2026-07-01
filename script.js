const API =
"https://cors.j808vip.workers.dev/?url=" +
encodeURIComponent("https://rate.bot.com.tw/xrt/flcsv/0/day");

const tableHead=document.querySelector("#rateTable thead");
const tableBody=document.querySelector("#rateTable tbody");

const updateTime=document.getElementById("updateTime");

const search=document.getElementById("search");

document.getElementById("reload").onclick=loadData;

search.addEventListener("keyup",filterTable);

async function loadData(){

updateTime.innerHTML="讀取中...";

try{

const response=await fetch(API);

if(!response.ok){

throw new Error("HTTP "+response.status);

}

const csv=await response.text();

drawTable(csv);

updateTime.innerHTML="更新："+new Date().toLocaleString();

}catch(e){

updateTime.innerHTML="讀取失敗："+e.message;

}

}

function drawTable(csv){

const rows=csv.trim().split(/\r?\n/);

tableHead.innerHTML="";
tableBody.innerHTML="";

rows.forEach((row,index)=>{

const tr=document.createElement("tr");

const cols=row.split(",");

cols.forEach(col=>{

col=col.replace(/^"|"$/g,"");

const cell=document.createElement(index===0?"th":"td");

cell.textContent=col;

tr.appendChild(cell);

});

if(index===0){

tableHead.appendChild(tr);

}else{

tableBody.appendChild(tr);

}

});

}

function filterTable(){

const keyword=search.value.toUpperCase();

Array.from(tableBody.rows).forEach(row=>{

row.style.display=row.innerText.toUpperCase().includes(keyword)
?"":"none";

});

}

loadData();

setInterval(loadData,300000);
