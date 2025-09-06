// =====================
// ゲーム進行制御
// =====================
let canvas;
let ctx;
document.querySelectorAll('.unit-btn, .special-btn').forEach(btn => {
  btn.addEventListener('mousedown', () => btn.classList.add('pressed'));
  btn.addEventListener('mouseup', () => btn.classList.remove('pressed'));
  btn.addEventListener('mouseleave', () => btn.classList.remove('pressed'));
});
let playerBaseHP, enemyBaseHP, playerUnits, enemyUnits, projectiles, hitMarks, swingMarks, specialEffects;
let pendingUnitType = null;
let pendingSpecial = null;
let enemySpawnTimer = null;

// 近接判定
function inMeleeRange(a,b){
  const laneDiff = Math.abs(a.lane-b.lane);
  const dy = Math.abs(a.y-b.y);
  if(laneDiff===0) return dy<=24;
  if(laneDiff===1) return dy<=20;
  return false;
}

// 射程判定
function inUnitRange(a,b){
  const dx = (a.lane-b.lane)*(canvas.width/5);
  const dy = (a.y-b.y);
  return Math.hypot(dx,dy) <= a.range;
}

// マナ変数の定義
let mana = { freeze:0, meteor:0, heal:0 };
const maxMana = { freeze:100, meteor:150, heal:120 };

// ゴールドとコスト設定
let playerGold = 500;
const unitCosts = {
  swordsman: 100,
  archer: 150,
  healer: 120
};
const unitNames = {
  swordsman: "ナイト",
  archer: "アーチャー",
  healer: "クレリック"
};
const enemyBounties = {
  goblin: 20,
  orc: 40,
  shaman: 60,
  phantom: 80,
  golem: 150,
  giantGolem: 300,
  dragon: 500
};

const speedLevels = [1,1.5,2];
let speedIndex = 0;
let gameSpeed = speedLevels[speedIndex];

function toggleSpeed(){
  speedIndex = (speedIndex + 1) % speedLevels.length;
  gameSpeed = speedLevels[speedIndex];
  const btn = document.getElementById("speedBtn");
  if(btn) btn.textContent = `x${gameSpeed}`;
}

function startGame(){
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  document.getElementById("menu").style.display="none";
  document.getElementById("settings").style.display="none";
  document.getElementById("help").style.display="none";
  document.getElementById("title").style.display="none";
  document.getElementById("gameArea").style.display="block";
  canvas.style.display="block";
  document.getElementById("ui").style.display="block";

    // ✅ ここを追加
  document.getElementById("specialUI").style.display = "block";
  document.querySelectorAll('.special-btn').forEach(btn => btn.classList.remove('selected'));

  speedIndex = 0;
  gameSpeed = speedLevels[speedIndex];
  const sb = document.getElementById("speedBtn");
  if(sb) sb.textContent = `x${gameSpeed}`;

  playerBaseHP=100; enemyBaseHP=100;
  playerUnits=[]; enemyUnits=[]; projectiles=[]; hitMarks=[]; swingMarks=[]; specialEffects=[];
  pendingSpecial = null;
  playerGold = 500;
  updateGoldUI();
  if(enemySpawnTimer) clearInterval(enemySpawnTimer);
  enemySpawnTimer = setInterval(spawnEnemy, 4000);

  canvas.onclick = (e)=>{
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if(pendingSpecial){
      triggerSpecial(pendingSpecial, x, y);
      const btn = document.getElementById(pendingSpecial + 'Btn');
      if(btn) btn.classList.remove('selected');
      pendingSpecial = null;
      return;
    }
    if(!pendingUnitType) return;
    const cost = unitCosts[pendingUnitType];
    if(playerGold < cost) return;
    const lane = Math.floor(x/(canvas.width/5));
    playerUnits.push(new Unit(pendingUnitType,"player",lane,canvas.height-40));
    playerGold -= cost;
    updateGoldUI();
    pendingUnitType = null;
  };

  requestAnimationFrame(loop);
}

function spawnEnemy(){
  if(singleSpawnType){ 
    // 単体モード：センターレーンに1体だけ出現
    enemyUnits.push(new Unit(singleSpawnType,"enemy",2,40));
    clearInterval(enemySpawnTimer); // 1体だけにするので以降停止
    return;
  }

  // 通常モード
  const types=["goblin","orc","golem","shaman","phantom"];
  const type=types[Math.floor(Math.random()*types.length)];
  const lane=Math.floor(Math.random()*5);
  enemyUnits.push(new Unit(type,"enemy",lane,40));
}

