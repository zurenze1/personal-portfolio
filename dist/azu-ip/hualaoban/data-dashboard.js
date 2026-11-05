import { mountGraphPiano } from './graph-piano.js?v=20261105-tenure2';
import { loadWorkSelection, selectionLabel, publicationLabel } from './work-selection.js?v=20261105-tenure2';
// Public work snapshots only. Based on the site's existing native SVG/date-filter approach.
const workRelated=(w,e)=>w.date&&w.date>=e.filter_start_assumption&&w.date<=e.end;
const workEnd=data=>data.meta.employment.end;
const $ = (selector, root = document) => root.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
const labels = {likes:'点赞', comments:'评论', favorites:'收藏', shares:'分享'};
const fmt = value => value >= 10000 ? `${(value / 10000).toLocaleString('zh-CN', {maximumFractionDigits:1})}万` : Number(value).toLocaleString('zh-CN', {maximumFractionDigits:0});
const metric = (work, key) => work.metrics[key];
const known = (work, key) => Number.isFinite(metric(work, key)?.value);
const value = (work, key) => metric(work, key)?.value;
const shown = (work, key) => known(work, key) ? `${metric(work, key).exactness === 'rounded-display' ? '约 ' : ''}${metric(work, key).display.replace(/[wW]/g, '万')}` : '—';
const day = date => Date.parse(`${date}T00:00:00Z`);
const link = work => /^https:\/\/www\.douyin\.com\/(video|note)\/\d+$/.test(work.url) ? work.url : '#account-data';
const mean = numbers => numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
const median = numbers => {const a = [...numbers].sort((a,b) => a-b); return (a[Math.floor((a.length-1)/2)] + a[Math.floor(a.length/2)]) / 2;};

