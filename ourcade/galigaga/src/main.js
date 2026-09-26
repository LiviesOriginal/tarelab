const REPO='https://raw.githubusercontent.com/sunny567s35/Galaga_game/main/galaga/';
const IMG={player:REPO+'images/player.png',enemy:REPO+'images/enemy-2.png',enemy2:REPO+'images/enemy-1.png',enemy3:REPO+'images/enemy.png',bullet:REPO+'images/missile2.png',enemyBullet:REPO+'images/missile1.png',stars:REPO+'images/stars.png',blast:REPO+'images/blast.gif'};
const AUDIO={music:'/ourcade/galigaga/audio/applause-loop.ogg',laser:REPO+'audio/audio_laser.ogg',hit:REPO+'audio/killenemy.mp3',enemyHit:REPO+'audio/audio_enemy-hit.ogg'};
const keys={};
const SPEED={ship:12};

const messages=[
 "Live for the applause, applause, applause 👏",
 "You're on the Edge of Glory! 🌟",
 "Hold your head up, girl, and you'll go far 🚀",
 "Baby you were born this way ⭐",
 "The only war worth fighting for 💫",
 "You're far from the shallow now 🚀"
];
const KEY='galigaga-high-scores';
let scores=JSON.parse(localStorage.getItem(KEY)||'[]');
let sound=localStorage.getItem('galigaga-sound')!=='off';
let audio={};
function playMusic(){
  if(!sound)return;
  if(!audio.music){
    audio.music=new Audio(AUDIO.music);
    audio.music.loop=true;
    audio.music.volume=.35;
    audio.music.preload='auto';
  }
  const p=audio.music.play();
  if(p?.catch)p.catch(()=>{});
}
function stopMusic(){if(audio.music){audio.music.pause();audio.music.currentTime=0;}}
let state=null;

