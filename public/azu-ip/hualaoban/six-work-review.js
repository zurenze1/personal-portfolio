// One editorial review per work ID, shared by rankings and the selected-work panel.
import { loadWorkSelection } from './work-selection.js?v=20261105-tenure2';
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const original = item => `<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">抖音原作 ↗</a>`;

function review(item,covers,work) {
  const cover=/^media\/work-covers\/\d+\.jpg$/.test(covers[item.id]||'')?covers[item.id]:item.steps[0].image.src;
  return `<div class="hds-review-intro"><div><div class="hds-dialog-lead"><p class="eyebrow">创作复盘 / ${esc(item.subject)} · ${esc(item.date)} · ${esc(item.duration)}</p><h3>${esc(item.title)}</h3><p>${esc(item.thesis)}</p></div>
    ${work?.contribution?`<div class="hds-my-work"><span>我的参与</span><p>${esc(work.contribution.summary)}</p><div>${work.contribution.duties.map(t=>`<b>${esc(t)}</b>`).join('')}</div></div>`:''}
    <div class="hds-hook"><span>开头的钩子</span><p>${esc(item.hook)}</p></div></div><a class="hds-review-cover" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer"><img src="${esc(cover)}" alt="${esc(item.subject)}原作封面"><span>播放原作 ↗</span></a></div>
    <h3 class="hds-subtitle">叙事节奏 · 三步推进</h3>
    <ol class="hds-beats">${item.steps.map((step,i)=>`<li><a class="hds-frame-link" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="在抖音播放${esc(item.subject)}原作"><img src="${esc(step.image.src)}" alt="${esc(step.image.alt)}" loading="lazy"><span>${esc(step.image.time)} / 原片画面 ↗</span></a><div class="hds-beat-copy"><span class="hds-beat-number">${String(i+1).padStart(2,'0')}</span><h4>${esc(step.title)}</h4><p>${esc(step.body)}</p><p class="hds-purpose"><b>用意</b>${esc(step.purpose)}</p></div></li>`).join('')}</ol>
    <div class="hds-spread"><h3>传播看点</h3><p>${esc(item.spread)}</p></div><div class="hds-source-links hds-original-link">${original(item)}</div>`;
}

export async function mountContentStudies(root,{works,covers={}}) {
  let section=root.querySelector('#content-studies');
  if(section?.dataset.ready==='true')return;
  if(!document.querySelector('link[data-hds-style]')){
    const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./content-studies.css?v=20261103-refined3',import.meta.url);style.dataset.hdsStyle='true';document.head.append(style);
  }
  if(!section){section=document.createElement('section');section.id='content-studies';root.querySelector('.wrap').append(section);}
  section.className='hds-dialog-host';section.setAttribute('aria-label','精选作品拆解');
  let data;
  try {
    const response=await fetch(new URL('./data/six-work-review.json?v=20261102-six-review1',import.meta.url));
    if(!response.ok)throw new Error('拆解读取失败');
    data=await response.json();
    const selection=await loadWorkSelection();data.cases=data.cases.filter(item=>selection.byId.has(item.id));
    const ids=new Set(works.map(w=>w.id));
    if(data.schema!=='hualaoban-six-work-review/v1'||new Set(data.cases.map(c=>c.id)).size!==data.cases.length||!data.cases.every(c=>ids.has(c.id)&&c.url==='https://www.douyin.com/video/'+c.id&&c.steps.length===3&&c.steps.every(s=>/^media\/review-six\/\d+-[123]\.jpg$/.test(s.image.src))))throw new Error('作品拆解与原作不匹配');
  } catch(error) {
    console.warn('精选作品拆解：',error);
    section.innerHTML='<p>作品拆解暂未载入。</p><button type="button">重试读取拆解 ↻</button>';
    section.querySelector('button').addEventListener('click',()=>mountContentStudies(root,{works,covers}));return;
  }
  const cases=new Map(data.cases.map(item=>[item.id,item]));
  section.innerHTML='<dialog id="hd-study-dialog" aria-labelledby="hds-dialog-title"><header><h2 id="hds-dialog-title">创作复盘</h2><button class="hds-close" type="button" aria-label="关闭内容拆解">关闭 ×</button></header><div class="hds-dialog-body"></div></dialog>';
  const dialog=section.querySelector('dialog');let returnFocus=null;
  function syncActions(id) {
    root.querySelectorAll('[data-hd-study]').forEach(button=>{button.disabled=!cases.has(button.dataset.hdStudy);});
    const detail=root.querySelector('#hd-work-detail');detail?.querySelector('.hds-selected-action')?.remove();
    if(!detail||!cases.has(id))return;
    const button=document.createElement('button');button.type='button';button.dataset.hdStudy=id;button.className='hds-selected-action';button.textContent='阅读拆解 ↗';
    detail.querySelector('.hd-work-link')?.after(button);
  }
  root.addEventListener('hd-work-selected',event=>syncActions(event.detail.id));
  root.addEventListener('click',event=>{
    const button=event.target.closest('[data-hd-study]');if(!button||button.disabled||!cases.has(button.dataset.hdStudy))return;
    const item=cases.get(button.dataset.hdStudy);returnFocus=button;
    dialog.querySelector('h2').textContent=item.subject+' · 创作复盘';dialog.querySelector('.hds-dialog-body').innerHTML=review(item,covers,works.find(w=>w.id===item.id));
    root.querySelectorAll('video,audio').forEach(media=>media.pause());
    document.body.classList.add('hds-dialog-open');dialog.showModal();dialog.scrollTop=0;dialog.querySelector('.hds-close').focus({preventScroll:true});
  });
  dialog.querySelector('.hds-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{document.body.classList.remove('hds-dialog-open');if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
  syncActions(root.querySelector('#hd-work-detail')?.dataset.workId);
  section.dataset.ready='true';
  if(location.hash==='#content-studies')root.querySelector('#hd-rank-title').scrollIntoView({block:'start',behavior:'instant'});
}
