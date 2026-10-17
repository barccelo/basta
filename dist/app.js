'use strict';
const $=s=>document.querySelector(s);
const cats=categoryGroups.flatMap(g=>g.items);
let cfg={duration:10,names:['Jugador 1','Jugador 2'],target:3,alphabet:'classic',rotate:true,sound:true,tickEnabled:true,tickVolume:55,tickSpeed:'normal',vibrate:true,shape:'square',mode:'free',group:'all',theme:'classic'};
try{const current=localStorage.getItem('basta-settings-v4');const saved=JSON.parse(current||localStorage.getItem('basta-settings-v3')||localStorage.getItem('basta-settings-v2')||'null');if(saved)Object.assign(cfg,saved,current?{}:{shape:'square'})}catch{}
let players=[],turn=0,round=1,used=new Set(),pending=[],needed=1,running=false,started=false,paused=false,deadline=0,left=cfg.duration,angle=0,category='Animales',audio,lastTick=-1,mode='',letters=[],editMode=cfg.mode,confirmAction=null;
let resultPending=false;
let geometry={rx:0,ry:0,total:0,table:[]};
const TAU=Math.PI*2;
function persist(){try{localStorage.setItem('basta-settings-v4',JSON.stringify(cfg))}catch{}}
function alphabet(){return cfg.alphabet==='all'?'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split(''):'ABCDEFGHIJKLMNOPRSTUVW'.split('')}
function init(){players=cfg.names.map(name=>({name,score:0,alive:true}));round=1;turn=0;resetRound()}
function resetRound(){resultPending=false;players.forEach(p=>p.alive=true);used.clear();pending=[];needed=1;started=false;running=false;paused=false;left=cfg.duration;lastTick=-1;build();render()}
function build(){letters=alphabet();$('#letters').replaceChildren();letters.forEach(l=>{const b=document.createElement('button');b.className='letter';b.textContent=l;b.setAttribute('aria-label','Letra '+l);b.onclick=()=>pick(l);$('#letters').append(b)});resize()}
// A shared path keeps the keys and touch rotation on the same perimeter.
function pathPoint(t,rx,ry){const c=Math.cos(t),s=Math.sin(t);if(cfg.shape==='circle')return {x:rx*c,y:ry*s,nx:c,ny:s};const ax=Math.abs(c),ay=Math.abs(s),r=Math.min(rx,ry)*.46,sx=Math.sign(c),sy=Math.sign(s);if(ax>1e-9&&rx/ax*ay<=ry-r)return {x:sx*rx,y:rx/ax*s,nx:sx,ny:0};if(ay>1e-9&&ry/ay*ax<=rx-r)return {x:ry/ay*c,y:sy*ry,nx:0,ny:sy};const cx=rx-r,cy=ry-r,dot=ax*cx+ay*cy,k=dot+Math.sqrt(Math.max(0,dot*dot-cx*cx-cy*cy+r*r)),x=k*ax,y=k*ay;return {x:sx*x,y:sy*y,nx:sx*(x-cx)/r,ny:sy*(y-cy)/r}}
function arcTable(rx,ry){const table=[0];let length=0,p=pathPoint(0,rx,ry);for(let i=1;i<=2048;i++){const q=pathPoint(i/2048*TAU,rx,ry);length+=Math.hypot(q.x-p.x,q.y-p.y);table.push(length);p=q}return {rx,ry,total:length,table}}
function arcAngle(f){const {table,total}=geometry,target=((f%1+1)%1)*total;let lo=0,hi=table.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(table[mid]<=target)lo=mid;else hi=mid}const part=(target-table[lo])/(table[hi]-table[lo]||1);return (lo+part)/2048*TAU}
function resize(){const stage=$('#stage'),style=getComputedStyle(stage);const availW=Math.max(120,stage.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)),availH=Math.max(120,stage.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom));let w=availW,h=availH;if(cfg.shape==='circle')w=h=Math.min(availW,availH);const arena=$('#arena');arena.dataset.shape=cfg.shape;arena.style.width=w+'px';arena.style.height=h+'px';let size=Math.min(76,Math.min(w,h)*.14);for(let i=0;i<4;i++){const rx=w/2-size*.67-6,ry=h/2-size*.67-6;const g=arcTable(rx,ry);size=Math.min(76,Math.min(w,h)*.18,g.total/Math.max(letters.length,1)*.70,(cfg.shape==='circle'?Infinity:Math.min(rx,ry)*.46*(letters.length>22?.64:.75)))}arena.style.setProperty('--key-size',size+'px');arena.style.setProperty('--center-size',Math.min(235,Math.min(w,h)*(cfg.shape==='circle'?.32:.36))+'px');arena.style.setProperty('--board-radius',cfg.shape==='circle'?'50%':(Math.min(w,h)/2-size*.67-6)*.46+size*.67+6+'px');geometry=arcTable(w/2-size*.67-6,h/2-size*.67-6);layout();$('#shapes').querySelectorAll('button').forEach(b=>{const selected=b.dataset.shape===cfg.shape;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected))})}
function layout(){const w=$('#arena').clientWidth,h=$('#arena').clientHeight;[...$('#letters').children].forEach((b,i)=>{const t=arcAngle(i/letters.length+angle/TAU-.25),p=pathPoint(t,geometry.rx,geometry.ry);b.style.left=w/2+p.x+'px';b.style.top=h/2+p.y+'px';const rotation=Math.atan2(p.ny,p.nx)-Math.PI/2;b.style.setProperty('--rotation',rotation+'rad')})}
new ResizeObserver(resize).observe($('#stage'));
function render(){const changed=document.body.classList.contains("playing")!==started;document.body.classList.toggle("playing",started);if(changed)resize();[...$('#letters').children].forEach(b=>{b.classList.toggle('used',used.has(b.textContent));b.classList.toggle('selected',pending.includes(b.textContent));b.setAttribute('aria-pressed',String(used.has(b.textContent)||pending.includes(b.textContent)))});$('#round').textContent='RONDA '+String(round).padStart(2,'0');$('#categoryText').textContent=category;$('#category').disabled=started;$('#remaining').textContent=(letters.length-used.size-pending.length)+' letras disponibles';$('#hitLabel').textContent=resultPending?'CONTINUAR':!started?'EMPEZAR':paused?'REANUDAR':pending.length>=needed?'SIGUIENTE':'TU TURNO';$('#player').textContent=cfg.mode==='free'?'':players[turn]?.name;$('#scores span').textContent=cfg.mode==='free'?'Sin jugadores':'Marcador';$('#pause span').textContent=paused?'Seguir':'Pausa';$('#pause svg').innerHTML=paused?'<path d="m7 4 8 6-8 6Z"/>':'<path d="M7 5v10M13 5v10"/>';$('#pause').disabled=!started;$('#pause').setAttribute('aria-label',paused?'Reanudar temporizador':'Pausar temporizador');$('#answerCount').hidden=needed===1;$('#answerCount').textContent=pending.length+' / '+needed+' RESPUESTAS';drawTime()}
function drawTime(){const n=Math.max(0,Math.ceil(left));$('#time').textContent=n;$('#arena').classList.toggle('urgent',started&&n<=3);$('#progressArc').style.strokeDashoffset=String(100*(1-Math.max(0,Math.min(1,left/cfg.duration))))}
function beep(freq=650,dur=.08){if(!cfg.sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=freq;o.connect(g);g.connect(audio.destination);g.gain.setValueAtTime(.12,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+dur);o.start();o.stop(audio.currentTime+dur)}catch{}}

