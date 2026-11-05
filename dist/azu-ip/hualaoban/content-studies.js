// Curated research summaries. Full source media and transcripts stay outside the site.
import { loadWorkSelection } from './work-selection.js?v=20261105-tenure2';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const coverFor = (id,covers) => /^media\/work-covers\/\d+\.jpg$/.test(covers[id] || '') ? covers[id] : null;
const flow = steps => `<div class="hds-flow">${steps.map((step,i) => `${i?'<span aria-hidden="true">→</span>':''}<b>${esc(step)}</b>`).join('')}</div>`;
const external = (url,title) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)} ↗</a>`;

function card(item,covers) {
  const image=coverFor(item.id,covers);
  return `<article class="hds-card"><div class="hds-card-top">${image?`<img src="${esc(image)}" alt="${esc(item.subject)}作品现有封面" width="323" height="430" loading="lazy">`:''}<div><p class="eyebrow">${esc(item.subject)} / 内容案例</p><h4>${esc(item.title)}</h4><time>${esc(item.date)} · ${esc(item.duration)}</time></div></div>${flow(item.preview_path)}<p class="hds-thesis">${esc(item.thesis)}</p><div class="hds-card-actions"><button type="button" data-hd-study="${item.id}" aria-label="阅读${esc(item.subject)}内容案例">阅读拆解 ↗</button>${external(item.sources[0].url,'抖音原作')}</div></article>`;
}

function comparison(data,covers) {
  return `<details open class="hds-comparison"><summary><span>${esc(data.title)}</span><span>内容对照</span></summary><div class="hds-comparison-grid">${data.rows.map(row=>{const image=coverFor(row.id,covers);return `<article class="hds-compare-row">${image?`<img src="${esc(image)}" width="64" height="85" alt="${esc(row.subject)}作品现有封面" loading="lazy">`:''}<div><span class="hds-kicker">${esc(row.kind)} · ${esc(row.date)}</span><h4>${esc(row.subject)}<small>${esc(row.question)}</small></h4>${flow(row.path)}${external('https://www.douyin.com/video/'+row.id,'查看原作')}</div></article>`;}).join('')}</div><div class="hds-comparison-notes"><p>人物、时尚与品牌内容各有表达重点。先确定观众关心的问题，再用画面与细节推动故事。</p></div></details>`;
}

function dialogContent(item) {
  return `<div class="hds-dialog-lead"><p class="eyebrow">${esc(item.subject)} / 内容表达</p><h3>${esc(item.title)}</h3><p>${esc(item.thesis)}</p></div><h3 class="hds-subtitle">故事怎样往前走</h3><ol class="hds-steps">${item.steps.map((step,i)=>`<li><span class="hds-step-number">${String(i+1).padStart(2,'0')}</span><div><time>${esc(step.time)}</time><h4>${esc(step.title)}</h4><p>${esc(step.body)}</p></div></li>`).join('')}</ol><h3 class="hds-subtitle">画面分别承担什么</h3><div class="hds-visual-roles">${item.visual_roles.map(role=>`<article><h4>${esc(role.label)}</h4><p>${esc(role.text)}</p></article>`).join('')}</div><h3 class="hds-subtitle">可借鉴的做法</h3><ul class="hds-takeaways">${item.takeaways.map(text=>`<li>${esc(text)}</li>`).join('')}</ul><details class="hds-evidence"><summary>查看原作 <span>+</span></summary><div class="hds-source-links">${item.sources.map(source=>external(source.url,source.title)).join('')}</div></details>`;
}

export async function mountContentStudies(root,{works,covers}) {
  let section=root.querySelector('#content-studies');
  if(section?.dataset.ready==='true')return;
  if(!document.querySelector('link[data-hds-style]')){const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./content-studies.css?v=20261101-poster-piano1',import.meta.url);style.dataset.hdsStyle='true';document.head.append(style);}
  if(!section){section=document.createElement('section');section.id='content-studies';root.querySelector('.wrap').append(section);}
  section.className='hds-section';section.setAttribute('aria-labelledby','hds-heading');
  section.innerHTML='<h3 id="hds-heading">内容拆解</h3><p role="status">正在读取有来源的研究摘要…</p>';
  let data;
  try {
    const response=await fetch(new URL('./data/work-analyses-20261101.json',import.meta.url),{cache:'no-cache'});
    if(!response.ok)throw new Error('研究摘要读取失败');
    data=await response.json();
    const selection=await loadWorkSelection();data.cases=data.cases.filter(item=>selection.byId.has(item.id));
    data.comparison.rows=data.comparison.rows.filter(item=>selection.byId.has(item.id));
    if(data.schema!=='hualaoban-content-studies/v1'||data.cases.length!==2)throw new Error('研究摘要格式不匹配');
    const workIds=new Set(works.map(w=>w.id));
    if(!data.cases.every(item=>workIds.has(item.id)&&item.sources[0].url==='https://www.douyin.com/video/'+item.id))throw new Error('研究与作品ID不匹配');
  } catch(error) {
    console.warn('花老板内容拆解：',error);
    section.innerHTML='<h3 id="hds-heading">内容拆解</h3><p role="status">研究摘要暂未读取成功。</p><button type="button">重试读取 ↻</button>';
    section.querySelector('button').addEventListener('click',()=>mountContentStudies(root,{works,covers}));return;
  }
  section.innerHTML=`<div class="hd-chart-heading"><div><span class="eyebrow">CONTENT STUDIES / 内容拆解</span><h3 id="hds-heading">从数据，读到表达。</h3></div><p class="hd-note">人物与品牌 / 内容案例</p></div><div class="hds-cards">${data.cases.map(item=>card(item,covers)).join('')}</div>${comparison(data.comparison,covers)}<dialog id="hd-study-dialog" aria-labelledby="hds-dialog-title"><header><h2 id="hds-dialog-title">内容拆解</h2><button class="hds-close" type="button" aria-label="关闭内容拆解">关闭 ×</button></header><div class="hds-dialog-body"></div></dialog>`;
  const cases=new Map(data.cases.map(item=>[item.id,item]));
  const dialog=section.querySelector('#hd-study-dialog');let returnFocus=null;
  function addSelectedAction(id) {
    const detail=root.querySelector('#hd-work-detail');
    detail?.querySelector('.hds-selected-action')?.remove();
    if(!detail||!cases.has(id))return;
    const button=document.createElement('button');button.type='button';button.dataset.hdStudy=id;button.className='hds-selected-action';
    button.textContent='查看内容拆解 ↗';button.setAttribute('aria-label','查看'+cases.get(id).subject+'内容拆解');
    detail.querySelector('.hd-work-link')?.after(button);
  }
  root.addEventListener('hd-work-selected',event=>addSelectedAction(event.detail.id));
  root.addEventListener('click',event=>{
    const button=event.target.closest('[data-hd-study]');if(!button||!cases.has(button.dataset.hdStudy))return;
    const item=cases.get(button.dataset.hdStudy);returnFocus=button;
    dialog.querySelector('#hds-dialog-title').textContent=item.subject+' · 内容拆解';
    dialog.querySelector('.hds-dialog-body').innerHTML=dialogContent(item);
    document.querySelectorAll('video').forEach(video=>video.pause());
    document.body.classList.add('hds-dialog-open');dialog.showModal();dialog.scrollTop=0;
  });
  dialog.querySelector('.hds-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{document.body.classList.remove('hds-dialog-open');if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
  addSelectedAction(root.querySelector('#hd-work-detail')?.dataset.workId);
  section.dataset.ready='true';
  if(location.hash==='#content-studies')section.scrollIntoView({block:'start',behavior:'instant'});
}
