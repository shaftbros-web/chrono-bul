// =====================
// ユニットの基本ステータス
// ====================
let unitStats = {
  swordsman:{hp:120, atk:10, speed:0.25, range:25}, // ナイト
  archer:{hp:80, atk:8, meleeAtk:2, speed:0.2, range:140}, // アーチャー
  healer:{hp:100, atk:10, meleeAtk:2, speed:0.2, range:100}, // クレリック
  goblin:{hp:60, atk:5, speed:0.20, range:25}, // ゴブリン
  orc:{hp:200, atk:15, speed:0.20, range:25}, // オーク
  shaman:{hp:120, atk:12, meleeAtk:5, speed:0.25, range:140}, // シャーマン
  phantom:{hp:80, atk:10, meleeAtk:5, speed:0.4, range:120}, // ファントム
  golem:{hp:400, atk:20, meleeAtk:20, speed:0.1, range:100}, // ゴーレム

  // 🆕 ボス追加
  giantGolem:{hp:1500, atk:40, meleeAtk:40, speed:0.1, range:250}, // 巨大ゴーレム
  dragon:{hp:2500, atk:50, meleeAtk:80, speed:0.1, range:250}       // 邪竜
};

// ライフゲージの1HPあたりの幅
const HP_BAR_SCALE = 0.4;

// =====================
// ドラクエ風スプライト定義
// =====================
// 0:透明 1:輪郭 2:体色(側で変化) 3:肌色
const SPRITES = {
  player: [
    "0001111000",
    "0013333100",
    "0132222310",
    "0132222310",
    "0132222310",
    "0013333100",
    "0011111100",
    "0110000110",
    "0110000110",
    "0011001100"
  ],
  enemy: [
    "0000000000",
    "0001111000",
    "0012222100",
    "0122222210",
    "0122222210",
    "0122222210",
    "0012222100",
    "0001111000",
    "0000000000"
  ]
};

function drawDQSprite(side, x, y, scale = 2){
  const pattern = SPRITES[side];
  const h = pattern.length;
  const w = pattern[0].length;
  const startX = x - (w * scale) / 2;
  const startY = y - (h * scale) / 2;
  const primary = (side === "player") ? "#3b5dc9" : "#b22222";
  const palette = { "0": null, "1": "#000", "2": primary, "3": "#ffe0b3" };
  for(let j=0;j<h;j++){
    for(let i=0;i<w;i++){
      const code = pattern[j][i];
      const color = palette[code];
      if(color){
        ctx.fillStyle = color;
        ctx.fillRect(startX + i*scale, startY + j*scale, scale, scale);
      }
    }
  }
  return { width: w * scale, height: h * scale };
}

// =====================
// ユニットクラス
// =====================
class Unit {
  constructor(type, side, lane, y){
    this.type=type; this.side=side; this.lane=lane;
    const laneWidth = canvas.width / LANES;
    this.x = lane*laneWidth + laneWidth/2;
    this.y = y;
    const st = unitStats[type];
    this.hp=st.hp; this.atk=st.atk;
    this.maxHp = st.hp; // ライフゲージ用に最大HPを保持
    this.meleeAtk = (st.meleeAtk !== undefined) ? st.meleeAtk : st.atk;
    this.speed=st.speed||0.2;
    this.range=st.range||25;

    this.role = "melee";
    if(type==="archer") this.role="archer";
    if(type==="healer") this.role="healer";
    if(type==="shaman") this.role="shaman";
    if(type==="phantom") this.role="phantom";
    if(type==="golem" || type==="giantGolem") this.role="golem";
    if(type==="dragon") this.role="dragon";

    this.target=null; this.cooldown=0;
  }

  draw(){
    const barColor = (this.side==="player")?"lime":"red";
    const laneWidth = canvas.width / LANES;
    const scale = (this.role==="dragon"||this.role==="golem"||this.role==="giantGolem") ? 4 : 2;
    const size = drawDQSprite(this.side, this.x, this.y, scale);
    const hpBarY = this.y - size.height/2 - 6;

    // ライフゲージ（左寄せ・最大HP比例）
    const bw = this.maxHp * HP_BAR_SCALE;
    const bh = 6;
    const bx = this.lane * laneWidth + 2; // 少し左側にスペースを空ける
    const ratio = Math.max(0, Math.min(this.hp, this.maxHp)) / this.maxHp;
    ctx.fillStyle="black";
    ctx.fillRect(bx, hpBarY, bw, bh);
    ctx.fillStyle = barColor;
    ctx.fillRect(bx, hpBarY, bw * ratio, bh);
  }

  update(){
    if(this.target){
      if(this.target.hp<=0 || !inMeleeRange(this,this.target)) this.target=null;
      else return;
    }

    // 遠隔持ちは射程内に敵がいたら停止（クレリックを除く）
    if(this.role==="archer" || this.role==="shaman" ||
       this.role==="phantom" || this.role==="golem" || this.role==="dragon" ||
       this.role==="giantGolem"){
      let enemyList = (this.side==="player") ? enemyUnits : playerUnits;
      for(const e of enemyList){
        if(inUnitRange(this,e)){
          return;
        }
      }
    }

    this.y += (this.side==="player" ? -this.speed : this.speed) * gameSpeed;
  }
}

window.unitStats = unitStats;
window.Unit = Unit;