let nextTickAt=0,tickRemainder=1000;
function tickInterval(secondsLeft){
  const progress=Math.max(0,Math.min(1,1-secondsLeft/cfg.duration));
  const fastest={gentle:260,normal:130,intense:85}[cfg.tickSpeed]||130;
  return 1000-(1000-fastest)*Math.pow(progress,1.25);
}
function tickSound(){
  if(!cfg.sound||!cfg.tickEnabled||Number(cfg.tickVolume)<=0)return;
  try{
    audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();
    const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;
    o.type='sine';o.frequency.value=450;
    g.gain.setValueAtTime(.12*Math.min(100,Number(cfg.tickVolume))/55,t);
    g.gain.exponentialRampToValueAtTime(.001,t+.07);
    o.connect(g);g.connect(audio.destination);o.onended=()=>{o.disconnect();g.disconnect()};o.start(t);o.stop(t+.07);
  }catch{}
}
function updateTicking(now){
  if(!running||!cfg.sound||!cfg.tickEnabled)return;
  if(now>=nextTickAt){tickSound();nextTickAt=now+tickInterval(left)}
}

function buzz(){if(cfg.vibrate)navigator.vibrate?.(35)}
function toast(s){$('#toast').textContent=s;$('#toast').classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>$('#toast').classList.remove('show'),1800)}
let wakeLock=null;
async function keepAwake(){try{if(!wakeLock||wakeLock.released)wakeLock=await navigator.wakeLock?.request('screen')}catch{}}
function startTimer(){started=true;running=true;paused=false;left=cfg.duration;deadline=performance.now()+left*1000;lastTick=-1;nextTickAt=performance.now()+tickInterval(left);beep();render();keepAwake()}
function nextPlayer(){if(cfg.mode==='free')return;do{turn=(turn+1)%players.length}while(!players[turn].alive)}
function pick(l){if(!started||paused||!running)return;if(performance.now()>=deadline){expire();return}if(used.has(l))return;if(pending.includes(l))pending=pending.filter(x=>x!==l);else if(pending.length<needed)pending.push(l);beep(850,.035);buzz();render()}
$('#hit').onclick=()=>{if(resultPending){$('#continue').onclick();return}if(!started){if(!document.fullscreenElement)document.documentElement?.requestFullscreen?.().catch(()=>{});startTimer();return}if(paused){resume();return}if(!running)return;if(performance.now()>=deadline){expire();return}if(pending.length<needed){toast(needed===1?'Elige una letra':`Elige ${needed} letras`);return}pending.forEach(l=>used.add(l));pending=[];beep(1000);buzz();nextPlayer();if(letters.length-used.size<needed){running=false;needed++;used.clear();category=randomCategory();mode='overtime';$('#resultTitle').textContent='¡Rueda completa!';$('#resultText').textContent=`${needed} respuestas por turno · ${category}`;$('#resultScores').replaceChildren();$('#continue').textContent='Empezar';$('#resultNew').hidden=true;showResult();render()}else startTimer()};
function expire(){if(!running)return;running=false;paused=false;left=0;pending.forEach(l=>used.add(l));pending=[];beep(150,.65);if(cfg.vibrate)navigator.vibrate?.([150,80,150]);$('#resultScores').replaceChildren();$('#resultNew').hidden=true;if(cfg.mode==='free'){mode='free';$('#resultTitle').textContent='¡Tiempo!';$('#resultText').textContent='';$('#continue').textContent='Siguiente turno';$('#resultNew').hidden=false}else{players[turn].alive=false;const loser=players[turn].name,alive=players.filter(p=>p.alive);if(alive.length===1){alive[0].score+=needed;const won=alive[0].score>=cfg.target;mode=won?'game':'round';$('#resultTitle').textContent=won?'¡Tenemos ganador!':'¡Ronda ganada!';$('#resultText').textContent=alive[0].name+(won?' gana la partida.':` · +${needed} ${needed===1?'carta':'cartas'}`);scoreRows($('#resultScores'));$('#continue').textContent=won?'Nueva partida':'Siguiente ronda'}else{mode='elimination';$('#resultTitle').textContent='¡Tiempo!';$('#resultText').textContent=loser+' queda fuera de esta ronda.';$('#continue').textContent='Siguiente jugador'}}render();showResult()}
setInterval(()=>{if(!running)return;left=(deadline-performance.now())/1000;if(left<=0){expire();return}const n=Math.ceil(left);if((!cfg.tickEnabled)&&n<=3&&n!==lastTick){lastTick=n;beep(450,.07)}updateTicking(performance.now());drawTime()},40);
function resume(){paused=false;running=true;deadline=performance.now()+left*1000;nextTickAt=performance.now()+Math.min(tickRemainder,tickInterval(left));beep();render();keepAwake()}
function pause(){if(!started)return;if(paused){resume();return}if(!running)return;left=Math.max(0,(deadline-performance.now())/1000);if(!left){expire();return}tickRemainder=Math.max(0,nextTickAt-performance.now());running=false;paused=true;render()}
$('#pause').onclick=pause;
function newRound(){round++;category=randomCategory();resetRound()}
$('#continue').onclick=()=>{resultPending=false;$('#result').close();if(mode==='game'){category=randomCategory();init()}else if(mode==='round'){turn=players.findIndex(p=>p.alive);newRound()}else if(mode==='elimination'){nextPlayer();startTimer()}else startTimer()};
$('#resultNew').onclick=()=>{resultPending=false;$('#result').close();newRound()};
$('#result').addEventListener('cancel',e=>{e.preventDefault();dismissDialog($('#result'))});
function categoryPool(){if(cfg.group==='custom')return customCategories.length?customCategories:cats;return categoryGroups.find(g=>g.name===cfg.group)?.items||[...cats,...customCategories]}
function randomCategory(){const source=categoryPool(),pool=source.filter(c=>c!==category);return (pool.length?pool:source)[Math.floor(Math.random()*(pool.length||source.length))]}
function openDialog(id){if(running)pause();$(id).showModal()}
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
$('#settings').onclick=()=>{fillConfig();openDialog('#config')};
function fillConfig(){$('#tickEnabled').checked=cfg.tickEnabled;$('#tickVolume').value=cfg.tickVolume;$('#tickVolumeValue').textContent=cfg.tickVolume+'%';$('#tickSpeed').value=cfg.tickSpeed;$('#boardTheme').value=cfg.theme;$('#boardShape').value=cfg.shape;editMode=cfg.mode;$('#names').value=cfg.names.join(', ');$('#target').value=cfg.target;$('#alphabet').value=cfg.alphabet;['rotate','sound','vibrate'].forEach(k=>$('#'+k).checked=cfg[k]);renderModes();$('#durations').replaceChildren();[10,15,30,60,90].forEach(n=>{const b=document.createElement('button');b.textContent=n;b.className=n===Number(cfg.duration)?'active':'';b.setAttribute('aria-pressed',String(n===Number(cfg.duration)));b.onclick=()=>{$('#durations').querySelectorAll('button').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-pressed','false')});b.classList.add('active');b.setAttribute('aria-pressed','true')};b.dataset.value=n;$('#durations').append(b)})}
function renderModes(){$('#playerOptions').hidden=editMode==='free';$('#modes').querySelectorAll('button').forEach(b=>{const selected=b.dataset.mode===editMode;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected))})}
$('#modes').querySelectorAll('button').forEach(b=>b.onclick=()=>{editMode=b.dataset.mode;renderModes()});
$('#shapes').querySelectorAll('button').forEach(b=>b.onclick=()=>{cfg.shape=b.dataset.shape;persist();resize()});
function saveConfig(){const names=$('#names').value.split(',').map(x=>x.trim()).filter(Boolean).slice(0,12);if(editMode==='players'&&names.length<2){toast('Añade al menos dos jugadores');return false}const duration=Number($('#durations .active').dataset.value);const changed=cfg.mode!==editMode||cfg.alphabet!==$('#alphabet').value||(editMode==='players'&&JSON.stringify(names)!==JSON.stringify(cfg.names));const timeChanged=duration!==cfg.duration;cfg.mode=editMode;if(names.length>=2)cfg.names=names;cfg.tickEnabled=$('#tickEnabled').checked;cfg.tickVolume=Math.max(0,Math.min(100,Number($('#tickVolume').value)));cfg.tickSpeed=$('#tickSpeed').value;cfg.duration=duration;cfg.target=Number($('#target').value);cfg.alphabet=$('#alphabet').value;['rotate','sound','vibrate'].forEach(k=>cfg[k]=$('#'+k).checked);persist();if(changed)init();else{if(timeChanged||!started)left=cfg.duration;render()}return true}
$('#save').onclick=()=>{if(saveConfig())$('#config').close()};
function categoryList(){const list=$('#categoryList');list.replaceChildren();const groups=[...categoryGroups,{name:'Mis categorías',items:customCategories}];groups.forEach(g=>{if(cfg.group!=='all'&&g.name!==cfg.group&&!(cfg.group==='custom'&&g.name==='Mis categorías'))return;if(!g.items.length)return;const details=document.createElement('details'),summary=document.createElement('summary'),items=document.createElement('div');summary.textContent=g.name+' · '+g.items.length;details.open=cfg.group!=='all';items.className='category-items';g.items.forEach(c=>{const b=document.createElement('button');b.textContent=c;b.onclick=()=>chooseCategory(c);items.append(b)});details.append(summary,items);list.append(details)})}
function chooseCategory(c){category=c;$('#categories').close();render()}
$('#category').onclick=()=>{if(started)return;$('#categoryGroup').value=cfg.group;categoryList();openDialog('#categories')};
$('#random').onclick=()=>chooseCategory(randomCategory());
$('#customForm').onsubmit=e=>{e.preventDefault();const c=$('#custom').value.trim();if(c){if(!cats.includes(c)&&!customCategories.includes(c))customCategories.push(c);try{localStorage.setItem('basta-custom-categories',JSON.stringify(customCategories))}catch{}chooseCategory(c);$('#custom').value=''}};
function scoreRows(el){el.replaceChildren();[...players].sort((a,b)=>b.score-a.score).forEach(p=>{const row=document.createElement('div');row.className='score';const n=document.createElement('span'),s=document.createElement('strong');n.textContent=p.name;s.textContent=p.score;row.append(n,s);el.append(row)})}
$('#scores').onclick=()=>{if(cfg.mode==='free'){fillConfig();openDialog('#config')}else{scoreRows($('#scoreList'));openDialog('#scoreboard')}};
function confirmReset(title,action){$('#confirmTitle').textContent=title;confirmAction=action;openDialog('#confirm')}
$('#newRound').onclick=()=>{if(started||used.size)confirmReset('¿Nueva ronda?',newRound);else newRound()};
$('#restartGame').onclick=()=>{$('#scoreboard').close();confirmReset('¿Nueva partida?',()=>{category=randomCategory();init()})};
$('#cancelReset').onclick=()=>$('#confirm').close();$('#confirmReset').onclick=()=>{$('#confirm').close();confirmAction?.();confirmAction=null};
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('Pantalla completa no disponible en este navegador')}catch{toast('Pantalla completa no disponible')}};
let drag=null,suppressClick=false;const arena=$('#arena');
function pointerAngle(e){const r=arena.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2;const theta=cfg.shape==='circle'?Math.atan2(dy/geometry.ry,dx/geometry.rx):Math.atan2(dy,dx);const index=((theta/TAU+1)%1)*2048,lo=Math.floor(index),f=index-lo;return (geometry.table[lo]+f*(geometry.table[lo+1]-geometry.table[lo]))/geometry.total*TAU}
arena.addEventListener('pointerdown',e=>{if(!cfg.rotate||e.target.closest('.center'))return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,last:pointerAngle(e),moved:false};suppressClick=false});
arena.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7){drag.moved=true;suppressClick=true;arena.setPointerCapture?.(e.pointerId)}if(!drag.moved)return;const a=pointerAngle(e);let d=a-drag.last;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;angle+=d;drag.last=a;layout();e.preventDefault()});
arena.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();suppressClick=false}drag=null},true);
window.addEventListener('pointerup',()=>{drag=null});window.addEventListener('pointercancel',()=>{drag=null;suppressClick=false});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running)pause()});
init();

