import { loadWorkSelection } from './work-selection.js?v=20261105-tenure2';
const root = document.querySelector('#script-comparison');
const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const names = {lafa5:'零跑 Lafa5', 'songjia-eral':'宋佳 / 艾莱依'};
let data, returnFocus;

function pane(parts, published, item, heading = true) {
  return `<div class="hsc-pane ${published?'hsc-pane-published':''}">${heading?`<h4>${escape(published?'成片整理':'结构回看')}</h4>`:''}${parts.map(p=>`<div class="hsc-paragraph"><h5>${escape(p.id)} / ${escape(p.title)}</h5><p>${escape(p.text)}</p></div>`).join('')}</div>`;
}
const frameNotes = {
  lafa5: {height:406, seconds:[8,28,52,98,139,160], labels:['开头提问','穿搭举例','转入汽车','座椅细节','车色对照','品牌收束']},
  'songjia-eral': {height:1280, seconds:[8,24,43,69,98,113], labels:['人物气质','穿搭过渡','风衣羽绒服','巴黎秀场','场景穿搭','品牌态度']}
};
const clock = second => `${String(Math.floor(second/60)).padStart(2,'0')}:${String(second%60).padStart(2,'0')}`;
function frameGallery(item) {
  const frames=frameNotes[item.id];
  return `<div class="hsc-frame-grid" aria-label="${escape(names[item.id])}六段原片画面">${frames.labels.map((label,i)=>`<figure class="hsc-frame"><a href="${escape(item.source_url)}" target="_blank" rel="noopener noreferrer" aria-label="在抖音观看${escape(names[item.id])}：${escape(label)}"><img src="media/script-stills/${item.id}-${i+1}.jpg" width="720" height="${frames.height}" alt="${escape(names[item.id])}原片${clock(frames.seconds[i])}的${escape(label)}画面" loading="${i<3?'eager':'lazy'}" decoding="async"><span class="hsc-frame-play" aria-hidden="true">↗ 原片</span></a><figcaption><strong>${String(i+1).padStart(2,'0')} / ${escape(label)}</strong><time>${clock(frames.seconds[i])}</time></figcaption></figure>`).join('')}</div>`;
}
function renderCase(item) {
  for (const button of root.querySelectorAll('[data-hsc-switch]')) {
    const selected = button.dataset.hscSwitch === item.id;
    button.setAttribute('aria-selected',String(selected)); button.tabIndex = selected?0:-1;
  }
  const body = root.querySelector('.hsc-dialog-body');
  body.innerHTML = `<h3 class="hsc-work-title">${escape(names[item.id])}</h3><div class="hsc-source-line"><span>${escape(item.published_date)}</span><a href="${escape(item.source_url)}" target="_blank" rel="noopener noreferrer">看原片 ↗</a></div>${frameGallery(item)}<details open class="hsc-more hsc-full"><summary>结构与成片表达</summary>${item.drafts.map((draft,i)=>`<div class="hsc-pair hsc-full-pair">${pane([draft],false,item,i===0)}${pane([item.published[i]],true,item,i===0)}</div>`).join('')}</details><details open class="hsc-more hsc-rewrite"><summary>开头改写</summary><div class="hsc-pair"><div class="hsc-pane"><h4>V1</h4><div class="hsc-paragraph"><p>${item.rewrite.before.map(x=>x.changed?`<span class="hsc-diff-before">${escape(x.text)}</span>`:escape(x.text)).join('')}</p></div></div><div class="hsc-pane hsc-pane-published"><h4>V2</h4><div class="hsc-paragraph"><p>${item.rewrite.after.map(x=>x.changed?`<span class="hsc-diff-after">${escape(x.text)}</span>`:escape(x.text)).join('')}</p></div></div></div></details>`;
  body.scrollTop = 0;
}

