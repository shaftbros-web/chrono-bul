class Projectile{
  constructor(x,y,target,atk,opts="white"){ this.x=x; this.y=y; this.target=target; this.atk=atk; this.speed=3; this.active=true; if(typeof opts==="string"){ this.color=opts; this.shape="circle"; } else { this.color=opts.color||"white"; this.shape=opts.shape||"circle"; } }
  update(){
    if(!this.target || this.target.hp<=0){ this.active=false; return; }
    const dx=this.target.x-this.x, dy=this.target.y-this.y;
    const d=Math.hypot(dx,dy);
    if(d<5){ this.target.hp-=this.atk; hitMarks.push(new HitMark(this.target.x,this.target.y)); this.active=false; }
    else { this.x += (dx/d)*this.speed*gameSpeed; this.y += (dy/d)*this.speed*gameSpeed; }
  }
  draw(){ ctx.fillStyle=this.color; if(this.shape==="square"){ ctx.fillRect(this.x-4,this.y-4,8,8); } else { ctx.beginPath(); ctx.arc(this.x,this.y,4,0,Math.PI*2); ctx.fill(); } }
}
class HealProjectile{
  constructor(x,y,target,amount){ this.x=x; this.y=y; this.target=target; this.amount=amount; this.speed=3; this.active=true; }
  update(){
    if(!this.target || this.target.hp<=0){ this.active=false; return; }
    const dx=this.target.x-this.x, dy=this.target.y-this.y;
    const d=Math.hypot(dx,dy);
    if(d<5){ this.target.hp += this.amount; hitMarks.push(new HealMark(this.target.x,this.target.y)); this.active=false; }
    else { this.x += (dx/d)*this.speed*gameSpeed; this.y += (dy/d)*this.speed*gameSpeed; }
  }
  draw(){ ctx.fillStyle="lime"; ctx.beginPath(); ctx.arc(this.x,this.y,4,0,Math.PI*2); ctx.fill(); }
}
class HitMark{ constructor(x,y){ this.x=x; this.y=y; this.life=15; } update(){ this.life-=gameSpeed; }
  draw(){ ctx.lineWidth=3; ctx.strokeStyle="red"; ctx.beginPath(); ctx.moveTo(this.x-8,this.y-8); ctx.lineTo(this.x+8,this.y+8);
         ctx.moveTo(this.x+8,this.y-8); ctx.lineTo(this.x-8,this.y+8); ctx.stroke(); ctx.lineWidth=1; } }
class HealMark{ constructor(x,y){ this.x=x; this.y=y; this.life=15; } update(){ this.life-=gameSpeed; }
  draw(){ ctx.strokeStyle="lime"; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(this.x,this.y,14,0,Math.PI*2); ctx.stroke(); ctx.lineWidth=1; } }
class SwingMark{ constructor(x,y,side){ this.x=x; this.y=y; this.life=12; this.side=side; } update(){ this.life-=gameSpeed; }
  draw(){ ctx.save(); ctx.lineWidth=3; ctx.strokeStyle=(this.side==="player")?"#88f":"#f88";
         ctx.beginPath(); ctx.arc(this.x,this.y,16,-Math.PI/3,0); ctx.stroke();
         ctx.beginPath(); ctx.arc(this.x,this.y,12,0,Math.PI/3); ctx.stroke(); ctx.restore(); } }

// 特殊攻撃の範囲エフェクト
const SPECIAL_CIRCLE_LINE_WIDTH = 10;

class SpecialCircle{
  constructor(x,y,color){
    this.x=x; this.y=y; this.color=color;
    this.radius=0; this.active=true; this.count=0;
  }
  update(){
    this.radius += 8*gameSpeed;
    if(this.radius > 140){
      this.count++;
      if(this.count>=3) this.active=false;
      else this.radius=0;
    }
  }
  draw(){
    ctx.save();
    ctx.strokeStyle=this.color;
    ctx.lineWidth = SPECIAL_CIRCLE_LINE_WIDTH;
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);
    ctx.stroke();
    ctx.restore();
  }
}

// 特殊攻撃の字幕表示
class SpecialText{
  constructor(text){ this.text=text; this.life=60; this.active=true; }
  update(){ this.life-=gameSpeed; if(this.life<=0) this.active=false; }
  draw(){
    ctx.save();
    ctx.fillStyle="white";
    ctx.font="40px sans-serif";
    ctx.textAlign="center";
    ctx.globalAlpha = this.life/60;
    ctx.fillText(this.text, canvas.width/2, canvas.height/2);
    ctx.restore();
  }
}
