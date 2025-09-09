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

    this.color = (side==="player") ?
      (type==="archer"?"cyan":type==="healer"?"green":"blue") : "red";

    const nameMap={
      swordsman:"ナ", archer:"弓", healer:"聖",
      goblin:"ゴ", orc:"オ", shaman:"シ",
      phantom:"フ", golem:"ゴレ",
      giantGolem:"巨", dragon:"竜"
    };
    this.label = nameMap[type]||"?";
    this.target=null; this.cooldown=0;
  }

  draw(){
    const barColor = (this.side==="player")?"lime":"red";
    const laneWidth = canvas.width / LANES;
    let hpBarY;

    if(this.role==="dragon"){
      const width = Math.min(canvas.width, canvas.width * (3/LANES));
      const height = 90;
      ctx.fillStyle=this.color;
      ctx.fillRect(this.x - width/2, this.y - height/2, width, height);
      ctx.fillStyle=(this.side==="player")?"white":"black";
      ctx.font="36px sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(this.label,this.x,this.y);
      hpBarY = this.y - height/2 - 15;
    }else{
      ctx.fillStyle=this.color;
      ctx.beginPath(); ctx.arc(this.x,this.y,14,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=(this.side==="player")?"white":"black";
      ctx.font="21px sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(this.label,this.x,this.y);
      hpBarY = this.y - 26;
    }

    // ライフゲージ（左寄せ・最大HP比例）
    const bw = this.maxHp * HP_BAR_SCALE;
    const bh = (this.role==="dragon") ? 9 : 6;
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