function esc(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function saveScores(){localStorage.setItem(KEY,JSON.stringify(scores.slice(0,3)));}
function isHigh(score){return scores.length<3||score>scores[scores.length-1].score;}
function play(src,loop=false){if(!sound)return; try{const a=new Audio(src);a.loop=loop;a.volume=.35;a.play().catch(()=>{}); if(loop)audio.music=a; return a;}catch{}}
function renderShell(content, cls=''){document.querySelector('#app').innerHTML=`<main class="cabinet ${cls}"><div class="scanlines"></div>${content}</main>`;}
function hearts(n){return Array.from({length:15},(_,i)=>`<span class="heart ${i<n?'full':''}">♥</span>`).join('');}
function scoreBoard(){
  const rows=Array.from({length:3},(_,i)=>{
    const s=scores[i]||{initials:'XYZ',score:0};
    return `<div class="score-row"><span>${i+1}. ${esc(s.initials)}</span><b>${s.score.toString().padStart(5,'0')}</b></div>`;
  });
  return rows.join('');
}

function title(){stopMusic(); renderShell(`<section class="title-screen">
  <div class="logo">GALIGAGA</div><div class="subtitle">A GALAGA-STYLE ARCADE SHOOTER</div>
  <div class="attract"><img src="${IMG.enemy}"/><span>READY PILOT</span><img src="${IMG.player}"/></div>
  <button id="play" class="arcade-btn primary">PLAY</button>
  <div class="title-controls"><button id="sound" class="small-btn">SOUND: ${sound?'ON':'OFF'}</button></div>
  <section class="scores"><h2>HIGH SCORES</h2>${scoreBoard()}</section>
  <p class="credit">© GALIGAGA</p>
</section>`);
  document.querySelector('#play').onclick=()=>start(); document.querySelector('#sound').onclick=()=>toggleSound();
}
function toggleSound(){sound=!sound;localStorage.setItem('galigaga-sound',sound?'on':'off'); if(!sound)stopMusic(); title();}

function start(){
  state={score:0,lives:15,level:1,screen:1,playing:true,lastFrame:0,player:{x:50,y:87,targetX:50,targetY:87},shots:[],enemies:[],enemyShots:[],lastShot:0,lastEnemy:0,diveTimer:0,formationDir:1};
  makeWave(); game();
}
function makeWave(){
  state.enemies=[]; const rows=3, cols=7; for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)state.enemies.push({x:16+c*11.3,y:17+r*8,alive:true,row:r,diving:false,phase:Math.random()*6});
}
function game(){stopMusic(); playMusic(); renderShell(`<section class="game-screen">
  <header class="hud"><div class="hud-left"><button id="mute" class="small-btn">SOUND: ${sound?'ON':'OFF'}</button><div>SCORE <b id="score">00000</b></div></div><div class="stage">STAGE ${String(state.level).padStart(2,'0')}<span>SCREEN ${state.screen}</span></div><div class="hud-right"><div class="lives" id="lives">${hearts(state.lives)}</div><button id="menu" class="small-btn">MENU</button></div></header>
  <div id="arena"><div class="formation" id="formation"></div><div id="shots"></div><div id="enemyShots"></div><img id="ship" class="ship" src="${IMG.player}"/></div>
  <div class="touch-hint">DRAG TO MOVE • HOLD TO FIRE</div>
</section>`);
  document.querySelector('#menu').onclick=()=>title(); document.querySelector('#mute').onclick=()=>toggleInGameSound();
  bindControls(); draw(); requestAnimationFrame(loop);
}
function toggleInGameSound(){sound=!sound;localStorage.setItem('galigaga-sound',sound?'on':'off');if(!sound)stopMusic(); else playMusic();document.querySelector('#mute').textContent='SOUND: '+(sound?'ON':'OFF');}
function bindControls(){const arena=document.querySelector('#arena');let firing=false;let activeTouch=false;
 const setPosition=(clientX,clientY)=>{const r=arena.getBoundingClientRect();const x=(clientX-r.left)/r.width*100;const y=(clientY-r.top)/r.height*100;state.player.targetX=Math.max(7,Math.min(93,x));state.player.targetY=Math.max(50,Math.min(92,y));};
 const stopFire=()=>{firing=false;activeTouch=false;};
 const start=(e)=>{const p=e.touches?.[0]||e;setPosition(p.clientX,p.clientY);firing=true;activeTouch=true;e.preventDefault?.();};
 const move=(e)=>{if(!activeTouch)return;const p=e.touches?.[0]||e;setPosition(p.clientX,p.clientY);e.preventDefault?.();};
 arena.addEventListener('pointerdown',start,{passive:false});arena.addEventListener('pointermove',move,{passive:false});arena.addEventListener('pointerup',stopFire);arena.addEventListener('pointercancel',stopFire);
 arena.addEventListener('touchstart',start,{passive:false});arena.addEventListener('touchmove',move,{passive:false});arena.addEventListener('touchend',stopFire,{passive:true});arena.addEventListener('touchcancel',stopFire,{passive:true});
 window.addEventListener('pointerup',stopFire);window.addEventListener('blur',stopFire);
window.addEventListener('keydown',e=>{if(e.key===' '){firing=true;e.preventDefault();}keys[e.key]=true;});
window.addEventListener('keyup',e=>{if(e.key===' ')firing=false;keys[e.key]=false;});
state.isFiring=()=>firing;}
function loop(t){if(!state?.playing)return; update(t);draw();requestAnimationFrame(loop);}
function update(t){
 const frameScale=(t-state.lastFrame||16.667)/16.667;
 const shipStep=(SPEED.ship/672)*100*frameScale;
  const moveStep=2.5*frameScale;
  if(keys['ArrowLeft'])state.player.targetX=Math.max(7,state.player.targetX-moveStep);
  if(keys['ArrowRight'])state.player.targetX=Math.min(93,state.player.targetX+moveStep);
  if(keys['ArrowUp'])state.player.targetY=Math.max(18,state.player.targetY-moveStep);
  if(keys['ArrowDown'])state.player.targetY=Math.min(92,state.player.targetY+moveStep);
 const dx=state.player.targetX-state.player.x;
 const dy=state.player.targetY-state.player.y;
 state.player.x += Math.sign(dx)*Math.min(Math.abs(dx),shipStep);
 state.player.y += Math.sign(dy)*Math.min(Math.abs(dy),shipStep);
 state.lastFrame=t;
 if(state.isFiring?.() && t-state.lastShot>190){state.shots.push({x:state.player.x,y:state.player.y-4});state.lastShot=t;play(AUDIO.laser);}
 state.shots.forEach(s=>s.y-=1.6); state.shots=state.shots.filter(s=>s.y>-5);
 state.formationDir=state.formationDir; state.enemies.forEach(e=>{if(!e.alive)return; if(!e.diving)e.x+=state.formationDir*.035; else {e.phase+=.07;e.y+=.16;e.x+=Math.sin(e.phase)*.45;if(e.y>96){e.diving=false;e.y=17+e.row*8;e.x=10+Math.random()*80;}}});
 const xs=state.enemies.filter(e=>e.alive&&!e.diving).map(e=>e.x); if(xs.length&&(Math.max(...xs)>93||Math.min(...xs)<7))state.formationDir*=-1;
 if(t-state.diveTimer>1100){const candidates=state.enemies.filter(e=>e.alive&&!e.diving);if(candidates.length){candidates[Math.floor(Math.random()*candidates.length)].diving=true;state.diveTimer=t;}}
 if(t-state.lastEnemy>850){const alive=state.enemies.filter(e=>e.alive);if(alive.length){const e=alive[Math.floor(Math.random()*alive.length)];state.enemyShots.push({x:e.x,y:e.y+3});state.lastEnemy=t;}}
 state.enemyShots.forEach(s=>s.y+=.65); state.enemyShots=state.enemyShots.filter(s=>s.y<105);
 for(const s of state.shots){for(const e of state.enemies){if(e.alive&&Math.hypot(s.x-e.x,s.y-e.y)<4.2){e.alive=false;s.y=-99;state.score+=e.diving?150:100;play(AUDIO.hit);}}}
 for(const e of state.enemies){if(e.alive&&Math.hypot(e.x-state.player.x,e.y-state.player.y)<5.8){e.alive=false;loseLife();break;}}
 for(const s of state.enemyShots){if(Math.hypot(s.x-state.player.x,s.y-state.player.y)<4.2){s.y=999;loseLife();break;}}
 if(state.lives>0 && state.enemies.every(e=>!e.alive)){advance();}
}
function loseLife(){if(state.invuln)return;state.invuln=true;state.lives--;updateHud(); if(state.lives<=0){setTimeout(()=>gameOver(),650);return;} setTimeout(()=>{state.invuln=false;state.shots=[];state.enemyShots=[];state.player.x=50;state.player.y=87;state.player.targetX=50;state.player.targetY=87;},900);}
function advance(){state.level++;state.screen=1; state.playing=false; renderShell(`<section class="transition"><div class="transition-title">STAGE ${String(state.level).padStart(2,'0')}</div><div class="transition-sub">SCREEN ${state.screen}</div><div class="ready">READY</div></section>`); setTimeout(()=>{if(state.lives>0){state.playing=true;makeWave();game();}},1100);}
function updateHud(){const s=document.querySelector('#score');if(s)s.textContent=String(state.score).padStart(5,'0');const l=document.querySelector('#lives');if(l)l.innerHTML=hearts(state.lives);}
function draw(){if(!document.querySelector('#ship'))return;const ship=document.querySelector('#ship');ship.style.left=state.player.x+'%';ship.style.top=state.player.y+'%';ship.classList.toggle('blink',!!state.invuln);
 const f=document.querySelector('#formation');f.innerHTML=state.enemies.filter(e=>e.alive).map(e=>`<img class="enemy ${e.diving?'diver':''}" style="left:${e.x}%;top:${e.y}%" src="${e.row===0?IMG.enemy3:e.row===1?IMG.enemy2:IMG.enemy}"/>`).join('');
 document.querySelector('#shots').innerHTML=state.shots.map(s=>`<img class="shot" style="left:${s.x}%;top:${s.y}%" src="${IMG.bullet}"/>`).join(''); document.querySelector('#enemyShots').innerHTML=state.enemyShots.map(s=>`<img class="enemy-shot" style="left:${s.x}%;top:${s.y}%" src="${IMG.enemyBullet}"/>`).join(''); updateHud();}
