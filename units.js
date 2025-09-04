// ---- 基本ステータス ----
let unitStats = {
  swordsman:{hp:120, atk:10, speed:0.25, range:25},
  archer:{hp:80,  atk:8,  speed:0.25, range:120},
  healer:{hp:100, atk:10, speed:0.25, range:80},
  goblin:{hp:60,  atk:5,  speed:0.20, range:25},
  orc:   {hp:200, atk:15, speed:0.20, range:25},
  shaman:{hp:120, atk:12, speed:0.25, range:120},
  phantom:{hp:80, atk:10, speed:0.50, range:100},
  golem: {hp:400, atk:20, speed:0.10, range:25}
};

class Unit{
  constructor(type, side, lane, y){
    this.type=type; this.side=side; this.lane=lane;
    this.x = lane*(canvas.width/5) + (canvas.width/10);
    this.y = y;
    const st = unitStats[type];
    this.hp=st.hp; this.atk=st.atk; this.speed=st.speed||0.2; this.range=st.range||25;
    this.role = (type==="archer")?"archer":(type==="healer")?"healer":"melee";
    if(type==="shaman") this.role="shaman";
    if(type==="phantom") this.role="phantom";
    this.color = (side==="player") ? (type==="archer"?"cyan":type==="healer"?"green":"blue") : "red";
    const nameMap={swordsman:"ナ", archer:"弓", healer:"聖", goblin:"ゴ", orc:"オ", shaman:"シ", phantom:"フ", golem:"ゴレ"};
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
    if(this.target){
      if(this.target.hp<=0 || !inMeleeRange(this,this.target)) this.target=null;
      else return;
    }
    this.y += (this.side==="player" ? -this.speed : this.speed);
  }
}
