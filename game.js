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

  // === 自軍攻撃 ===
  for(const p of playerUnits){
    for(const e of enemyUnits){
      if(inMeleeRange(p,e)){
        p.target=e; e.target=p;
        if(p.cooldown<=0){ e.hp-=p.atk; hitMarks.push(new HitMark(e.x,e.y)); swingMarks.push(new SwingMark(p.x,p.y,"player")); p.cooldown=30; }
        if(e.cooldown<=0){ p.hp-=e.atk; hitMarks.push(new HitMark(p.x,p.y)); swingMarks.push(new SwingMark(e.x,e.y,"enemy")); e.cooldown=40; }
      }else{
        if(p.role==="archer" && inUnitRange(p,e) && p.cooldown<=0){
          projectiles.push(new Projectile(p.x,p.y-12,e,p.atk,"white"));
          p.cooldown=60;
        }
      }
    }
    if(p.role==="healer" && p.cooldown<=0){
      for(const ally of playerUnits){
        if(ally!==p && ally.hp>0 && ally.hp<unitStats[ally.type].hp && inUnitRange(p,ally)){
          projectiles.push(new HealProjectile(p.x,p.y-12,ally,p.atk));
          p.cooldown=90;
          break;
        }
      }
    }
  }

  // === 敵攻撃 ===
  for(const e of enemyUnits){
    if(e.target && e.target.hp>0){
      // 戦闘中は移動・射撃なし
    }else{
      if(e.role==="shaman" && e.cooldown<=0 && playerUnits.length>0){
        const t=
