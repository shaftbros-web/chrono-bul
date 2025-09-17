// ---- バージョン管理 ----
const VERSION = "0.2.36";
const FULL_TITLE = `Chrono Bulward v${VERSION} (modular)`;
document.title = FULL_TITLE;
const titleEl = document.getElementById("titleText");
if (titleEl) titleEl.textContent = FULL_TITLE;

// ---- スライダー設定範囲 ----
const unitConfig = {
  swordsman:{name:"ナイト", props:{hp:[50,300], atk:[5,30], speed:[0.1,1,0.05], range:[10,100]}},
  archer:{name:"アーチャー", props:{hp:[40,200], atk:[5,30], speed:[0.1,1,0.05], range:[30,150]}},
  healer:{name:"クレリック", props:{hp:[40,200], atk:[5,30], speed:[0.1,1,0.05], range:[30,150]}},
  goblin:{name:"ゴブリン", props:{hp:[20,200], atk:[2,20], speed:[0.1,1,0.05], range:[10,100]}},
  orc:{name:"オーク", props:{hp:[100,500], atk:[10,50], speed:[0.05,0.5,0.05], range:[10,100]}},
  shaman:{name:"シャーマン", props:{hp:[50,250], atk:[5,30], speed:[0.1,0.5,0.05], range:[50,150]}},
  phantom:{name:"ファントム", props:{hp:[30,150], atk:[5,25], speed:[0.2,1,0.05], range:[30,120]}},
  golem:{name:"ゴーレム", props:{hp:[200,1000], atk:[10,50], speed:[0.05,0.3,0.05], range:[10,100]}},

  // 🆕 ボス
  giantGolem:{name:"巨大ゴーレム", props:{hp:[800,2000], atk:[20,80], speed:[0.02,0.1,0.01], range:[50,200]}},
  dragon:{name:"邪竜", props:{hp:[600,1500], atk:[30,100], speed:[0.05,0.2,0.01], range:[80,250]}}
};

// テストモード用のグローバル変数
var testSpawnType = null;
var isContinuousTest = false;

const unitSlidersDiv = document.getElementById("unitSliders");
if (unitSlidersDiv && typeof unitStats !== "undefined"){
  for (let key in unitConfig){
    let html = `<div class="unit-settings">
      <h3>
        ${unitConfig[key].name}
        <button onclick="startTestMode('${key}', false)">単体</button>
        <button onclick="startTestMode('${key}', true)">連続</button>
      </h3>`;
    for (let prop in unitConfig[key].props){
      const [min,max,step=1] = unitConfig[key].props[prop];
      const val = unitStats[key][prop] ?? 0;
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

// テストモード開始
function startTestMode(type, isContinuous) {
  testSpawnType = type;
  isContinuousTest = isContinuous;
  console.log("テストモード開始:", type, "連続:", isContinuous);
  applySettingsAndStart();
}

// 通常モード開始 (テストモードをリセット)
function startNormalGame() {
  testSpawnType = null;
  isContinuousTest = false;
  startGame();
}

// 画面切替
function showSettings(){ document.getElementById("menu").style.display="none"; document.getElementById("settings").style.display="block"; }
function backToMenu(){   document.getElementById("settings").style.display="none"; document.getElementById("menu").style.display="block"; }
function showHelp(){     document.getElementById("menu").style.display="none"; document.getElementById("help").style.display="block"; }
function backToMenuFromHelp(){ document.getElementById("help").style.display="none"; document.getElementById("menu").style.display="block"; }
function showChangelog(){ document.getElementById("menu").style.display="none"; document.getElementById("changelog").style.display="block"; }
function backToMenuFromChangelog(){ document.getElementById("changelog").style.display="none"; document.getElementById("menu").style.display="block"; }

// グローバル登録
window.applySettingsAndStart = applySettingsAndStart;
window.startTestMode = startTestMode;
window.startNormalGame = startNormalGame;
window.showSettings = showSettings;
window.backToMenu = backToMenu;
window.showHelp = showHelp;
window.backToMenuFromHelp = backToMenuFromHelp;
window.showChangelog = showChangelog;
window.backToMenuFromChangelog = backToMenuFromChangelog;
