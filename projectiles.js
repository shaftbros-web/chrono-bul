class Projectile{

  constructor(x,y,target,atk,opts="white"){
    this.x=x; this.y=y; this.target=target; this.atk=atk;
    this.speed=3; this.active=true;
    if(typeof opts === "string"){
      this.color=opts; this.shape="circle"; this.size=4;
    }else{
      const o=opts||{};
      this.color=o.color||"white"; 
      this.shape=o.shape||"circle"; 
      this.size=o.size||4;
    }
    this.angle=0;
  }
  update(){
    if(!this.target || this.target.hp<=0){ this.active=false; return; }
    const dx=this.target.x-this.x, dy=this.target.y-this.y;
    const d=Math.hypot(dx,dy);
    this.angle=Math.atan2(dy,dx);
    if(d<5){
      this.target.hp -= this.atk;
      hitMarks.push(new HitMark(this.target.x,this.target.y));
      floatingTexts.push(new FloatingText(this.target.x, this.target.y-10, `-${this.atk}`));
      this.active=false;
    }
    else { this.x += (dx/d)*this.speed*gameSpeed; this.y += (dy/d)*this.speed*gameSpeed; }
  }

  draw(){
    ctx.fillStyle=this.color;
    if(this.shape==="arrow"){
      ctx.save();
      ctx.translate(this.x,this.y);
      ctx.rotate(this.angle);
      ctx.beginPath();
      ctx.moveTo(-this.size,-this.size/2);
      ctx.lineTo(-this.size,this.size/2);
      ctx.lineTo(this.size,0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }else if(this.shape==="fireball"){
      ctx.save();
      const g = ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.size);
      g.addColorStop(0,"orange");
      g.addColorStop(1,"red");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(this.x,this.y,this.size,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }else{
      ctx.beginPath();
      ctx.arc(this.x,this.y,this.size,0,Math.PI*2);
      ctx.fill();
    }
  }
}
class HealProjectile{
  constructor(x,y,target,amount,size=4){ this.x=x; this.y=y; this.target=target; this.amount=amount; this.size=size; this.speed=3; this.active=true; }
  update(){
    if(!this.target || this.target.hp<=0){ this.active=false; return; }
    const dx=this.target.x-this.x, dy=this.target.y-this.y;
    const d=Math.hypot(dx,dy);
    if(d<5){
      this.target.hp += this.amount;
      hitMarks.push(new HealMark(this.target.x,this.target.y));
      floatingTexts.push(new FloatingText(this.target.x, this.target.y-10, `+${this.amount}`, "green"));
      this.active=false;
    }
    else { this.x += (dx/d)*this.speed*gameSpeed; this.y += (dy/d)*this.speed*gameSpeed; }
  }
  draw(){
    ctx.save();
    const g = ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.size);
    g.addColorStop(0,"rgba(0,255,0,1)");
    g.addColorStop(1,"rgba(0,255,0,0)");
    ctx.fillStyle = g;
    ctx.shadowBlur = this.size*2;
    ctx.shadowColor = "lime";
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.size,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
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

class FloatingText{
  constructor(x,y,text,color="white"){
    this.x=x; this.y=y; this.text=text; this.color=color; this.life=30;
  }
  update(){
    this.y -= 0.5*gameSpeed;
    this.life -= gameSpeed;
  }
  draw(){
    ctx.save();
    ctx.fillStyle=this.color;
    ctx.font="16px sans-serif";
    ctx.textAlign="center";
    ctx.globalAlpha = this.life/30;
    ctx.fillText(this.text,this.x,this.y);
    ctx.restore();
  }
}
