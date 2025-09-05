// ---- スライダー設定範囲 ----
const unitConfig = {
  swordsman:{name:"ナイト", props:{hp:[50,300], atk:[5,30], speed:[0.1,1,0.05], range:[10,100]}},
  archer:{name:"アーチャー", props:{hp:[40,200], atk:[5,30], speed:[0.1,1,0.05], range:[30,150]}},
  healer:{name:"クレリック", props:{hp:[40,200], atk:[5,30], speed:[0.1,1,0.05], range:[30,150]}},
  goblin:{name:"ゴブリン", props:{hp:[20,200], atk:[2,20], speed:[0.1,1,0.05], range:[10,100]}},
  orc:{name:"オーク", props:{hp:[100,500], atk:[10,50], speed:[0.05,0.5,0.05], range:[10,100]}},
  shaman:{name:"シャーマン", props:{hp:[50,250], atk:[5,30], speed:[0.1,0.5,0.05], range:[50,150]}},
  phantom:{name:"ファントム", props:{hp:[30,150], atk:[5,25], speed:[0.2,1,0.05], range:[30,120]}},
  golem:{name:"ゴーレム", props:{hp:[200,1000], atk:[10,50], speed:[0.05,0.3,0.05], range:[10,100]}}
};

// ✅ unitStats を必ず参照できるようにする
if (typeof unitStats === "undefined") {
  console.error("unitStats がまだ定義されていません。units.js が先に読み込まれているか確認してください。");
}

const unitSlidersDiv = document.getElementById("unitSliders");
if (unitSlidersDiv && typeof unitStats !== "undefined"){
  for (let key in unitConfig){
    let html = `<div class="unit-settings"><h3>${unitConfig[key].name}</h3>`;
    for (let prop in unitConfig[key].props){
      const [min,max,step=1] = unitConfig[key].props[prop];
      const val = unitStats[key][prop] ?? 0; // ← 参照できない場合は0
      html += `${prop.toUpperCase()}: <input type="range" id="${key}_${prop}" min="${min}" max="${max}" step="${step}" value="${val}" oninput="updateLabel('${key}_${prop}')">
               <span id="${key}_${prop}_val">${val}</span><br>`;
    }
    html += `</div>`;
    unitSlidersDiv.innerHTML += html;
  }
}


function updateLabel(id){ const el=document.getElementById(id); const v=document.getElementById(id+"_val"); if(el&&v) v.textContent=el.value; }
function applySettingsAndStart(){
  for (let key in unitStats){
    for (let prop in unitStats[key]){
      const id = `${key}_${prop}`;
      const el = document.getElementById(id);
      if(el) unitStats[key][prop] = parseFloat(el.value);
    }
  }
  startGame();
}
function showSettings(){ document.getElementById("menu").style.display="none"; document.getElementById("settings").style.display="block"; }
function backToMenu(){   document.getElementById("settings").style.display="none"; document.getElementById("menu").style.display="block"; }
function showHelp(){     document.getElementById("menu").style.display="none"; document.getElementById("help").style.display="block"; }
function backToMenuFromHelp(){ document.getElementById("help").style.display="none"; document.getElementById("menu").style.display="block"; }

window.applySettingsAndStart = applySettingsAndStart;
window.showSettings = showSettings;
window.backToMenu = backToMenu;
window.showHelp = showHelp;
window.backToMenuFromHelp = backToMenuFromHelp;