// The pause menu keeps setup controls off the playing surface.
$('#pause').onclick=()=>{if(running)pause();$('#pauseMenu').showModal()};
function closePause(){ $('#pauseMenu').close();if(paused)resume() }
$('#resumeGame').onclick=closePause;$('#closePause').onclick=closePause;
$('#pauseMenu').addEventListener('cancel',e=>{e.preventDefault();closePause()});
$('#pauseSettings').onclick=()=>{$('#pauseMenu').close();fillConfig();$('#config').showModal()};
$('#pauseScores').onclick=()=>{$('#pauseMenu').close();$('#scores').onclick()};
$('#pauseFullscreen').onclick=()=>$('#fullscreen').onclick();
$('#pauseRound').onclick=()=>{$('#pauseMenu').close();confirmReset('¿Nueva ronda?',newRound)};
categoryGroups.forEach(g=>{const o=document.createElement('option');o.value=g.name;o.textContent=g.name;$('#categoryGroup').append(o)});
const customOption=document.createElement('option');customOption.value='custom';customOption.textContent='Mis categorías';$('#categoryGroup').append(customOption);
$('#categoryGroup').value=cfg.group;
$('#categoryGroup').onchange=()=>{cfg.group=$('#categoryGroup').value;persist();categoryList()};
const shapeLabel=document.createElement('label');shapeLabel.textContent='Forma del tablero';shapeLabel.setAttribute('for','boardShape');
const shapeSelect=document.createElement('select');shapeSelect.id='boardShape';
[['square','Adaptado a pantalla'],['rectangle','Rectángulo'],['circle','Círculo']].forEach(([value,text])=>{const o=document.createElement('option');o.value=value;o.textContent=text;shapeSelect.append(o)});shapeSelect.value=cfg.shape;
shapeSelect.onchange=()=>{cfg.shape=shapeSelect.value;persist();resize()};
$('#save').before(shapeLabel,shapeSelect);