function updateManaUI(type){
  const bar = document.getElementById(type + "Bar");
  const btn = document.getElementById(type + "Btn");
  if(!bar || !btn) return;

  bar.value = mana[type];

  if(mana[type] >= maxMana[type]){
    btn.disabled = false;
    bar.classList.add("mana-full");
  } else {
    btn.disabled = true;
    bar.classList.remove("mana-full");
  }
}

function updateGoldUI(){
  const display = document.getElementById("goldDisplay");
  if(display) display.textContent = `Gold: ${playerGold}`;
  const buttons = document.querySelectorAll('#ui .unit-btn');
  buttons.forEach(btn => {
    const type = btn.dataset.unit;
    btn.textContent = `${unitNames[type]}召喚 (${unitCosts[type]}G)`;
    btn.disabled = playerGold < unitCosts[type];
  });
}


function loop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle="#555";
  for(let i=1;i<5;i++){ 
    ctx.beginPath(); ctx.moveTo(i*canvas.width/5,0); ctx.lineTo(i*canvas.width/5,canvas.height); ctx.stroke(); 
  }
  ctx.fillStyle="white";
  ctx.fillText(`自陣HP:${playerBaseHP}`,10,15);
  ctx.fillText(`敵陣HP:${enemyBaseHP}`,280,15);

  for(const u of [...playerUnits,...enemyUnits]){ u.update(); u.draw(); }

  // === 自軍攻撃 ===
  for(const p of playerUnits){
    for(const e of enemyUnits){
      if(inMeleeRange(p,e)){
        p.target=e; e.target=p;
        if(p.cooldown<=0){ 
          let dmg = (p.meleeAtk !== undefined) ? p.meleeAtk : p.atk;
          e.hp -= dmg;
          hitMarks.push(new HitMark(e.x,e.y)); 
          swingMarks.push(new SwingMark(p.x,p.y,"player")); 
          p.cooldown=60;   // ★ 30 → 60
        }
        if(e.cooldown<=0){ 
          let dmg = (e.meleeAtk !== undefined) ? e.meleeAtk : e.atk;
          p.hp -= dmg;
          hitMarks.push(new HitMark(p.x,p.y)); 
          swingMarks.push(new SwingMark(e.x,e.y,"enemy")); 
          e.cooldown=80;   // ★ 40 → 80
        }
      }else{
        if(p.role==="archer" && inUnitRange(p,e) && p.cooldown<=0){
          projectiles.push(new Projectile(p.x,p.y-12,e,p.atk,"white"));
          p.cooldown=120;  // ★ 60 → 120
        }
        if(p.role==="dragon" && inUnitRange(p,e) && p.cooldown<=0){
          projectiles.push(new Projectile(p.x,p.y-12,e,p.atk,"orange"));
          p.cooldown=150;
        }
      }
    }
    if(p.role==="healer" && p.cooldown<=0){
      for(const ally of playerUnits){
        if(ally!==p && ally.hp>0 && ally.hp<unitStats[ally.type].hp && inUnitRange(p,ally)){
          projectiles.push(new HealProjectile(p.x,p.y-12,ally,p.atk));
          p.cooldown=180;  // ★ 90 → 180
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
        const t=playerUnits[Math.floor(Math.random()*playerUnits.length)];
        if(inUnitRange(e,t)){ 
          projectiles.push(new Projectile(e.x,e.y+12,t,e.atk,"purple")); 
          e.cooldown=160;  // ★ 80 → 160
        }
      }
      if(e.role==="phantom" && e.cooldown<=0 && playerUnits.length>0){
        const t=playerUnits[Math.floor(Math.random()*playerUnits.length)];
        if(inUnitRange(e,t)){ 
          projectiles.push(new Projectile(e.x,e.y+12,t,e.atk,"yellow")); 
          e.cooldown=100;  // ★ 50 → 100
        }
      }
      if(e.role==="golem" && e.cooldown<=0 && playerUnits.length>0){
        const t=playerUnits[Math.floor(Math.random()*playerUnits.length)];
        if(inUnitRange(e,t)){
          projectiles.push(new Projectile(e.x,e.y+12,t,e.atk,"brown"));
          e.cooldown=200;  // ★ 100 → 200
        }
      }
      if(e.role==="dragon" && e.cooldown<=0 && playerUnits.length>0){
        const t=playerUnits[Math.floor(Math.random()*playerUnits.length)];
        if(inUnitRange(e,t)){
          projectiles.push(new Projectile(e.x,e.y+12,t,e.atk,"orange"));
          e.cooldown=150;
        }
      }
    }
  }

  for(const u of [...playerUnits,...enemyUnits]) if(u.cooldown>0) u.cooldown = Math.max(0, u.cooldown - gameSpeed);

  for(const pr of projectiles){ pr.update(); pr.draw(); }
  projectiles = projectiles.filter(pr=>pr.active);
  for(const h of hitMarks){ h.update(); h.draw(); }
  hitMarks = hitMarks.filter(h=>h.life>0);
  for(const s of swingMarks){ s.update(); s.draw(); }
  swingMarks = swingMarks.filter(s=>s.life>0);
  for(const fx of specialEffects){ fx.update(); fx.draw(); }
  specialEffects = specialEffects.filter(fx=>fx.active);

  // 到達処理
  playerUnits = playerUnits.filter(u=>u.hp>0 && u.y>0);
  enemyUnits  = enemyUnits.filter(e=>{
    if(e.hp<=0){
      playerGold += enemyBounties[e.type] || 0;
      updateGoldUI();
      return false;
    }
    return e.y<canvas.height;
  });
  for(const e of enemyUnits){ if(e.y>=canvas.height-30){ playerBaseHP-=e.atk; e.hp=0; } }
  for(const p of playerUnits){ if(p.y<=30){ enemyBaseHP-=p.atk; playerGold += 150; updateGoldUI(); p.hp=0; } }
  enemyUnits = enemyUnits.filter(e=>e.hp>0 && e.y<canvas.height);
  playerUnits = playerUnits.filter(u=>u.hp>0 && u.y>0);

// === マナ自動回復 ===
mana.freeze = Math.min(maxMana.freeze, mana.freeze + 0.167 * gameSpeed);  // 10秒でMAX
mana.meteor = Math.min(maxMana.meteor, mana.meteor + 0.0625 * gameSpeed); // 40秒でMAX
mana.heal   = Math.min(maxMana.heal,   mana.heal   + 0.1 * gameSpeed);    // 20秒でMAX

updateManaUI("freeze");
updateManaUI("meteor");
updateManaUI("heal");

  
  if(playerBaseHP<=0){ endScreen("GAME OVER","red"); return; }
  if(enemyBaseHP<=0){
    const remaining = playerUnits.filter(u => u.hp > 0).length;
    playerGold += remaining * 150;
    updateGoldUI();
    endScreen("VICTORY!","yellow");
    return;
  }

  requestAnimationFrame(loop);
}

