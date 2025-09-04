const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let playerBaseHP, enemyBaseHP, playerUnits, enemyUnits, projectiles, hitMarks, swingMarks;
let pendingUnitType = null;
let enemySpawnTimer = null;

function inMeleeRange(a,b){
  const laneDiff = Math.abs(a.lane-b.lane);
  const dy = Math.abs(a.y-b.y);
  if(laneDiff===0) return dy<=24;
  if(laneDiff===1) return dy<=20;
  return false;
}
function inUnitRange(a,b){
  const dx = (a.lane-b.lane)*(canvas.width/5);
  const dy = (a.y-b.y);
  return Math.hypot(dx,dy) <= a.range;
}

function startGame(){
  document.getElementById("menu").style.display="none";
  document.getElementById("settings").style.display="none";
  document.getElementById("help").style.display="none";
  document.getElementById("title").style.display="none";
  canvas.style.display="block";
  document.getElementById("ui").style.display="block";

  playerBaseHP=100; enemyBaseHP=100;
  playerUnits=[]; enemyUnits=[]; projectiles=[]; hitMarks=[]; swingMarks=[];
  if(enemySpawnTimer) clearInterval(enemySpawnTimer);
  enemySpawnTimer = setInterval(spawnEnemy, 4000);

  canvas.onclick = (e)=>{
    if(!pendingUnitType) return;
    const rect=canvas.getBoundingClientRect();
    const lane=Math.floor((e.clientX-rect.left)/(canvas.width/5));
    playerUnits.push(new Unit(pendingUnitType,"player",lane,canvas.height-40));
    pendingUnitType=null;
  };

  requestAnimationFrame(loop);
}

function spawnEnemy(){
  const types=["goblin","orc","golem","shaman","phantom"];
  const type=types[Math.floor(Math.random()*types.length)];
  const lane=Math.floor(Math.random()*5);
  enemyUnits.push(new Unit(type,"enemy",lane,40));
}

function loop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle="#555";
  for(let i=1;i<5;i++){ ctx.beginPath(); ctx.moveTo(i*canvas.width/5,0); ctx.lineTo(i*canvas.width/5,canvas.height); ctx.stroke(); }
  ctx.fillStyle="white";
  ctx.fillText(`自陣HP:${playerBaseHP}`,10,15);
  ctx.fillText(`敵陣HP:${enemyBaseHP}`,280,15);

  for(const u of [...playerUnits,...enemyUnits]){ u.update(); u.draw(); }

  // 攻撃ロジック（省略：v0.2.27のまま書く）
  // ...

  requestAnimationFrame(loop);
}

function endScreen(text,color){
  if(enemySpawnTimer) { clearInterval(enemySpawnTimer); enemySpawnTimer=null; }
  ctx.fillStyle=color; ctx.font="30px sans-serif"; ctx.fillText(text, 120, 300);
}

function chooseUnit(type){ pendingUnitType=type; }

// === ここを追加 ===
// HTMLから呼び出せるようにする
window.startGame = startGame;
window.applySettingsAndStart = applySettingsAndStart;
window.showSettings = showSettings;
window.backToMenu = backToMenu;
window.showHelp = showHelp;
window.backToMenuFromHelp = backToMenuFromHelp;
window.chooseUnit = chooseUnit;

// HTMLから呼び出せるようにする
window.startGame = startGame;
window.applySettingsAndStart = applySettingsAndStart;
window.showSettings = showSettings;
window.backToMenu = backToMenu;
window.showHelp = showHelp;
window.backToMenuFromHelp = backToMenuFromHelp;
window.chooseUnit = chooseUnit;