const themeLabel=document.createElement('label');themeLabel.textContent='Tema';themeLabel.setAttribute('for','boardTheme');
const themeSelect=document.createElement('select');themeSelect.id='boardTheme';
[['classic','Clásico · Colorido'],['minimal','Minimalista']].forEach(([value,text])=>{const o=document.createElement('option');o.value=value;o.textContent=text;themeSelect.append(o)});
function applyTheme(){if(!['classic','minimal'].includes(cfg.theme))cfg.theme='classic';document.body.dataset.theme=cfg.theme;themeSelect.value=cfg.theme;document.querySelector('meta[name="theme-color"]').setAttribute('content',cfg.theme==='classic'?'#fff7f5':'#f5f5f7')}
themeSelect.onchange=()=>{cfg.theme=themeSelect.value;persist();applyTheme()};
$('#save').before(themeLabel,themeSelect);applyTheme();


function showResult(){resultPending=true;$('#result').showModal()}
function dismissDialog(dialog){
  if(dialog.id==='pauseMenu'){closePause();return}
  dialog.close();
  if(dialog.id==='result')render();
}
function outsideDialog(dialog,event){
  const bounds=dialog.getBoundingClientRect();
  return event.target===dialog&&(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom);
}
document.querySelectorAll('dialog').forEach(dialog=>{
  let outsidePointer=null;
  dialog.addEventListener('pointerdown',event=>{
    outsidePointer=outsideDialog(dialog,event)?event.pointerId:null;
    if(outsidePointer!==null)event.preventDefault();
  });
  dialog.addEventListener('pointerup',event=>{
    const dismiss=outsidePointer===event.pointerId&&outsideDialog(dialog,event);
    outsidePointer=null;
    if(dismiss){event.preventDefault();event.stopPropagation();dismissDialog(dialog)}
  });
  dialog.addEventListener('pointercancel',()=>{outsidePointer=null});
});

$('#tickVolume').oninput=()=>{$('#tickVolumeValue').textContent=$('#tickVolume').value+'%'};
