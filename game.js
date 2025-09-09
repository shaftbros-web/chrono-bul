// =====================
// ゲーム進行制御
// =====================
let canvas;
let ctx;
document.querySelectorAll('.unit-btn').forEach(btn => {
  btn.addEventListener('mousedown', () => btn.classList.add('pressed'));
  btn.addEventListener('mouseup', () => btn.classList.remove('pressed'));
  btn.addEventListener('mouseleave', () => btn.classList.remove('pressed'));
});
document.querySelectorAll('.special-btn').forEach(btn => {
  btn.addEventListener('mousedown', () => btn.classList.add('pressed'));
  btn.addEventListener('mouseup', () => btn.classList.remove('pressed'));
  btn.addEventListener('mouseleave', () => btn.classList.remove('pressed'));
});
let playerBaseHP, enemyBaseHP, playerUnits, enemyUnits, projectiles, hitMarks, swingMarks, specialEffects, floatingTexts;
let pendingUnitType = null;
let pendingSpecial = null;
let enemySpawnTimer = null;

// レーン数
const LANES = 5;

// 近接判定
function inMeleeRange(a,b){
  const laneDiff = Math.abs(a.lane-b.lane);
  const dy = Math.abs(a.y-b.y);
  if(a.role==="dragon" || b.role==="dragon"){
    if(laneDiff<=1) return dy<=44;
    return false;
  }
  if(laneDiff===0) return dy<=44;
  if(laneDiff===1) return dy<=36;
  return false;
}

// 射程判定
function inUnitRange(a,b){
  let laneDiff = a.lane-b.lane;
  let dx = laneDiff*(canvas.width/LANES);
  const dy = (a.y-b.y);
  if(a.role==="dragon" || b.role==="dragon"){
    if(Math.abs(laneDiff)<=1){
      dx = 0;
    }else{
      dx = (Math.abs(laneDiff)-1)*(canvas.width/LANES)*Math.sign(laneDiff);
    }
  }
  return Math.hypot(dx,dy) <= a.range;
}

// マナ変数の定義
let mana = { freeze:0, meteor:0, heal:0 };
let manaCharges = { freeze:0, meteor:0, heal:0 };
const manaRegenRates = {
  freeze: [0.167, 0.0557],
  meteor: [0.0625, 0.0208],
  heal: [0.1, 0.0333]
};
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
  canvas.style.touchAction = "none";

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
  playerUnits=[]; enemyUnits=[]; projectiles=[]; hitMarks=[]; swingMarks=[]; specialEffects=[]; floatingTexts=[];
  pendingSpecial = null;
  mana = { freeze:0, meteor:0, heal:0 };
  manaCharges = { freeze:0, meteor:0, heal:0 };
  ["freeze","meteor","heal"].forEach(updateManaUI);
  playerGold = 500;
  updateGoldUI();
  if(enemySpawnTimer) clearInterval(enemySpawnTimer);
  enemySpawnTimer = setInterval(spawnEnemy, 4000);

  const handleFieldTap = (e)=>{
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
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
    const lane = Math.floor(x/(canvas.width/LANES));
    playerUnits.push(new Unit(pendingUnitType,"player",lane,canvas.height-40));
    playerGold -= cost;
    updateGoldUI();
    pendingUnitType = null;
  };

  canvas.onpointerdown = handleFieldTap;

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
  const lane=Math.floor(Math.random()*LANES);
  enemyUnits.push(new Unit(type,"enemy",lane,40));
}