async function load() {
  const target = root.querySelector('#hsc-content');
  try {
    const response = await fetch(new URL('./data/script-comparison-local.json',import.meta.url),{cache:'no-cache'});
    if(!response.ok)throw new Error('展示数据未读取');
    data = await response.json();
    if(data.schema!=='hualaoban-script-comparison/v1'||!data.cases.every(x=>/^\d+$/.test(x.video_id)&&x.source_url==='https://www.douyin.com/video/'+x.video_id))throw new Error('展示数据格式不匹配');
    const selection=await loadWorkSelection();data.cases=data.cases.filter(item=>selection.byId.has(item.video_id));
    if(!data.cases.length){root.hidden=true;return;}
    root.classList.toggle('hsc-single',data.cases.length===1);
    target.innerHTML = `<div class="hsc-cards">${data.cases.map(item=>`<article class="hsc-card"><button type="button" class="hsc-cover-button" data-hsc-open="${item.id}" aria-label="打开${escape(names[item.id])}文稿对照"><img src="media/work-covers/${item.video_id}.jpg" width="323" height="430" loading="lazy" alt="${escape(names[item.id])}原作封面"><span class="hsc-cover-action">看图拆解 ↗</span></button></article>`).join('')}</div><dialog id="hsc-dialog" aria-labelledby="hsc-dialog-title"><div class="hsc-dialog-shell"><header class="hsc-dialog-head"><div><h2 id="hsc-dialog-title">成片结构对照</h2><small>依据公开成片整理 · 开头、结构与表达</small></div><button type="button" class="hsc-close" aria-label="关闭文稿对照">关闭 ×</button></header><div class="hsc-case-tabs" role="tablist" aria-label="切换文稿作品">${data.cases.map((item,i)=>`<button type="button" role="tab" data-hsc-switch="${item.id}" aria-selected="${i===0}" tabindex="${i===0?0:-1}">${escape(names[item.id])}</button>`).join('')}</div><div class="hsc-dialog-body"></div></div></dialog>`;
    const dialog = root.querySelector('#hsc-dialog');
    root.addEventListener('click',event=>{
      const open = event.target.closest('[data-hsc-open]');
      if(open){returnFocus=open;renderCase(data.cases.find(x=>x.id===open.dataset.hscOpen));document.querySelectorAll('video').forEach(v=>v.pause());dialog.showModal();root.querySelector('.hsc-close').focus();return;}
      if(event.target.closest('.hsc-close')){dialog.close();return;}
      const switcher=event.target.closest('[data-hsc-switch]');
      if(switcher){renderCase(data.cases.find(x=>x.id===switcher.dataset.hscSwitch));return;}
    });
    root.querySelector('.hsc-case-tabs').addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      const buttons=[...root.querySelectorAll('[data-hsc-switch]')];let i=buttons.indexOf(document.activeElement);
      if(i<0)return;event.preventDefault();i=event.key==='Home'?0:event.key==='End'?buttons.length-1:(i+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;buttons[i].click();buttons[i].focus();
    });
    dialog.addEventListener('keydown',event=>{
      if(event.key!=='Tab')return;
      const controls=[...dialog.querySelectorAll('a[href],button,input,select,textarea,summary,[tabindex]')].filter(el=>!el.disabled&&el.tabIndex>=0&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden');
      if(!controls.length){event.preventDefault();dialog.focus();return;}
      const first=controls[0],last=controls.at(-1),active=document.activeElement;
      if(event.shiftKey&&(active===first||!dialog.contains(active))){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&(active===last||!dialog.contains(active))){event.preventDefault();first.focus();}
    },true);
    dialog.addEventListener('close',()=>returnFocus?.focus({preventScroll:true}));
    root.dataset.ready='true';root.dataset.contentRevision=data.source_sha256;
  } catch(error) {
    console.warn('文稿对照读取失败',error);
    target.innerHTML='<p role="status">文稿对照暂未读取成功。</p><button type="button" id="hsc-retry">重新读取 ↻</button>';
    root.querySelector('#hsc-retry').addEventListener('click',load,{once:true});
  }
}
if(root)load();