function gameOver(){state.playing=false;stopMusic();const msg=messages[Math.floor(Math.random()*messages.length)];const qualifies=isHigh(state.score);renderShell(`<section class="over"><div class="over-title">GAME OVER</div><p class="message">${msg}</p><div class="final-score">SCORE <b>${String(state.score).padStart(5,'0')}</b></div>${qualifies?`<div class="initials"><label>NEW HIGH SCORE — INITIALS</label><input id="initialInput" maxlength="3" inputmode="text" autocomplete="off" placeholder="XYZ"/></div>`:''}<section class="scores"><h2>HIGH SCORES</h2>${scoreBoard()}</section><div class="over-actions"><button id="again" class="arcade-btn primary">PLAY AGAIN</button><button id="return" class="arcade-btn">RETURN</button></div></section>`);
 if(qualifies){const i=document.querySelector('#initialInput');i.focus();i.oninput=()=>i.value=i.value.replace(/[^a-z]/gi,'').toUpperCase();}
 document.querySelector('#again').onclick=()=>{if(qualifies)recordScore();start();};document.querySelector('#return').onclick=()=>{if(qualifies)recordScore();title();};
}
function recordScore(){const i=document.querySelector('#initialInput');const initials=(i?.value||'XYZ').padEnd(3,'X').slice(0,3);scores.push({initials,score:state.score});scores.sort((a,b)=>b.score-a.score);scores=scores.slice(0,3);saveScores();}
title();
