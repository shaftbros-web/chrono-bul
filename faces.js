// Simple canvas drawings for four character faces in a Pokémon-like style
function drawHonorn(ctx, x, y, r){
  ctx.save();
  ctx.translate(x, y);
  const grad = ctx.createLinearGradient(0, -r, 0, r);
  grad.addColorStop(0, '#ffb347');
  grad.addColorStop(1, '#ff0000');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.bezierCurveTo(r * 0.8, -r * 0.4, r * 0.6, r * 0.8, 0, r);
  ctx.bezierCurveTo(-r * 0.6, r * 0.8, -r * 0.8, -r * 0.4, 0, -r);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(-r * 0.3, 0, r * 0.1, 0, Math.PI * 2);
  ctx.arc(r * 0.3, 0, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMiztoku(ctx, x, y, r){
  ctx.save();
  ctx.translate(x, y);
  const grad = ctx.createLinearGradient(0, -r, 0, r);
  grad.addColorStop(0, '#add8e6');
  grad.addColorStop(1, '#00008b');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(r, -r * 0.2, r * 0.5, r);
  ctx.quadraticCurveTo(0, r * 0.6, -r * 0.5, r);
  ctx.quadraticCurveTo(-r, -r * 0.2, 0, -r);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(-r * 0.25, -r * 0.1, r * 0.1, 0, Math.PI * 2);
  ctx.arc(r * 0.25, -r * 0.1, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHanamogura(ctx, x, y, r){
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#654321';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#228b22';
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, -r * 0.9);
  ctx.lineTo(-r * 0.4, -r * 0.4);
  ctx.lineTo(-r * 0.9, -r * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(r * 0.7, -r * 0.9);
  ctx.lineTo(r * 0.4, -r * 0.4);
  ctx.lineTo(r * 0.9, -r * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(-r * 0.25, -r * 0.1, r * 0.1, 0, Math.PI * 2);
  ctx.arc(r * 0.25, -r * 0.1, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#006400';
  ctx.beginPath();
  ctx.arc(0, r * 0.1, r * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawKazekushi(ctx, x, y, r){
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#f0f8ff';
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.6, -r * 0.4);
  ctx.lineTo(r * 0.5, r * 0.6);
  ctx.lineTo(-r * 0.5, r * 0.6);
  ctx.lineTo(-r * 0.6, -r * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#00ced1';
  ctx.lineWidth = r * 0.05;
  ctx.stroke();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(-r * 0.25, -r * 0.1, r * 0.1, 0, Math.PI * 2);
  ctx.arc(r * 0.25, -r * 0.1, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#00ced1';
  ctx.beginPath();
  ctx.moveTo(-r * 0.4, r * 0.4);
  ctx.quadraticCurveTo(0, r * 0.6, r * 0.4, r * 0.4);
  ctx.stroke();
  ctx.restore();
}

function drawAllFaces(){
  const canvas = document.getElementById('faceCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  drawHonorn(ctx, 100, 110, 90);
  drawMiztoku(ctx, 300, 110, 90);
  drawHanamogura(ctx, 500, 110, 90);
  drawKazekushi(ctx, 700, 110, 90);
}

window.addEventListener('DOMContentLoaded', drawAllFaces);
