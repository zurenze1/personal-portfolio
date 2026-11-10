(async()=>{'use strict';
const data = JSON.parse(document.querySelector('#yg-supplement-data').textContent);
const teamButtons = [...document.querySelectorAll('[data-yg-team]')];
function showTeam(year){
  const item = data.credits[year];
  teamButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.ygTeam===year)));
  document.querySelector('#yg-team-work').textContent = year + ' / ' + item.title;
  for(const key of ['roles','signatures','people']) document.querySelector('#yg-team-'+key).textContent = item[key];
  const target = document.querySelector('#yg-team-map');
  target.replaceChildren(...item.groups.map(([title,roles])=>{
    const column=document.createElement('div');column.className='yg-team-column';
    const heading=document.createElement('h5');heading.textContent=title;
    const list=document.createElement('ul');
    for(const role of roles){const li=document.createElement('li');li.textContent=role;list.append(li);}
    column.append(heading,list);return column;
  }));
  const source=document.querySelector('#yg-team-source');if(source){source.href=item.url;source.textContent='查看该作品片尾原作 ↗';}
}
teamButtons.forEach(button=>button.addEventListener('click',()=>showTeam(button.dataset.ygTeam)));
showTeam('2025');
const steps=[...document.querySelectorAll('[data-yg-step]')];
function showStep(index){
  const step=data.flow[index];
  steps.forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.ygStep)===index)));
  document.querySelector('#yg-flow-title').textContent=step.title;
  document.querySelector('#yg-flow-body').textContent=step.body;
}
steps.forEach(button=>button.addEventListener('click',()=>showStep(Number(button.dataset.ygStep))));
showStep(0);

})().catch(e=>console.error(e));