function endScreen(text,color){
  if(enemySpawnTimer) { clearInterval(enemySpawnTimer); enemySpawnTimer=null; }
  ctx.fillStyle=color; ctx.font="30px sans-serif"; ctx.fillText(text, 120, 300);

  // ✅ ゲーム終了時は非表示
  document.getElementById("specialUI").style.display = "none";
}


function chooseUnit(type){ pendingUnitType=type; }

function useSpecial(type){
  if(mana[type] >= maxMana[type]){
    pendingSpecial = type;
    document.querySelectorAll('.special-btn').forEach(btn => btn.classList.remove('selected'));
    const btn = document.getElementById(type + 'Btn');
    if(btn) btn.classList.add('selected');
  }
}

function triggerSpecial(type,x,y){
  const radius = 140;
  if(type === "freeze"){
    const affected=[];
    for(const e of enemyUnits){
      if(Math.hypot(e.x - x, e.y - y) <= radius){
        e.speedBackup = e.speed;
        e.speed = 0;
        affected.push(e);
      }
    }
    setTimeout(()=>{
      for(const e of affected){
        if(e.speedBackup !== undefined){ e.speed = e.speedBackup; delete e.speedBackup; }
      }
    },5000);
    mana.freeze = 0;
    specialEffects.push(new SpecialCircle(x,y,"gray"));
    specialEffects.push(new SpecialText("❄️ フリーズ！！"));
    updateManaUI("freeze");
  }

  if(type === "meteor"){
    for(const e of enemyUnits){
      if(Math.hypot(e.x - x, e.y - y) <= radius){ e.hp -= 200; }
    }
    mana.meteor = 0;
    specialEffects.push(new SpecialCircle(x,y,"red"));
    specialEffects.push(new SpecialText("☄️ メテオ！！"));
    updateManaUI("meteor");
  }

  if(type === "heal"){
    for(const p of playerUnits){
      if(Math.hypot(p.x - x, p.y - y) <= radius){ p.hp += 100; }
    }
    mana.heal = 0;
    specialEffects.push(new SpecialCircle(x,y,"green"));
    specialEffects.push(new SpecialText("✨ ヒーリング！！"));
    updateManaUI("heal");
  }
}


// === window登録 ===
window.startGame = startGame;
window.applySettingsAndStart = applySettingsAndStart;
window.showSettings = showSettings;
window.backToMenu = backToMenu;
window.showHelp = showHelp;
window.backToMenuFromHelp = backToMenuFromHelp;
window.chooseUnit = chooseUnit;
window.useSpecial = useSpecial;
window.toggleSpeed = toggleSpeed;
