(async()=>{'use strict';
const names={spring:'春',summer:'夏',autumn:'秋',winter:'冬'},seasons=Object.keys(names),body=document.body;
const moods={spring:'新绿 · 花瓣',summer:'碧青 · 细雨',autumn:'暖金 · 落叶',winter:'冰蓝 · 飞雪'};
const originalButtons=seasons.map(s=>document.querySelector(`#season${s[0].toUpperCase()+s.slice(1)}`));
const originalAuto=document.querySelector('#seasonAuto'),motion=document.querySelector('#motionToggle');
const control=document.createElement('details');control.className='global-season-control';control.innerHTML='<summary aria-label="设置整页季节">整页四季 · <span></span></summary><div class="global-season-options" role="group" aria-label="选择整页季节">'+seasons.map(s=>`<button type="button" data-global-season="${s}" aria-pressed="false">${names[s]}</button>`).join('')+'</div><p class="global-season-desc"></p><button type="button" class="global-season-auto"></button>';
body.append(control);
const canvas=document.createElement('canvas');canvas.id='pageSeasonWeather';canvas.setAttribute('aria-hidden','true');body.append(canvas);const ctx=canvas.getContext('2d');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');let width=0,height=0,raf=0,lastTime=0,lastChange=performance.now(),particles=[];
// Keep two motifs within each mobile screen-length instead of cropping both
// decorative edges away from the narrow central reading column.
const ornamentLayers=[...document.querySelectorAll('.literati-ornament')];
function arrangeMotifs(){for(const layer of ornamentLayers){const count=innerWidth<=760?Math.ceil(layer.clientHeight/850):0;if(layer.dataset.pairs===String(count))continue;layer.dataset.pairs=String(count);layer.classList.toggle('mobile-motifs',count>0);layer.replaceChildren();for(let i=0;i<count;i++){const pair=document.createElement('span');pair.className='literati-motif-pair';pair.style.top=i*850+'px';layer.append(pair)}}}
const motifResize=new ResizeObserver(arrangeMotifs);ornamentLayers.forEach(x=>motifResize.observe(x));addEventListener('resize',arrangeMotifs);arrangeMotifs();
const paused=()=>body.classList.contains('paused')||reduced.matches||document.hidden;
let weatherDark=false,lastSurfaceCheck=0;
function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);particles=Array.from({length:width<600?5:10},()=>({x:Math.random()*width,y:Math.random()*height,r:3+Math.random()*4,v:14+Math.random()*20,phase:Math.random()*6.28}));draw(0)}
function draw(dt){
 ctx.clearRect(0,0,width,height);if(paused())return;const season=body.dataset.season||'summer';
 for(const p of particles){
  p.y+=(season==='summer'?p.v*4.5:season==='winter'?p.v*.8:p.v)*dt;p.x+=(season==='summer'?-16:Math.sin(p.phase+p.y/135)*14)*dt;
  if(p.y>height+25){p.y=-25;p.x=Math.random()*width}if(p.x<-20)p.x=width+15;
  ctx.save();ctx.translate(p.x,p.y);
  if(season==='summer'){
   ctx.strokeStyle=weatherDark?'rgba(177,213,228,.5)':'rgba(68,119,145,.38)';ctx.lineWidth=.85;
   ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-3,16+p.r*1.5);ctx.stroke();
  }else if(season==='winter'){
   const r=p.r*.48;ctx.strokeStyle=weatherDark?'rgba(246,253,255,.88)':'rgba(104,145,177,.58)';ctx.fillStyle=weatherDark?'rgba(255,255,255,.9)':'rgba(247,252,255,.95)';ctx.lineWidth=.85;
   if(p.phase>3){ctx.beginPath();for(let arm=0;arm<6;arm++){const a=arm*Math.PI/3;ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.stroke()}
   else{ctx.shadowColor='#97b8cb';ctx.shadowBlur=2;ctx.beginPath();ctx.arc(0,0,r*.65,0,Math.PI*2);ctx.fill()}
  }else if(season==='spring'){
   ctx.rotate(p.phase+Math.sin(p.y/100)*.8);const r=p.r;
   ctx.fillStyle=weatherDark?'rgba(242,186,207,.72)':'rgba(184,102,133,.52)';
   ctx.beginPath();ctx.moveTo(0,-r);ctx.bezierCurveTo(r*.85,-r*.8,r*.8,r*.6,0,r);ctx.bezierCurveTo(-r*.7,r*.4,-r*.7,-r*.4,0,-r);ctx.fill();
  }else{
   ctx.rotate(p.phase+Math.sin(p.y/115));const r=p.r*1.25;
   ctx.fillStyle=weatherDark?'rgba(231,182,84,.74)':'rgba(164,111,43,.57)';ctx.strokeStyle=weatherDark?'rgba(255,225,160,.55)':'rgba(116,81,37,.46)';ctx.lineWidth=.65;
   ctx.beginPath();ctx.moveTo(0,-r);ctx.bezierCurveTo(r,-r*.3,r*.7,r*.65,0,r);ctx.bezierCurveTo(-r*.8,r*.2,-r*.65,-r*.6,0,-r);ctx.fill();ctx.beginPath();ctx.moveTo(0,-r*.65);ctx.lineTo(0,r*.85);ctx.stroke();
  }
  ctx.restore();
 }
}
function frame(t){
 if(paused()){raf=0;ctx.clearRect(0,0,width,height);return}
 if(t-lastSurfaceCheck>350){weatherDark=!!document.elementFromPoint(width*.5,height*.5)?.closest('[data-chapter-tone="dark"]');lastSurfaceCheck=t}
 draw(Math.min((t-lastTime)/1000,.06));lastTime=t;raf=requestAnimationFrame(frame);
}

