(() => {
const KEY="tarelab_pacman_high_scores_v1", MAX=10;
let activeHigh=0, lastSeen=[null,null];
const load=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(x)?x.filter(e=>e&&Number.isFinite(e.score)):[]}catch(_){return[]}};
const save=x=>{try{localStorage.setItem(KEY,JSON.stringify(x.slice(0,MAX)))}catch(_){}};
const scores=()=>load().sort((a,b)=>b.score-a.score||a.when-b.when).slice(0,MAX);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function refresh(){const el=document.getElementById("pacman-high-score-list");if(!el)return;const rows=scores();el.innerHTML=rows.length?rows.map((e,i)=>'<li><span>'+String(i+1).padStart(2,"0")+". "+esc(e.name)+'</span><strong>'+e.score.toLocaleString()+"</strong></li>").join(""):'<li class="empty">No scores yet</li>'}
function record(score){score=Math.max(0,Math.floor(Number(score)||0));if(!score)return;const cur=scores();if(cur.length>=MAX&&score<=cur[cur.length-1].score)return;let name=prompt("NEW HIGH SCORE! Enter your name:","AAA");if(name===null)name="AAA";name=name.trim().toUpperCase().replace(/[^A-Z0-9 _-]/g,"").slice(0,8)||"AAA";cur.push({name,score,when:Date.now()});save(cur.sort((a,b)=>b.score-a.score||a.when-b.when));refresh()}
const oldGet=Game.getHighScore.bind(Game), oldSet=Game.setHighScore.bind(Game);
Game.getHighScore=function(mode){const top=scores()[0]?.score||0;activeHigh=Math.max(top,activeHigh);return activeHigh||oldGet(mode)||0};
Game.setHighScore=function(mode,score){activeHigh=Math.max(activeHigh,Number(score)||0);try{oldSet(mode,score)}catch(_){}};
const oldUpdate=SceneManager.update.bind(SceneManager);
SceneManager.update=function(){oldUpdate();if(!Game.LAST_SCORES)return;const arr=Game.LAST_SCORES[Game.GAME_MODE]||[];for(let p=0;p<arr.length;p++){const s=arr[p];if(s!=null&&s!==lastSeen[p]){lastSeen[p]=s;record(s)}}refresh()};
window.TarelabPacmanScores={load:scores,record,refresh,clear(){try{localStorage.removeItem(KEY)}catch(_){}refresh()}};
refresh();
})();