const sourceLabel = source => source?.id === 'xingtu-work' ? '作品数据快照' : source?.title || '未取得';
const shortTitle = work => {
  const title = work.title.split(/[\n#]/)[0].trim();
  const end = title.search(/[？?。]/);
  return end >= 6 && end < 60 ? title.slice(0,end+1) : title.slice(0,66);
};
const reviewIds = new Set(['7547670462312336700','7489333453977111865','7553538683322207548','7561699295905369404','7654134834776443313']);
function workCard(work, key, index, covers) {
  const cover = covers[work.id];
  return `<article class="hd-rank-card hd-picture-card" data-review-work="${work.id}"><a class="hd-rank-original" href="${escape(link(work))}" target="_blank" rel="noopener noreferrer" aria-label="在抖音播放：${escape(shortTitle(work))}"><div class="hd-rank-art">${cover ? `<img src="${escape(cover)}" width="323" height="430" loading="lazy" alt="${escape(shortTitle(work))}作品封面">` : '<span class="hd-cover-unavailable">前往抖音看原作 ↗</span>'}<span class="hd-cover-play">▶ 抖音原作</span><b class="hd-cover-number">${String(index+1).padStart(2,'0')}</b></div><div class="hd-rank-meta"><time>${escape(work.date)}</time><span>↗</span></div><h4>${escape(shortTitle(work))}</h4></a><p class="hd-selection-reason">${escape(selectionLabel(work))}<br>${escape(publicationLabel(work))}<br><strong>${work.contribution?'我的代表作':'账号案例'}</strong></p>${key==='likes'&&work.playback_readback?`<p class="hd-note">11月5日补查播放 ${fmt(work.playback_readback.value)}</p>`:''}${key?`<div class="hd-rank-value"><strong>${shown(work,key)}</strong><span>累计${key === 'views' ? '播放' : labels[key]}${key==='views' && metric(work,key)?.as_of ? '<br>'+escape(metric(work,key).as_of)+' 快照':''}</span></div>`:''}${reviewIds.has(work.id)?`<button class="hd-review-open" type="button" data-hd-study="${work.id}" disabled>阅读拆解 <span aria-hidden="true">↗</span></button>`:''}</article>`;
}

function chartFrame(title, width = 800, height = 310) {
  return `<svg viewBox="0 0 ${width} ${height}" style="min-width:${width}px" class="hd-chart" role="group" aria-label="${escape(title)}"><title>${escape(title)}</title>`;
}
function grid(max, width = 800, base = 252, top = 30) {
  let html = '';
  for (let i = 0; i <= 4; i++) {
    const y = base - (base-top) * i/4;
    html += `<path class="hd-grid" d="M65 ${y}H${width-20}"/><text x="54" y="${y+4}" text-anchor="end">${fmt(max*i/4)}</text>`;
  }
  return html;
}
function monthsBetween(start, end) {
  let [year, month] = start.slice(0,7).split('-').map(Number);
  const result = [];
  while (`${year}-${String(month).padStart(2,'0')}` <= end.slice(0,7)) {
    result.push(`${year}-${String(month).padStart(2,'0')}`);
    if (++month > 12) {month = 1; year++;}
  }
  return result;
}

function markup(data) {
  const c = data.meta.coverage;
  const relatedCount=data.works.filter(w=>workRelated(w,data.meta.employment)).length;
  return `<div class="wrap">
    <div class="section-label"><span>SELECTED WORKS / 作品表现</span></div><div class="section-heading"><h2 id="hd-heading">精选作品</h2><p>高赞与高播放样本 · 2026年7—10月<br>共${data.works.length}条 · 我的代表作 ${data.works.filter(w=>w.contribution).length}条</p></div>
    <div class="rank-switch" role="group" aria-label="精选作品排序"><button type="button" data-rank-mode="likes" aria-pressed="true">高赞作品 · ${data.selection.rankings.A.length}</button><button type="button" data-rank-mode="views" aria-pressed="false">高播放作品 · ${data.selection.rankings.B.length}</button><button type="button" data-rank-mode="recent" aria-pressed="false">7—10月作品 · ${data.selection.works.filter(w=>w.selection.includes('C')).length}</button></div>
    <p class="hd-note hd-selection-scope">${escape(data.selection.scope_note)}</p>
    <div class="hd-likes-heading hd-chart-heading hd-rank-heading"><div><span class="eyebrow">04 / OPEN THE WORK</span><h3 id="hd-rank-title">从数据，回到作品。</h3></div></div>
    <div class="hd-rank" id="hd-rank"></div>


    <section hidden class="hd-playback" id="playback-samples" aria-labelledby="hd-playback-title">
      <div class="hd-chart-heading"><div><span class="eyebrow">PLAYBACK / SELECTED WORKS</span><h3 id="hd-playback-title">累计播放量较高的作品</h3></div></div>
      <p class="hd-note" id="hd-playback-meta"></p>
      <div class="hd-rank" id="hd-playback-rank"></div>
      <div class="hd-chart-heading"><div><span class="eyebrow">PLAYBACK / ADDITIONAL SAMPLE</span><h3>11月5日补查播放</h3></div></div>
      <p class="hd-note">原表同批4条中的前二；上游统计定义待核。</p>
      <div class="hd-rank" id="hd-playback-supplement"></div>

    </section>
    <section hidden id="recent-selection" aria-labelledby="hd-recent-title"><div class="hd-chart-heading"><h3 id="hd-recent-title">2026年7—10月发布</h3><p class="hd-note">${data.selection.coverage.recent_in_employment}条任职窗口内发布 · ${data.selection.coverage.recent_after_exit}条离职后发布补充</p></div><div class="hd-rank" id="hd-recent-rank"></div></section>
<details class="account-details"><summary>作品数据与互动图表 <span aria-hidden="true">＋</span></summary>    <div class="hd-kpis" aria-label="抖音数据覆盖">
      ${[[`${c.catalogue}`,'入选作品'],[`${c.dated}<small> / ${c.catalogue}</small>`,'有发布日期'],[`${c.likes}<small> / ${c.catalogue}</small>`,'有累计点赞'],[`${relatedCount}`,'任职窗口内发布']].map(([n,title]) => `<div><strong>${n}</strong><span>${title}</span></div>`).join('')}
    </div>
    <p class="hd-snapshot">抖音作品 · ${data.meta.snapshot_date.replaceAll('-','.')} 累计数据</p>

    <div class="hd-range" aria-label="数据图表筛选">
      <div class="hd-presets" role="group" aria-label="选择作品日期范围"><button type="button" data-hd-range="employment" aria-pressed="false">任职窗口内发布</button><button type="button" data-hd-range="all" aria-pressed="true">全部入选作品</button></div>
      <div class="hd-inputs"><label>开始日期<input id="hd-start" type="date" aria-label="数据开始日期"></label><span class="hd-date-dash">—</span><label>结束日期<input id="hd-end" type="date" aria-label="数据结束日期"></label><label>累计指标<select id="hd-metric" aria-label="图表累计指标">${Object.entries(labels).map(([key,label]) => `<option value="${key}">${label}</option>`).join('')}</select></label><label>查看方式<select id="hd-view" aria-label="图表查看方式"><option value="works">逐作品曲线</option><option value="months">按发布月份汇总</option></select></label></div>
      <p id="hd-range-note" class="hd-note"></p><p id="hd-error" class="hd-error" role="alert" hidden></p>
    </div>

    <div class="hd-chart-heading"><div><span class="eyebrow" id="hd-chart-kicker">01 / WORK BY WORK</span><h3 id="hd-chart-title">各作品的累计点赞</h3></div><p id="hd-summary" aria-live="polite"></p></div>
    <div class="hd-piano-tools" role="group" aria-label="图表钢琴音效"><button type="button" id="hd-piano-toggle" aria-pressed="true">钢琴声：开 ♪</button><p id="hd-piano-status" role="status">圆点钢琴</p><output id="hd-piano-note" aria-hidden="true">♪</output><details class="hd-piano-credit"><summary>音色来源</summary><p>Salamander Grand Piano · <a href="https://github.com/Tonejs/audio/blob/master/salamander/README" target="_blank" rel="noopener noreferrer">Alexander Holm</a> · <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer">CC BY 3.0</a>。音源经 Tonejs/audio 提供，播放时变调并淡出。</p></details></div>
    <div class="hd-main-grid"><div><p class="hd-scroll-hint">左右滑动图表，点选查看数据 ↔</p><div class="hd-chart-scroll" id="hd-timeline" tabindex="0" aria-label="作品图表，可横向滚动"></div><p class="hd-note" id="hd-chart-note"></p></div><aside class="hd-work-detail" id="hd-work-detail" aria-label="选中作品详情" aria-live="polite"></aside></div>
    <div class="hd-sample-stats" id="hd-sample-stats"></div>

    <div class="hd-duo">
      <article class="hd-panel"><span class="eyebrow">02 / THE DISTRIBUTION</span><h3>点赞量分布</h3><div id="hd-distribution"></div></article>
      <article class="hd-panel"><span class="eyebrow">03 / SAVED & SHARED</span><h3>被收藏，也被分享。</h3><p class="hd-note" id="hd-pair-note"></p><div id="hd-pairs" class="hd-chart-scroll" tabindex="0" aria-label="分享收藏对照图，可横向滚动"></div></article>
    </div>

</details>
  </div>`;
}

function syncEmploymentLabels(data) {
  const end = data.meta.employment.end;
  const endTime = $('.experience .dates time:last-child');
  if (endTime) {endTime.dateTime = end; endTime.textContent = end.replaceAll('-','.');}
  for (const selector of ['.cover-subtitle > span', '.site-footer div > p > span']) {
    const element = $(selector);
    if (element) element.textContent = element.textContent.replace('2026.10.31', end.replaceAll('-','.'));
  }
  const meta = $('meta[name="description"]');
  if (meta) meta.content = meta.content.replace('2026年10月31日','2026年10月20日');
  const storyLabel = $('#stories .section-label span:last-child');
  if (storyLabel?.textContent === '任职期间账号内容选读') storyLabel.textContent = '账号内容选读';
  const employmentOption = $('#archive-period option[value="employment"]');
  if (employmentOption) employmentOption.textContent = '任职窗口内发布';
}

function init(root, data, covers) {
  root.innerHTML = markup(data);
  syncEmploymentLabels(data);
  const q = selector => $(selector, root), works = data.works;
  const start = q('#hd-start'), end = q('#hd-end'), selectMetric = q('#hd-metric'), view = q('#hd-view');
  const available = data.meta.available_dates;
  const sources = new Map(data.sources.map(s => [s.id,s]));
  let mode = 'employment', current = [], ranked = [], selectedId = null;
  for (const input of [start,end]) {input.min = available.start; input.max = available.end;}

  function detail(work) {
    q('#hd-work-detail').dataset.workId=work?.id || '';
    if (!work) {q('#hd-work-detail').innerHTML = '<p class="eyebrow">WORK DETAIL</p><p>这个范围暂无可显示的指标。缺失没有按0处理。</p>'; return;}
    selectedId = work.id;
    root.querySelectorAll('[data-hd-month]').forEach(node => {node.classList.remove('hd-active-month');node.setAttribute('aria-pressed','false');});
    q('#hd-work-detail').innerHTML = `<p class="eyebrow">SELECTED / 抖音账号作品</p><time>${escape(work.date || '发布日期未取得')}</time><p class="hd-note">${escape(publicationLabel(work))} · ${work.contribution?'我的代表作':'账号案例'}</p>${work.contribution?`<p class="hd-note">${escape(work.contribution.summary)}</p>`:''}<h4>${escape(shortTitle(work))}</h4><div class="hd-selected-metric"><strong>${shown(work,selectMetric.value)}</strong><span>累计${labels[selectMetric.value]} / ${data.meta.snapshot_date.replaceAll('-','.')}快照</span></div><dl>${Object.entries(labels).filter(([key]) => key!==selectMetric.value).map(([key,label]) => `<div><dt>${label}</dt><dd>${shown(work,key)}</dd></div>`).join('')}</dl><a class="hd-work-link" href="${escape(link(work))}" target="_blank" rel="noopener noreferrer">打开抖音原作 ↗</a><p class="hd-note">当前指标来源：${escape(sourceLabel(sources.get(metric(work,selectMetric.value)?.source_id)))}。</p>`;
    root.querySelectorAll('[data-hd-work]').forEach(node => {
      const active = node.dataset.hdWork === work.id;
      node.classList.toggle('hd-active-point',active);
      node.setAttribute('aria-pressed',String(active));
      node.setAttribute('tabindex',active ? '0' : '-1');
    });
    root.querySelectorAll('svg').forEach(svg => {
      const first = $('[data-hd-work]',svg);
      if (first && !$('[data-hd-work][tabindex="0"]',svg)) first.setAttribute('tabindex','0');
    });
    root.dispatchEvent(new CustomEvent('hd-work-selected',{detail:{id:work.id}}));
  }

  function timeline(rows, key) {
    const valid = rows.filter(w => w.date && known(w,key)).sort((a,b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    if (!valid.length) {q('#hd-timeline').innerHTML = `<div class="hd-empty">${mode==='unknown' ? '当前作品暂无发布日期' : '这个范围没有取得可绘制的读数。'}</div>`; return;}
    const width=800, base=252, top=30, max=Math.max(1,...valid.map(w => value(w,key)));
    const from=day(start.value), to=day(end.value), span=Math.max(86400000,to-from);
    const points = valid.map(w => ({work:w,x:65+(day(w.date)-from)/span*(width-90),y:base-value(w,key)/max*(base-top)}));
    let svg=chartFrame(`各作品按发布日期排列的累计${labels[key]}；截至${data.meta.snapshot_date}，不是逐日增长`)+grid(max);
    svg+=`<path class="hd-work-line" d="${points.map((p,i) => `${i?'L':'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')}"/>`;
    for (const p of points) svg+=`<circle class="hd-point" data-hd-work="${p.work.id}" cx="${p.x}" cy="${p.y}" r="5" role="button" tabindex="-1" aria-label="${escape(`${p.work.date} ${p.work.title}，累计${labels[key]}${shown(p.work,key)}；按左右键切换作品`)}"><title>${escape(`${p.work.date} · ${p.work.title}\n累计${labels[key]} ${shown(p.work,key)}`)}</title></circle>`;
    for (let i=0; i<=4; i++) {const x=65+i*(width-90)/4; const date=new Date(from+(to-from)*i/4).toISOString().slice(0,10); svg+=`<text x="${x}" y="280" text-anchor="${i===0?'start':i===4?'end':'middle'}">${date}</text>`;}
    q('#hd-timeline').innerHTML=svg+'</svg>';
  }

  function monthly(rows,key) {
    if (mode==='unknown') {timeline(rows,key); return;}
    const bins=monthsBetween(start.value,end.value).map(month => ({month,works:rows.filter(w => w.date?.startsWith(month))}));
    const max=Math.max(1,...bins.map(bin => bin.works.filter(w => known(w,key)).reduce((s,w) => s+value(w,key),0)));
    const width=Math.max(800,bins.length*30+95), base=252, slot=(width-90)/bins.length;
    let svg=chartFrame(`按发布月份分组的累计${labels[key]}已知值；不是当月新增流量`,width)+grid(max,width);
    bins.forEach((bin,i) => {
      const knownRows=bin.works.filter(w => known(w,key)), total=knownRows.reduce((s,w) => s+value(w,key),0), x=65+(i+.5)*slot, h=total/max*222;
      const description=`${bin.month}：${bin.works.length}条作品记录，${knownRows.length}条有累计${labels[key]}${knownRows.length?`；已知值合计约${fmt(total)}`:''}`;
      svg+=`<g data-hd-month="${bin.month}" role="button" aria-label="${escape(description)}" aria-pressed="false" tabindex="${i===0?'0':'-1'}"><title>${escape(description)}</title><rect class="hd-month-hit" x="${x-slot*.45}" y="25" width="${slot*.9}" height="240"/>${knownRows.length ? `<rect class="hd-month-bar" x="${x-slot*.3}" y="${base-h}" width="${slot*.6}" height="${Math.max(h,1)}"/>` : `<path class="hd-missing" d="M${x-3} ${base-6}l6 6m-6 0 6-6"/>`}${i%Math.max(1,Math.ceil(bins.length/13))===0?`<text x="${x}" y="281" text-anchor="middle">${bin.month.slice(2)}</text>`:''}</g>`;
    });
    q('#hd-timeline').innerHTML=svg+'</svg>';
  }

  function monthDetail(month) {
    q('#hd-work-detail').dataset.workId='';
    const key=selectMetric.value, rows=current.filter(w=>w.date?.startsWith(month)), measured=rows.filter(w=>known(w,key));
    const top=[...measured].sort((a,b)=>value(b,key)-value(a,key))[0];
    q('#hd-work-detail').innerHTML=`<p class="eyebrow">MONTH / 发布月份样本</p><time>${escape(month)}</time><h4>月度作品累计表现</h4><div class="hd-selected-metric"><strong>${measured.length?'约 '+fmt(measured.reduce((s,w)=>s+value(w,key),0)):'未取得'}</strong><span>已知样本累计${labels[key]}之和 / ${data.meta.snapshot_date.replaceAll('-','.')}快照</span></div><dl><div><dt>作品记录</dt><dd>${rows.length} 条</dd></div><div><dt>有这个指标</dt><dd>${measured.length} 条</dd></div></dl><button class="hd-month-open" type="button" data-hd-month-open="${month}">只看这个月的作品 ↗</button>${top?`<p class="hd-note">该月当前${labels[key]}较高的样本：</p><a class="hd-work-link" href="${escape(link(top))}" target="_blank" rel="noopener noreferrer">${escape(top.title)} ↗</a>`:''}`;
    root.querySelectorAll('[data-hd-month]').forEach(node=>{const active=node.dataset.hdMonth===month;node.classList.toggle('hd-active-month',active);node.setAttribute('aria-pressed',String(active));node.setAttribute('tabindex',active?'0':'-1');});
  }

  function pairs(rows) {
    const paired=rows.filter(w => known(w,'shares') && known(w,'favorites'));
    q('#hd-pair-note').textContent=`当前范围 ${rows.length} 条；其中 ${paired.length} 条同时有收藏、分享。横轴：收藏；纵轴：分享。`;
    if (!paired.length) {q('#hd-pairs').innerHTML='<div class="hd-empty">暂无共同取得的收藏、分享读数。</div>'; return;}
    const width=600,base=252,maxX=Math.max(1,...paired.map(w => value(w,'favorites'))),maxY=Math.max(1,...paired.map(w => value(w,'shares')));
    let svg=chartFrame('收藏与分享的累计快照对照：横轴收藏，纵轴分享',width)+grid(maxY,width);
    for(let i=0;i<=3;i++)svg+=`<text x="${65+i*(width-90)/3}" y="280" text-anchor="${i===0?'start':i===3?'end':'middle'}">${fmt(maxX*i/3)}</text>`;
    for(const w of paired)svg+=`<circle class="hd-pair-point" data-hd-work="${w.id}" cx="${65+value(w,'favorites')/maxX*(width-90)}" cy="${base-value(w,'shares')/maxY*222}" r="5" role="button" tabindex="-1" aria-label="${escape(`${w.title}，收藏${shown(w,'favorites')}，分享${shown(w,'shares')}`)}"><title>${escape(`${w.title}\n收藏 ${shown(w,'favorites')} · 分享 ${shown(w,'shares')}`)}</title></circle>`;
    q('#hd-pairs').innerHTML=svg+'</svg>';
  }

  function distribution() {
    const bins=[{name:'不足 1,000',min:0,max:1000},{name:'1,000—9,999',min:1000,max:10000},{name:'1万—不足5万',min:10000,max:50000},{name:'5万—不足10万',min:50000,max:100000},{name:'10万—不足50万',min:100000,max:500000},{name:'50万及以上',min:500000,max:Infinity}];
    for(const bin of bins)bin.count=works.filter(w => known(w,'likes') && value(w,'likes')>=bin.min && value(w,'likes')<bin.max).length;
    const max=Math.max(...bins.map(bin=>bin.count),1);
    q('#hd-distribution').innerHTML=bins.map(bin=>`<div class="hd-dist-row"><span>${bin.name}</span><i><b style="width:${bin.count/max*100}%"></b></i><strong>${bin.count}<small>条</small></strong></div>`).join('');
  }

  function render() {
    const key=selectMetric.value;
    root.querySelectorAll('[data-hd-range]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.hdRange===mode)));
    const invalid=mode!=='unknown' && (!start.value || !end.value || start.value>end.value || start.value<available.start || end.value>available.end);
    q('#hd-error').hidden=!invalid;
    if(invalid){
      q('#hd-error').textContent=`请选择${available.start}至${available.end}之间的有效日期，开始日期不能晚于结束日期。`;
      q('#hd-range-note').textContent='当前日期范围无效，尚未计算样本。';
      current=[];ranked=[];q('#hd-timeline').innerHTML='<div class="hd-empty">调整日期后显示图表。</div>';q('#hd-summary').textContent='日期范围无效';q('#hd-sample-stats').innerHTML='';pairs([]);detail(null);return;
    }
    current=works.filter(w=>mode==='unknown'?!w.date:w.date&&w.date>=start.value&&w.date<=end.value&&(mode!=='employment'||workRelated(w,data.meta.employment)));
    const measured=current.filter(w=>known(w,key));
    ranked=[...current].sort((a,b)=>(known(b,key)?value(b,key):-1)-(known(a,key)?value(a,key):-1)||(b.date||'').localeCompare(a.date||''));
    q('#hd-range-note').textContent=mode==='unknown'?`${current.length}条作品暂未收录发布日期。`:`${current.length}条作品 · 发布日期${start.value}—${end.value}`;
    q('#hd-summary').textContent=`${current.length} 条样本 · ${measured.length} 条有累计${labels[key]} · ${current.length-measured.length} 条缺失`;
    q('#hd-chart-title').textContent=view.value==='months'?`按发布月份分组的累计${labels[key]}`:`各作品的累计${labels[key]}`;
    q('#hd-chart-kicker').textContent=view.value==='months'?'01 / BY PUBLICATION MONTH':'01 / WORK BY WORK';
    q('#hd-chart-note').textContent='';
    if(view.value==='months')monthly(current,key);else timeline(current,key);
    pairs(current);
    q('#hd-sample-stats').innerHTML=measured.length?`<div><span>当前作品数</span><strong>${measured.length}<small>条</small></strong></div><div><span>累计${labels[key]}均值</span><strong>约 ${fmt(mean(measured.map(w=>value(w,key))))}</strong></div><div><span>累计${labels[key]}中位数</span><strong>约 ${fmt(median(measured.map(w=>value(w,key))))}</strong></div>`:'<p>当前范围未取得这个指标，保留缺失。</p>';
    const top=data.selection.rankings.A.map(id=>works.find(w=>w.id===id));
    q('#hd-rank-title').textContent='已核样本 · 高赞作品';
    q('#hd-rank').innerHTML=top.map((work,index)=>workCard(work,'likes',index,covers)).join('');
    const chosen=measured.find(w=>w.id===selectedId)||measured[0]||current[0];detail(chosen);
    if(view.value==='months'&&mode!=='unknown')monthDetail((current[0]?.date||start.value).slice(0,7));
    root.querySelectorAll('[data-hd-range]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.hdRange===mode)));
  }

  function preset(next) {
    mode=next;start.disabled=end.disabled=next==='unknown';
    if(next==='employment'){start.value=data.meta.employment.filter_start_assumption;end.value=workEnd(data);}
    if(next==='all'){start.value=available.start;end.value=available.end;}
    render();
  }
  root.querySelectorAll('[data-hd-range]').forEach(button=>button.addEventListener('click',()=>preset(button.dataset.hdRange)));
  for(const input of [start,end])input.addEventListener('change',()=>{mode='custom';render();});
  for(const input of [selectMetric,view])input.addEventListener('change',render);
  root.addEventListener('click',event=>{
    const node=event.target.closest('[data-hd-work]');if(node)detail(works.find(w=>w.id===node.dataset.hdWork));
    const month=event.target.closest('[data-hd-month]');if(month)monthDetail(month.dataset.hdMonth);
    const open=event.target.closest('[data-hd-month-open]');
    if(open){const month=open.dataset.hdMonthOpen,[year,n]=month.split('-').map(Number),last=new Date(Date.UTC(year,n,0)).toISOString().slice(0,10);start.value=start.value>month+'-01'?start.value:month+'-01';end.value=end.value<last?end.value:last;mode='custom';render();}
  });
  root.addEventListener('keydown',event=>{
    const month=event.target.closest('[data-hd-month]');
    if(month){
      const months=[...q('#hd-timeline').querySelectorAll('[data-hd-month]')];let index=months.indexOf(month);
      if(event.key==='ArrowRight'||event.key==='ArrowDown')index=Math.min(index+1,months.length-1);
      else if(event.key==='ArrowLeft'||event.key==='ArrowUp')index=Math.max(index-1,0);
      else if(event.key==='Home')index=0;else if(event.key==='End')index=months.length-1;
      else if(event.key!=='Enter'&&event.key!==' ')return;
      event.preventDefault();monthDetail(months[index].dataset.hdMonth);months[index].focus();return;
    }
    const node=event.target.closest('[data-hd-work]');if(!node)return;
    const points=[...node.closest('svg').querySelectorAll('[data-hd-work]')];let index=points.indexOf(node);
    if(event.key==='ArrowRight'||event.key==='ArrowDown')index=Math.min(index+1,points.length-1);
    else if(event.key==='ArrowLeft'||event.key==='ArrowUp')index=Math.max(index-1,0);
    else if(event.key==='Home')index=0;else if(event.key==='End')index=points.length-1;
    else if(event.key!=='Enter'&&event.key!==' ')return;
    event.preventDefault();detail(works.find(w=>w.id===points[index].dataset.hdWork));points[index].focus();
  });
  const playback = data.selection.playback_groups.same_snapshot.map(id=>works.find(w=>w.id===id));
  q('#hd-playback-meta').textContent=`任职窗口${data.selection.coverage.window_known_views}条可靠播放样本 · 每条保留对应快照`;
  q('#hd-playback-rank').innerHTML=playback.map((work,index)=>workCard(work,'views',index,covers)).join('');
  const supplement=data.selection.playback_groups.table_readback.map(id=>works.find(w=>w.id===id));
  q('#hd-playback-supplement').innerHTML=supplement.map((work,index)=>data.selection.rankings.A.includes(work.id)
    ? `<div class="hd-rank-reference"><p class="eyebrow">原表补查样本第${index+1}名</p><h4>${escape(shortTitle(work))}</h4><p class="hd-rank-value"><strong>${shown(work,'views')}</strong><span>累计播放 · 2026.11.05原表读数</span></p><button class="hd-review-open" type="button" data-rank-reference="${work.id}">查看高赞组中的作品 ↗</button></div>`
    : workCard(work,'views',index,covers)).join('');
  const rankedIds=new Set([...data.selection.rankings.A,...data.selection.rankings.B]);
  q('#hd-recent-rank').innerHTML=works.filter(w=>w.selection.includes('C')&&!rankedIds.has(w.id)).sort((a,b)=>b.date.localeCompare(a.date)).map((work,index)=>workCard(work,null,index,covers)).join('');
  root.addEventListener('click',event=>{
    const ref=event.target.closest('[data-rank-reference]');
    if(ref){q('[data-rank-mode="likes"]').click();q(`[data-review-work="${ref.dataset.rankReference}"] .hd-rank-original`)?.focus();return;}
    const button=event.target.closest('[data-rank-mode]');if(!button)return;
    const plays=button.dataset.rankMode==='views',recent=button.dataset.rankMode==='recent';
    root.querySelectorAll('[data-rank-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    q('#hd-rank').hidden=plays||recent;q('.hd-likes-heading').hidden=plays||recent;q('#playback-samples').hidden=!plays;q('#recent-selection').hidden=!recent;
  });
  distribution();preset('all');root.dataset.ready='true';mountGraphPiano(root);
}

export async function mountDataDashboard() {
  if($('#account-data')?.dataset.ready==='true')return;
  if(!$('link[data-hd-style]')){const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./data-dashboard.css?v=20261103-refined3',import.meta.url);style.dataset.hdStyle='true';document.head.append(style);}
  let root=$('#account-data');
  if(!root){root=document.createElement('section');root.id='account-data';const archive=$('#archive');if(archive)archive.before(root);else $('main').append(root);}
  root.classList.add('section','hd-dashboard');root.setAttribute('aria-labelledby','hd-heading');
  root.innerHTML='<div class="wrap"><h2 id="hd-heading">公开作品数据</h2><p role="status">正在读取有来源的作品快照…</p></div>';
  const nav=$('.site-header nav');if(nav&&!$('a[href="#account-data"]',nav)){const a=document.createElement('a');a.href='#account-data';a.textContent='数据';const archive=$('a[href="#archive"]',nav);if(archive)archive.before(a);else nav.append(a);}
  try {
    const response=await fetch(new URL('./data/work-metrics-20261031.json',import.meta.url),{cache:'no-cache'});
    if(!response.ok)throw new Error(`公开作品快照读取失败：${response.status}`);
    const data=await response.json();
    if(data.meta?.schema!=='hualaoban-public-work-metrics/v1'||!Array.isArray(data.works)||data.works.length!==data.meta.coverage.catalogue)throw new Error('公开作品快照的格式或覆盖数量不匹配');
    const selection=await loadWorkSelection();
    data.selection=selection;data.works=selection.works;data.meta.employment=selection.employment;
    data.meta.coverage={catalogue:data.works.length,dated:data.works.length,undated:0,...Object.fromEntries([...Object.keys(labels),'views'].map(key=>[key,data.works.filter(w=>known(w,key)).length]))};
    data.meta.available_dates={start:selection.employment.filter_start_assumption,end:selection.recent_window.end};
    const coverResponse=await fetch(new URL('./data/work-covers.json?v=20261101-visual5',import.meta.url));
    const covers=coverResponse.ok ? await coverResponse.json() : {};
    init(root,data,covers);
    const studies=document.createElement('section');studies.id='content-studies';
    root.querySelector('.wrap').append(studies);
    import('./six-work-review.js?v=20261105-tenure2')
      .then(({mountContentStudies})=>mountContentStudies(root,{works:data.works,covers}))
      .catch(error=>{console.error('内容研究模块未能载入',error);studies.innerHTML='<h3>内容研究</h3><p>内容研究暂未载入，请稍后刷新。</p>';});
  } catch(error) {
    console.error('花老板公开作品图表：',error);
    root.innerHTML='<div class="wrap"><h2 id="hd-heading">公开作品数据</h2><p role="alert">图表快照暂未读取成功。现有作品仍可浏览。</p><button type="button" class="solid-button">重试读取数据 ↻</button></div>';
    $('button',root).addEventListener('click',()=>mountDataDashboard());
  }
}