function wake(){if(paused()){if(raf)cancelAnimationFrame(raf);raf=0;ctx.clearRect(0,0,width,height)}else if(!raf){lastTime=performance.now();raf=requestAnimationFrame(frame)}}
function sync(){const s=body.dataset.season||'summer';control.querySelector('summary span').textContent=names[s]+' · '+moods[s].split(' · ')[1];control.querySelector('.global-season-desc').textContent=moods[s];control.querySelectorAll('[data-global-season]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.globalSeason===s)));const auto=originalAuto.getAttribute('aria-pressed')==='true';control.querySelector('.global-season-auto').textContent='四季自动流转 · '+(auto?'开':'关');control.querySelector('.global-season-auto').setAttribute('aria-pressed',String(auto));wake()}
function manual(season){if(originalAuto.getAttribute('aria-pressed')==='true')originalAuto.click();originalButtons[seasons.indexOf(season)].click();try{localStorage.setItem('yigongzi-global-season',season)}catch{}sync()}
control.querySelectorAll('[data-global-season]').forEach(b=>b.addEventListener('click',()=>manual(b.dataset.globalSeason)));
control.querySelector('.global-season-auto').addEventListener('click',()=>{originalAuto.click();lastChange=performance.now();sync()});
originalButtons.forEach((b,i)=>b.addEventListener('click',e=>{if(e.isTrusted){if(originalAuto.getAttribute('aria-pressed')==='true')originalAuto.click();try{localStorage.setItem('yigongzi-global-season',seasons[i])}catch{}}sync()}));
new MutationObserver(entries=>{if(entries.some(x=>x.attributeName==='data-season'))lastChange=performance.now();sync()}).observe(body,{attributes:true,attributeFilter:['data-season','class']});
new MutationObserver(sync).observe(originalAuto,{attributes:true,attributeFilter:['aria-pressed']});
setInterval(()=>{if(!paused()&&originalAuto.getAttribute('aria-pressed')==='true'&&performance.now()-lastChange>32000){lastChange=performance.now();originalButtons[(seasons.indexOf(body.dataset.season)+1)%4].click()}},1000);
addEventListener('resize',resize);document.addEventListener('visibilitychange',wake);reduced.addEventListener('change',wake);motion?.addEventListener('click',wake);
try{const saved=localStorage.getItem('yigongzi-global-season');if(seasons.includes(saved))manual(saved)}catch{}
resize();sync();

})().catch(e=>console.error(e));
