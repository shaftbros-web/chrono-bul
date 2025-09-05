// =====================
// ユニットの基本ステータス
// ====================
let unitStats = {
  swordsman:{hp:120, atk:10, speed:0.125, range:25}, // ナイト
  archer:{hp:80, atk:8, meleeAtk:2, speed:0.125, range:140}, // アーチャー
  healer:{hp:100, atk:10, meleeAtk:2, speed:0.125, range:100}, // クレリック
  goblin:{hp:60, atk:5, speed:0.10, range:25}, // ゴブリン
  orc:{hp:200, atk:15, speed:0.10, range:25}, // オーク
  shaman:{hp:120, atk:12, meleeAtk:5, speed:0.125, range:140}, // シャーマン
  phantom:{hp:80, atk:10, meleeAtk:5, speed:0.25, range:120}, // ファントム
  golem:{hp:400, atk:20, meleeAtk:20, speed:0.05, range:100} // ゴーレム
};

// =====================
// ユニットクラス
// =====================
class Unit {
  constructor(type, side, lane, y){
    this.type=type; this.side=side; this.lane=lane;
    this.x = lane*(canvas.width/5) + (canvas.width/10);
    this.y = y;
    const st = unitStats[type];
    this.hp=st.hp; this.atk=st.atk; 
    this.meleeAtk = (st.meleeAtk !== undefined) ? st.meleeAtk : st.atk; 
    this.speed=st.speed||0.2; 
    this.range=st.range||25;

    this.role = "melee";
    if(type==="archer") this.role="archer";
    if(type==="healer") this.role="healer";
    if(type==="shaman") this.role="shaman";
    if(type==="phantom") this.role="phantom";
    if(type==="golem") this.role="golem";

    this.color = (side==="player") ? 
      (type==="archer"?"cyan":type==="healer"?"green":"blue") : "red";

    const nameMap={
      swordsman:"ナ", archer:"弓", healer:"聖", 
      goblin:"ゴ", orc:"オ", shaman:"シ", 
      phantom:"フ", golem:"ゴレ"
    };
    this.label = nameMap[type]||"?";
    this.target=null; this.cooldown=0;
  }

  draw(){
    ctx.fillStyle=this.color;
    ctx.beginPath(); ctx.arc(this.x,this.y,12,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=(this.side==="player")?"white":"black";
    ctx.font="14px sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(this.label,this.x,this.y);
  }

 update(){
  // 近接戦中
  if(this.target){
    if(this.target.hp<=0 || !inMeleeRange(this,this.target)) this.target=null;
    else return; // 戦闘中は停止
  }

  // 遠隔ユニットは、射程内に敵がいれば移動しない
  if(this.role==="archer" || this.role==="healer" || this.role==="shaman" || this.role==="phantom" || this.role==="golem"){
    let enemyList = (this.side==="player") ? enemyUnits : playerUnits;
    for(const e of enemyList){
      if(inUnitRange(this,e)){ 
        return; // 敵が射程内にいる → 停止して射撃
      }
    }
  }

  // 通常移動
  this.y += (this.side==="player" ? -this.speed : this.speed);
}