function updateManaUI(type){
  const bar1 = document.getElementById(type + "Bar1");
  const bar2 = document.getElementById(type + "Bar2");
  const btn  = document.getElementById(type + "Btn");
  if(!bar1 || !bar2 || !btn) return;

  if(manaCharges[type] === 0){
    bar1.value = mana[type];
    bar2.value = 0;
    bar2.style.display = "none";
  } else if(manaCharges[type] === 1){
    bar1.value = maxMana[type];
    bar2.value = mana[type];
    bar2.style.display = "block";
  } else {
    bar1.value = maxMana[type];
    bar2.value = maxMana[type];
    bar2.style.display = "block";
  }

  bar1.classList.toggle("mana-full", manaCharges[type] >= 1);
  bar2.classList.toggle("mana-full", manaCharges[type] >= 2);
  btn.classList.toggle("ready", manaCharges[type] >= 1);

  if(manaCharges[type] >= 1){
    btn.disabled = false;
    btn.textContent = "発動";
  } else {
    btn.disabled = true;
    btn.textContent = "発動";
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
  for(let i=1;i<LANES;i++){
    ctx.beginPath(); ctx.moveTo(i*canvas.width/LANES,0); ctx.lineTo(i*canvas.width/LANES,canvas.height); ctx.stroke();
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
          floatingTexts.push(new FloatingText(e.x, e.y-15, `-${dmg}`));
          swingMarks.push(new SwingMark(p.x,p.y,"player"));
          p.cooldown=60;   // ★ 30 → 60
        }
        if(e.cooldown<=0){
          let dmg = (e.meleeAtk !== undefined) ? e.meleeAtk : e.atk;
          p.hp -= dmg;
          hitMarks.push(new HitMark(p.x,p.y));
          floatingTexts.push(new FloatingText(p.x, p.y-15, `-${dmg}`));
          swingMarks.push(new SwingMark(e.x,e.y,"enemy"));
          e.cooldown=80;   // ★ 40 → 80
        }
      }else{

          if(p.role==="archer" && inUnitRange(p,e) && p.cooldown<=0){
            projectiles.push(new Projectile(p.x,p.y-14,e,p.atk,{shape:"arrow", color:"white", size:12}));
            p.cooldown=120;  // ★ 60 → 120
          }

          if(p.role==="dragon" && inUnitRange(p,e) && p.cooldown<=0){
            projectiles.push(new Projectile(p.x,p.y-14,e,p.atk,{shape:"fireball", color:"orange", size:24}));
            p.cooldown=150;
          }
      }
    }
    if(p.role==="healer" && p.cooldown<=0){
      for(const ally of playerUnits){
        if(ally!==p && ally.hp>0 && ally.hp<unitStats[ally.type].hp && inUnitRange(p,ally)){
          projectiles.push(new HealProjectile(p.x,p.y-14,ally,p.atk));
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
      if(e.role=="shaman" && e.cooldown<=0 && playerUnits.length>0){
        const t=playerUnits[Math.floor(Math.random()*playerUnits.length)];
        if(inUnitRange(e,t)){
          projectiles.push(new Projectile(e.x,e.y+14,t,e.atk,{shape:"arrow", color:"blue", size:12}));
          e.cooldown=160;  // ★ 80 → 160
        }
      }
      if(e.role=="phantom" && e.cooldown<=0 && playerUnits.length>0){
        const t=playerUnits[Math.floor(Math.random()*playerUnits.length)];
        if(inUnitRange(e,t)){
          projectiles.push(new Projectile(e.x,e.y+14,t,e.atk,{color:"white", size:9}));
          e.cooldown=100;  // ★ 50 → 100
        }
      }
      if(e.role=="golem" && e.cooldown<=0 && playerUnits.length>0){
        const t=playerUnits[Math.floor(Math.random()*playerUnits.length)];
        if(inUnitRange(e,t)){
          const opts = (e.type === "giantGolem")
            ? {shape:"rock", color:"gray", size:21}
            : {shape:"square", color:"brown", size:12};
          projectiles.push(new Projectile(e.x,e.y+14,t,e.atk,opts));
          e.cooldown=200;  // ★ 100 → 200
        }
      }
        if(e.role==="dragon" && e.cooldown<=0 && playerUnits.length>0){
          const t=playerUnits[Math.floor(Math.random()*playerUnits.length)];
          if(inUnitRange(e,t)){
            projectiles.push(new Projectile(e.x,e.y+14,t,e.atk,{shape:"fireball", color:"orange", size:24}));
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
  for(const t of floatingTexts){ t.update(); t.draw(); }
  floatingTexts = floatingTexts.filter(t=>t.life>0);
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
  for(const e of enemyUnits){
    if(e.y>=canvas.height-26){
      playerBaseHP-=e.atk;
      floatingTexts.push(new FloatingText(e.x, canvas.height-80, `-${e.atk}`));
      e.hp=0;
    }
  }
  for(const p of playerUnits){
    if(p.y<=26){
      enemyBaseHP-=p.atk;
      floatingTexts.push(new FloatingText(p.x,80, `-${p.atk}`));
      playerGold += 150;
      updateGoldUI();
      p.hp=0;
    }
  }
  enemyUnits = enemyUnits.filter(e=>e.hp>0 && e.y<canvas.height);
  playerUnits = playerUnits.filter(u=>u.hp>0 && u.y>0);

  // === マナ自動回復 ===
  for(const type of ['freeze','meteor','heal']){
    if(manaCharges[type] < 2){
      const rate = manaRegenRates[type][manaCharges[type]];
      mana[type] = Math.min(maxMana[type], mana[type] + rate * gameSpeed);
      if(mana[type] >= maxMana[type]){
        if(manaCharges[type] === 0){
          mana[type] = 0;
          manaCharges[type] = 1;
        }else{
          manaCharges[type] = 2;
        }
      }
    }
    updateManaUI(type);
  }

  
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
  if(manaCharges[type] >= 1){
    pendingSpecial = type;
    document.querySelectorAll('.special-btn').forEach(btn => btn.classList.remove('selected'));
    const btn = document.getElementById(type + 'Btn');
    if(btn) btn.classList.add('selected');
  }
}

function triggerSpecial(type,x,y){
  let progress = 0;
  if(manaCharges[type] >= 1){
    if(manaCharges[type] === 1){
      progress = mana[type] / maxMana[type];
    } else {
      progress = 1;
    }
  }
  const multiplier = 1 + progress; // 2周目はゲージ割合に応じて最大2倍まで上昇
  const baseRadius = 140;
  const radius = baseRadius * multiplier;
  const colors = { freeze:"gray", meteor:"red", heal:"green" };
  const texts  = { freeze:"❄️ フリーズ！！", meteor:"☄️ メテオ！！", heal:"✨ ヒーリング！！" };

  specialEffects.push(new ExpandingEffectZone(x,y,type,baseRadius,radius,multiplier));
  specialEffects.push(new SpecialCircle(x,y,colors[type],radius));
  specialEffects.push(new SpecialText(texts[type]));

  mana[type] = 0;
  manaCharges[type] = 0;
  updateManaUI(type);
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
