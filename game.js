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
// 城の高さ (上部の敵城、下部の自城)
const CASTLE_HEIGHT = 40;

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

const speedLevels = [0.8,1.2,1.6];
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
    ctx.imageSmoothingEnabled = false;
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
    playerUnits.push(new Unit(pendingUnitType,"player",lane,canvas.height-CASTLE_HEIGHT));
    playerGold -= cost;
    updateGoldUI();
    pendingUnitType = null;
  };

  canvas.onpointerdown = handleFieldTap;

  requestAnimationFrame(loop);
}

function spawnEnemy(){
  // testSpawnType と isContinuousTest は ui.js で定義されるグローバル変数
  if(typeof testSpawnType !== 'undefined' && testSpawnType){
    const lane = (typeof isContinuousTest !== 'undefined' && isContinuousTest) ? Math.floor(Math.random()*LANES) : 2;
    enemyUnits.push(new Unit(testSpawnType, "enemy", lane, CASTLE_HEIGHT));

    if(typeof isContinuousTest !== 'undefined' && !isContinuousTest){
      clearInterval(enemySpawnTimer); // 単体モードの場合はタイマーを停止
      enemySpawnTimer = null;
    }
    return;
  }

  // 通常モード
  const types=["goblin","orc","golem","shaman","phantom"];
  const type=types[Math.floor(Math.random()*types.length)];
  const lane=Math.floor(Math.random()*LANES);
  enemyUnits.push(new Unit(type,"enemy",lane,CASTLE_HEIGHT));
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
function drawBackground(){
  const w = canvas.width;
  const h = canvas.height;

  // 緑の草原
  const grass = ctx.createLinearGradient(0,0,0,h);
  grass.addColorStop(0,"#7cfc00");
  grass.addColorStop(1,"#228B22");
  ctx.fillStyle = grass;
  ctx.fillRect(0,0,w,h);

  // 敵の悪魔城 (上部)
  ctx.fillStyle = "#2b2b2b";
  ctx.fillRect(0,0,w,CASTLE_HEIGHT);
  ctx.strokeStyle = "#550000";
  for(let i=0;i<w;i+=20){
    ctx.beginPath();
    ctx.moveTo(i,0);
    ctx.lineTo(i,CASTLE_HEIGHT);
    ctx.stroke();
  }
  ctx.fillStyle = "#550000";
  for(let i=0;i<w;i+=20){
    ctx.beginPath();
    ctx.moveTo(i,CASTLE_HEIGHT);
    ctx.lineTo(i+10,CASTLE_HEIGHT-15);
    ctx.lineTo(i+20,CASTLE_HEIGHT);
    ctx.closePath();
    ctx.fill();
  }

  // 自陣の白亜城 (下部)
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(0,h-CASTLE_HEIGHT,w,CASTLE_HEIGHT);
  ctx.strokeStyle = "#cccccc";
  for(let i=0;i<w;i+=20){
    ctx.beginPath();
    ctx.moveTo(i,h-CASTLE_HEIGHT);
    ctx.lineTo(i,h);
    ctx.stroke();
  }
  ctx.fillStyle = "#e0e0e0";
  for(let i=0;i<w;i+=40){
    ctx.fillRect(i,h-CASTLE_HEIGHT-10,20,10);
  }
}

function loop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawBackground();
  ctx.strokeStyle="#555";
  for(let i=1;i<LANES;i++){
    const x = i*canvas.width/LANES;
    ctx.beginPath();
    ctx.moveTo(x,CASTLE_HEIGHT);
    ctx.lineTo(x,canvas.height-CASTLE_HEIGHT);
    ctx.stroke();
  }
  ctx.fillStyle="white";
  ctx.fillText(`自陣HP:${playerBaseHP}`,10,15);
  ctx.fillText(`敵陣HP:${enemyBaseHP}`,280,15);

  for(const u of [...playerUnits,...enemyUnits]){ u.update(); u.draw(); }

  // === 攻撃ロジック ===

  // 1. 近接戦闘のターゲット設定
  //    - 各ユニットは、近接範囲にいる敵をターゲットに設定する
  for (const u of [...playerUnits, ...enemyUnits]) {
    // ターゲットが既にいるか、範囲外・死亡ならリセット
    if (u.target && (u.target.hp <= 0 || !inMeleeRange(u, u.target))) {
      u.target = null;
    }
    // 新しいターゲットを探す
    if (!u.target) {
      const enemies = (u.side === "player") ? enemyUnits : playerUnits;
      for (const enemy of enemies) {
        if (enemy.hp > 0 && inMeleeRange(u, enemy)) {
          u.target = enemy;
          if (!enemy.target) enemy.target = u; // 相手にも設定
          break;
        }
      }
    }
  }

  // 2. 攻撃実行
  //    - 全ユニットがクールダウン終わっていれば行動する
  for (const u of [...playerUnits, ...enemyUnits]) {
    if (u.cooldown > 0) continue;

    // 2a. 近接攻撃 (ターゲットがいる場合)
    if (u.target) {
      const target = u.target;
      let dmg = (u.meleeAtk !== undefined) ? u.meleeAtk : u.atk;
      target.hp -= dmg;
      hitMarks.push(new HitMark(target.x, target.y));
      floatingTexts.push(new FloatingText(target.x, target.y - 15, `-${dmg}`));
      swingMarks.push(new SwingMark(u.x, u.y, u.side));
      u.cooldown = (u.side === "player") ? 15 : 80;
    }
    // 2b. 遠距離攻撃 & 回復 (近接中でない場合)
    else {
      const enemies = (u.side === "player") ? enemyUnits : playerUnits;
      if (u.role === "archer" || u.role === "shaman" || u.role === "phantom" || u.role === "golem" || u.role === "dragon") {
        if (enemies.length > 0) {
          // 射程内の敵を探す
          const target = enemies.find(e => e.hp > 0 && inUnitRange(u, e));
          if (target) {
            let options = {};
            let yOffset = (u.side === 'player' ? -14 : 14);
            if (u.role === "archer") {
              options = {shape:"arrow", color:"white", size:12}; u.cooldown = 60;
            } else if (u.role === "shaman") {
              options = {shape:"arrow", color:"blue", size:12}; u.cooldown = 160;
            } else if (u.role === "phantom") {
              options = {color:"white", size:9}; u.cooldown = 100;
            } else if (u.role === "golem") {
              options = (u.type === "giantGolem") ? {shape:"rock", color:"gray", size:21} : {shape:"square", color:"brown", size:12};
              u.cooldown = 200;
            } else if (u.role === "dragon") {
              options = {shape:"fireball", color:"orange", size:24}; u.cooldown = 150;
            }
            projectiles.push(new Projectile(u.x, u.y + yOffset, target, u.atk, options));
          }
        }
      } else if (u.role === "healer") {
        const allyToHeal = playerUnits.find(ally => ally !== u && ally.hp > 0 && ally.hp < unitStats[ally.type].hp && inUnitRange(u, ally));
        if (allyToHeal) {
          projectiles.push(new HealProjectile(u.x, u.y - 14, allyToHeal, u.atk));
          u.cooldown = 45;
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
      
      // 報酬ゴールドを削除し、能力アップに変更
      p.atk *= 1.05;
      p.meleeAtk *= 1.05;
      p.maxHp *= 1.05;
      
      p.y = canvas.height - CASTLE_HEIGHT;
      p.hp = p.maxHp; // 新しい最大HPにリセット
      
      // 能力アップ表示
      floatingTexts.push(new FloatingText(p.x, p.y - 40, "POWER UP!", "gold"));
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
ow.showSettings = showSettings;
window.backToMenu = backToMenu;
window.showHelp = showHelp;
window.backToMenuFromHelp = backToMenuFromHelp;
window.chooseUnit = chooseUnit;
window.useSpecial = useSpecial;
window.toggleSpeed = toggleSpeed;
