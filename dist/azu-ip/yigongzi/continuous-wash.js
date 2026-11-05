// Shared background stops follow actual chapter heights, including tabs,
// disclosures, late images and mobile reflow. Colors stay in the season CSS.
const main=document.querySelector('#top');
if(main&&CSS.supports('color','color-mix(in srgb,red,blue)')){
const definitions=[
  ['.creator-hero','green','dark'],['.tenure-stage','jade','light'],
  ['#proposal','jade','light'],['#featuredVideo','jade','light'],
  ['#yg-data','blue','light'],['#audience','green','dark'],
  ['#ygd-later','blue','light'],['#business','rose','light'],
  ['#business-model','indigo','dark'],['.rl-opening','indigo','dark'],
  ['#rl-commercial','plum','dark'],['#rl-recent','lilac','light'],
  ['#methods','lilac','light'],['#profile','blue','light'],['#seasons','jade','light'],
];
const chapters=definitions.map(([selector,color,tone])=>({element:main.querySelector(selector),color,tone})).filter(x=>x.element);
for(const chapter of chapters){chapter.element.dataset.washColor=chapter.color;chapter.element.dataset.chapterTone=chapter.tone;}
// Existing R4 spacers keep useful breathing room, but paint no background.
for(const gap of main.querySelectorAll('.chapter-blend')){
  const previous=gap.previousElementSibling,next=gap.nextElementSibling;
  const a=chapters.filter(x=>previous===x.element||previous?.contains(x.element)).at(-1);
  const b=chapters.find(x=>next===x.element||next?.contains(x.element));
  gap.classList.toggle('wash-same-tone',!!a&&!!b&&a.color===b.color);
}
main.classList.add('continuous-wash-ready');
let pending=false,last='';
const rgb=color=>`rgb(var(--palette-${color}))`;
// Smooth endpoints with a more visible change near the beginning.
const ease=t=>t*t*(3-2*t);
function measure(){
  pending=false;
  const origin=main.getBoundingClientRect().top;
  const visible=chapters.map(chapter=>{
    const rect=chapter.element.getBoundingClientRect(),style=getComputedStyle(chapter.element);
    return {...chapter,top:rect.top-origin,bottom:rect.bottom-origin,height:rect.height,
      before:parseFloat(style.paddingTop)||0,after:parseFloat(style.paddingBottom)||0};
  }).filter(x=>x.height>0).sort((a,b)=>a.top-b.top);
  const stops=[`${rgb(visible[0].color)} 0px`];
  const joins=[];
  for(let i=1;i<visible.length;i++){
    const a=visible[i-1],b=visible[i];if(a.color===b.color)continue;
    const edge=innerWidth<=760?55:90;
    const start=a.bottom-Math.min(edge,a.after),end=b.top+Math.min(edge,b.before);
    stops.push(`${rgb(a.color)} ${start.toFixed(1)}px`);
    for(let j=1;j<12;j++){
      const t=j/12,weight=(ease(t)*100).toFixed(3),y=(start+(end-start)*t).toFixed(1);
      stops.push(`color-mix(in srgb,${rgb(a.color)} ${100-Number(weight)}%,${rgb(b.color)} ${weight}%) ${y}px`);
    }
    stops.push(`${rgb(b.color)} ${end.toFixed(1)}px`);
    joins.push({from:a.color,to:b.color,start,end});
  }
  stops.push(`${rgb(visible.at(-1).color)} 100%`);
  const value=`linear-gradient(to bottom,${stops.join(',')})`;
  if(value!==last){main.style.setProperty('--continuous-wash',value);last=value;}
  main.dataset.washJoins=String(joins.length);
}
function schedule(){if(!pending){pending=true;requestAnimationFrame(measure);}}
const resize=new ResizeObserver(schedule);
resize.observe(main);chapters.forEach(x=>resize.observe(x.element));
addEventListener('resize',schedule,{passive:true});
main.addEventListener('load',schedule,true);
main.addEventListener('toggle',schedule,true);
document.fonts.ready.then(schedule);
measure();

}
