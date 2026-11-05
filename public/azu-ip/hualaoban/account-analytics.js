const $ = (s, root=document) => root.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = n => Number(n).toLocaleString('zh-CN',{maximumFractionDigits:2});
const pct = n => `${num(n)}%`;
const compact = n => n>=10000 ? `${num(n/10000)}万` : num(n);
const colours = ['#42659a','#b5708e','#57877e','#927cb1','#b49b60','#648da8','#977f74','#779469'];
const money = n => `¥${num(n)}`;
const scope = '2026.11.03采集 · 画像更新于2026.11.02';
const pill = (group,items,selected) => `<div class="ax-switch" role="group" aria-label="${esc(({recent:"播放流量口径",cohort:"画像人群",region:"地域层级",active:"活跃时间维度",traffic:"商业流量口径",seed:"种草时间范围"})[group]||group)}">${items.map(([value,label])=>`<button type="button" data-ax-${group}="${value}" aria-pressed="${value===selected}">${label}</button>`).join('')}</div>`;
const card = (title,content,{wide=false,note='',key=''}={}) => `<article class="ax-card${wide?' ax-wide':''}" data-chart="${key||title}"><h3>${title}</h3>${note?`<p class="ax-note">${note}</p>`:''}${content}</article>`;
const stats = rows => `<div class="ax-stats">${rows.map(([value,label,note=''])=>`<div><strong>${value}</strong><span>${label}</span>${note?`<small>${note}</small>`:''}</div>`).join('')}</div>`;
const bars = (rows,{unit='%',max,formatter,notes=[],colourOffset=0}={}) => {
  const ceiling=max||Math.max(1,...rows.map(r=>r.value));
  const format=formatter||(n=>unit==='%'?pct(n):`${num(n)}${unit}`);
  return `<div class="ax-bars" role="img" aria-label="${esc(rows.map(r=>`${r.name} ${format(r.value)}`).join('；'))}">${rows.map((r,i)=>`<div class="ax-bar-row"><div class="ax-bar-label"><span>${esc(r.name)}</span><strong>${format(r.value)}</strong></div><div class="ax-rail"><i style="width:${r.value/ceiling*100}%;--bar:${colours[(i+colourOffset)%colours.length]}"></i></div>${notes[i]?`<small>${notes[i]}</small>`:''}</div>`).join('')}<div class="ax-bar-axis"><span>0</span><span>${format(ceiling)}</span></div></div>`;
};
function donut(rows) {
  let at=0;
  const main=[...rows].sort((a,b)=>b.value-a.value)[0];
  return `<div class="ax-donut"><svg viewBox="0 0 180 180" role="img" aria-label="${esc(rows.map(r=>`${r.name}${pct(r.value)}`).join('；'))}"><circle class="ax-ring-base" cx="90" cy="90" r="68"/>${rows.map((r,i)=>{const node=`<circle cx="90" cy="90" r="68" pathLength="100" stroke="${colours[i]}" stroke-dasharray="${r.value} ${100-r.value}" stroke-dashoffset="${-at}" transform="rotate(-90 90 90)"/>`;at+=r.value;return node;}).join('')}<text x="90" y="87" text-anchor="middle" class="ax-ring-value">${pct(main.value)}</text><text x="90" y="112" text-anchor="middle" class="ax-ring-label">${esc(main.name)}</text></svg><ul>${rows.map((r,i)=>`<li><i style="background:${colours[i]}"></i><span>${esc(r.name)}</span><strong>${pct(r.value)}</strong></li>`).join('')}</ul></div>`;
}
function vertical(rows,{unit='%',width=900,height=240,key=''}={}) {
  const max=Math.max(1,...rows.map(r=>r.value)),base=height-36,top=30,slot=(width-70)/rows.length;
  return `<div class="ax-scroll" tabindex="0" data-lenis-prevent aria-label="${esc(key)}，可左右滑动"><svg viewBox="0 0 ${width} ${height}" style="min-width:${width}px" role="img" aria-label="${esc(key)}"><title>${esc(rows.map(r=>`${r.name} ${num(r.value)}${unit}`).join('；'))}</title>${[0,.5,1].map(s=>`<path class="ax-gridline" d="M42 ${base-(base-top)*s}H${width-8}"/><text x="35" y="${base-(base-top)*s+4}" text-anchor="end">${num(max*s)}${unit}</text>`).join('')}${rows.map((r,i)=>{const x=45+i*slot+slot*.18,h=r.value/max*(base-top);return `<g><rect x="${x}" y="${base-h}" width="${slot*.58}" height="${h}" rx="2" fill="${colours[i%colours.length]}"><title>${esc(r.name)}：${num(r.value)}${unit}</title></rect><text x="${x+slot*.29}" y="${Math.max(15,base-h-7)}" text-anchor="middle">${num(r.value)}${unit}</text><text x="${x+slot*.29}" y="${height-12}" text-anchor="middle">${esc(r.name)}</text></g>`;}).join('')}</svg></div>`;
}

import { loadWorkSelection } from './work-selection.js?v=20261105-tenure2';

function renderReach(root,d) {
  root.innerHTML=`<div class="wrap"><div class="section-label"><span>ACCOUNT / REACH & RESPONSE</span><span>账号规模与内容表现</span></div><div class="ax-heading"><div><p class="eyebrow">THE BIGGER PICTURE</p><h2>内容，被怎样看见。</h2></div><p class="ax-note">2026.11.03采集<br>累计快照与分期样本</p></div>${stats([[compact(d.account.followers),'账号粉丝','2026.10.31账号快照'],[compact(d.account.likes),'累计获赞','2026.10.31账号快照'],[compact(d.account.monthly_connection),'月连接用户','页面当前月度摘要'],[compact(d.account.monthly_deep),'月深度用户','页面当前月度摘要']])}<nav class="ax-jumps" aria-label="数据章节"><a href="#account-data">作品与高赞拆解 ↑</a><a href="#analytics-audience">谁在看内容 ↓</a><a href="#analytics-commercial">商业与种草 ↓</a><span>月涨粉率 ${pct(d.account.monthly_follower_change)}</span></nav><div class="ax-grid">
    ${card('从早期关注，到百万粉丝。',`<ol class="ax-milestones">${d.account.milestones.map(m=>`<li><span>${m.date.slice(0,7).replace('-','.')}</span><strong>${compact(m.value)}</strong><small>第${m.day}天</small></li>`).join('')}</ol>`,{wide:true,note:'历史粉丝里程碑 · 每一项为独立记录',key:'milestones'})}
    ${card('26条作品，均值与中位数。',`<div class="ax-legend"><span><i style="background:${colours[0]}"></i>均值</span><span><i style="background:${colours[1]}"></i>中位数</span></div><div class="ax-year-grid">${d.year.metrics.map(m=>`<div class="ax-pair-chart"><h4>${m.name}</h4>${bars([{name:'均值',value:m.mean},{name:'中位数',value:m.median}],{unit:'',max:Math.max(m.mean,m.median)})}<p class="ax-note">样本累计合计 ${m.approximate?'约':''}${compact(m.total)}${m.max?` · 最高${compact(m.max)}`:''}</p></div>`).join('')}</div>`,{wide:true,note:'账号整体26条独立统计，非入选作品计数 · 发布于2026.01.01—11.01 · 累计互动',key:'year-engagement'})}
    ${card('内容主题分布',donut(d.recent.theme),{note:'创作分析页当前主题画像',key:'themes'})}
    ${card(`入选${d.recent.works.length}条的播放样本`,`<div class="ax-control-row">${pill('recent',[['all','全部流量'],['excluded','排除营销流量']],'all')}<p class="ax-note">${d.recent.works[0].date}—${d.recent.works.at(-1).date}发布 · 累计播放快照 · 独立样本，不作全账号播放排名</p></div><div id="ax-recent-stats"></div><div id="ax-recent-chart"></div><div id="ax-recent-detail" class="ax-selected" aria-live="polite"></div>`,{wide:true,key:'selected-playback'})}
  </div></div>`;
  let mode='all',selected=0;
  function draw(){
    const works=d.recent.works,values=works.map(w=>w[mode]);
    $('#ax-recent-stats',root).innerHTML=stats([[compact(Math.min(...values)),'最低播放'],[compact(d.recent.mean[mode]),'平均播放'],[compact(Math.max(...values)),'最高播放']]);
    const width=Math.max(800,60+works.length*62),height=270,base=224,max=Math.max(...values),slot=(width-70)/works.length;
    $('#ax-recent-chart',root).innerHTML=`<div class="ax-legend"><span><i style="background:${colours[0]}"></i>个人视频</span><span><i style="background:${colours[4]}"></i>商单视频</span><span>点选柱形，查看作品</span></div><div class="ax-scroll" tabindex="0" data-lenis-prevent><svg viewBox="0 0 ${width} ${height}" style="min-width:900px" role="group" aria-label="入选作品累计播放量，线性刻度">${[0,.5,1].map(s=>`<path class="ax-gridline" d="M42 ${base-190*s}H990"/><text x="36" y="${base-190*s+4}" text-anchor="end">${compact(max*s)}</text>`).join('')}${works.map((w,i)=>{const x=48+i*slot,h=w[mode]/max*190;return `<g data-ax-work="${i}" role="button" tabindex="0" aria-pressed="${i===selected}" aria-label="${esc(`${w.date} ${w.title} 累计播放${compact(w[mode])}`)}"><title>${esc(w.title)} ${compact(w[mode])}</title><rect class="ax-hit" x="${x}" y="28" width="54" height="204"/><rect class="ax-recent-bar" x="${x+7}" y="${base-h}" width="35" height="${h}" rx="2" fill="${w.kind==='商单'?colours[4]:colours[0]}"/><text x="${x+24}" y="${Math.max(18,base-h-8)}" text-anchor="middle">${compact(w[mode])}</text><text x="${x+24}" y="252" text-anchor="middle">${w.date.slice(5)}</text></g>`;}).join('')}</svg></div>`;
    const w=works[selected];$('#ax-recent-detail',root).innerHTML=`<span>${w.date} · ${w.kind}视频${w.publication_group==='after_exit'?' · 离职后发布补充':''}</span><h4>${esc(w.title)}</h4><strong>${compact(w[mode])}<small>累计播放</small></strong><a href="${esc(w.url)}" target="_blank" rel="noopener noreferrer">抖音原作 ↗</a>`;
  }
  root.addEventListener('click',e=>{const toggle=e.target.closest('[data-ax-recent]'),work=e.target.closest('[data-ax-work]');if(toggle){mode=toggle.dataset.axRecent;root.querySelectorAll('[data-ax-recent]').forEach(b=>b.setAttribute('aria-pressed',String(b===toggle)));draw();}if(work){selected=+work.dataset.axWork;draw();$(`[data-ax-work="${selected}"]`,root)?.focus({preventScroll:true});}});
  root.addEventListener('keydown',e=>{const w=e.target.closest('[data-ax-work]');if(!w)return;if(['Enter',' '].includes(e.key)){e.preventDefault();w.dispatchEvent(new MouseEvent('click',{bubbles:true}));}if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const n=d.recent.works.length;selected=(+w.dataset.axWork+(e.key==='ArrowRight'?1:n-1))%n;draw();$(`[data-ax-work="${selected}"]`,root).focus({preventScroll:true});}});
  draw();
}

function renderAudience(root,d) {
  root.innerHTML=`<div class="wrap"><div class="section-label"><span>AUDIENCE / PEOPLE BEHIND THE NUMBERS</span><span>受众画像</span></div><div class="ax-heading"><div><p class="eyebrow">WHO IS WATCHING?</p><h2>看内容的人，<br>有自己的偏好。</h2></div><p class="ax-note">${scope}</p></div><nav class="ax-jumps" aria-label="画像章节"><a href="#analytics-reach">账号与内容 ↑</a><a href="#analytics-commercial">商业与种草 ↓</a></nav>${pill('cohort',[['viewers','视频观众'],['fans','粉丝'],['club','粉丝团']],'viewers')}<div id="ax-cohort-content"></div><div class="ax-grid ax-hour-block">${card('观看，发生在什么时候？',`${pill('active',[['hours','24小时'],['week','一周七天']],'hours')}<div id="ax-active-chart"></div><p id="ax-active-note" class="ax-note"></p>`,{wide:true,note:'视频观众活跃时间分布 · 2026.11.02更新',key:'active-time'})}</div></div>`;
  let cohort='viewers',region='province',time='hours';
  const names={viewers:'视频观众',fans:'粉丝',club:'粉丝团'};
  function drawRegion(){
    const p=d.audience[cohort];$('#ax-region-bars',root).innerHTML=bars(p[region],{max:Math.ceil(Math.max(...p[region].map(r=>r.value))/5)*5});
    $('#ax-region-title',root).textContent=`${names[cohort]} · ${region==='province'?'省份':'城市'} Top 10`;
  }
  function draw(){
    const p=d.audience[cohort],female=p.gender.find(r=>r.name==='女性'),mainAge=[...p.age].sort((a,b)=>b.value-a.value)[0];
    $('#ax-cohort-content',root).innerHTML=`${stats([[pct(female.value),'女性占比'],[pct(mainAge.value),mainAge.name],[pct(p.activity.at(-1).value),'高活跃用户']])}<div class="ax-grid">
      ${card('性别分布',donut(p.gender),{key:'gender'})}
      ${card('年龄分布',bars(p.age,{max:100}),{note:'各年龄段占比',key:'age'})}
      ${card('地域分布',`${pill('region',[['province','省份'],['city','城市']],'province')}<p id="ax-region-title" class="ax-note"></p><div id="ax-region-bars"></div>`,{key:'regions'})}
      ${card('城市层级',bars(p.tier,{max:30,notes:p.tier_tgi?p.tier_tgi.map(n=>`TGI ${num(n)}`):[]}),{note:p.tier_tgi?'城市占比 · TGI为对应人群指数':'各城市层级占比',key:'city-tiers'})}
      ${card('人群分布',bars(p.crowd,{max:50}),{key:'crowds'})}
      ${card('活跃度分布',donut(p.activity),{key:'activity'})}
      ${card('设备分布',donut(p.devices),{key:'devices'})}
      ${card('性别偏好指数',bars(p.gender.map((r,i)=>({name:r.name,value:p.gender_tgi[i]})),{max:160,unit:'',notes:['TGI','TGI']}),{note:'指数读数，非人数或百分比',key:'gender-tgi'})}
      ${p.products.length?card('偏好的商品品类',bars(p.products),{note:'偏好占比 Top 3',key:'products'}):''}
      ${p.price?card('消费价格偏好',bars(p.price,{max:25}),{note:'消费价格区间',key:'price-preference'}):''}
      ${p.brands.length?card('消费品牌偏好',bars(p.brands),{note:'偏好占比 Top 10',key:'brand-preference'}):''}
      ${p.interests.length?card('内容兴趣',`<div class="ax-interest">${p.interests.map(n=>`<span>${esc(n)}</span>`).join('')}</div>`,{note:'内容偏好标签',key:'interests'}):''}
    </div>`;region='province';drawRegion();
  }
  function drawTime(){
    const rows=d.active[time],peak=[...rows].sort((a,b)=>b.value-a.value)[0];
    $('#ax-active-chart',root).innerHTML=vertical(rows,{key:'视频观众活跃分布',width:time==='hours'?1000:700});
    $('#ax-active-note',root).textContent=`${time==='hours'?'日内':'周内'}最高：${peak.name} · ${pct(peak.value)}。`;
  }
  root.addEventListener('click',e=>{for(const [key,fn] of [['cohort',v=>{cohort=v;draw();}],['region',v=>{region=v;drawRegion();}],['active',v=>{time=v;drawTime();}]]){const b=e.target.closest(`[data-ax-${key}]`);if(!b)continue;root.querySelectorAll(`[data-ax-${key}]`).forEach(n=>n.setAttribute('aria-pressed',String(n===b)));fn(b.dataset['ax'+key[0].toUpperCase()+key.slice(1)]);}});
  draw();drawTime();
}

function renderCommercial(root,d) {
  const c=d.connected;
  root.innerHTML=`<div class="wrap"><div class="section-label"><span>BUSINESS / CONNECTION & VALUE</span><span>商业表现与种草</span></div><div class="ax-heading"><div><p class="eyebrow">FROM ATTENTION TO INTEREST</p><h2>被看见之后，<br>还有什么发生。</h2></div><p class="ax-note">2026.11.03采集<br>分窗口呈现</p></div><div class="ax-grid">
    ${card('连接用户的四种层次',`${stats([[num(c.total),'当前分层合计'],[`${c.change>0?'+':''}${pct(c.change)}`,'近30天环比']])}<div class="ax-stage-strip" role="img" aria-label="了解、兴趣、喜欢、追随的互斥分层占比">${c.stages.filter(r=>r.value).map((r,i)=>`<i style="width:${r.value/c.total*100}%;background:${colours[i]}"></i>`).join('')}</div><div class="ax-stages">${c.stages.map((r,i)=>`<div><span><i style="background:${colours[i]}"></i>${r.name}</span><strong>${num(r.value)}</strong><small>环比 ${r.change>0?'+':''}${pct(r.change)}</small></div>`).join('')}</div>`,{wide:true,note:'近30天 · 互斥人群分层，非逐级转化率',key:'connection-stages'})}
    ${card('服务报价',bars(d.prices,{unit:'元',formatter:money}),{note:'页面展示报价 · 2026.11.03采集',key:'service-prices'})}
    ${card('内容表现，分开看。',`${pill('traffic',[['excluded','排除营销流量'],['all','全部流量']],'excluded')}<div id="ax-performance"></div>`,{note:'近90天 · 个人视频 / 商单视频',key:'performance'})}
    ${card('同类达人中的位置',`<div id="ax-peer-performance"></div>`,{note:'近90天 · 对应指标优于同类型达人的比例',key:'performance-percentiles'})}
    ${card('看后搜索',`<div class="ax-range-value"><span>平均看后搜次数</span><strong>100<span>—</span>1,000<small>次</small></strong><div class="ax-interval"><i style="left:10%;width:90%"></i></div></div>${bars([{name:'商单 · 同类对比',value:d.seed.search_count.peer_commercial},{name:'个人 · 同类对比',value:d.seed.search_count.peer_personal}],{max:100})}<div class="ax-range-value"><span>看后搜率</span><strong>0.1<span>—</span>0.25<small>%</small></strong><div class="ax-interval"><i style="left:40%;width:60%"></i></div></div>${bars([{name:'商单 · 同类对比',value:d.seed.search_rate.peer_commercial},{name:'个人 · 同类对比',value:d.seed.search_rate.peer_personal}],{max:100})}`,{note:'近30天 · 区间原样保留；同类对比为优于同类型达人的比例',key:'search'})}
    ${card('兴趣与点击',`${stats([['150—2,000','A3增长数','近30天区间'],['1%','商单小蓝词点击率'],['1%','个人小蓝词点击率']])}${bars([{name:'A3增长 · 同类对比',value:d.seed.a3.peer}],{max:100})}`,{note:'近30天',key:'a3-and-click'})}
    ${card('种草内容，按窗口观察。',`${pill('seed',[['30','近30天'],['90','近90天'],['180','近180天']],'180')}<div id="ax-seed-window"></div>`,{note:'内容识别样本，不等同全部商单',key:'seed-window'})}
    ${card('服务效果预估',`${stats([[compact(d.prediction.views),'预期播放量','排除营销流量口径']])}<h4>CPM · 千次播放成本（元）</h4>${bars(d.prediction.items.map(r=>({name:r.name,value:r.cpm})),{unit:'元'})}<h4>CPE · 单次互动成本（元）</h4>${bars(d.prediction.items.map(r=>({name:r.name,value:r.cpe})),{unit:'元'})}`,{note:'页面当前估算，非已交付数据',key:'prediction'})}
    ${card('履约记录',`${stats([[d.fulfillment.tasks,'商业任务数'],[d.fulfillment.industries,'合作行业数'],[d.fulfillment.ongoing,'进行中任务'],[pct(d.fulfillment.reply48),'48小时回复率'],[d.fulfillment.credit,'信用分',d.fulfillment.credit_label]])}`,{note:'近90天 · 信用分沿用页面读数',key:'fulfillment'})}
  </div></div>`;
  let traffic='excluded',days=180;
  function performance(){
    const {personal:p,commercial:b}=d.performance[traffic];
    $('#ax-performance',root).innerHTML=[['views','播放量中位数',compact],['completion','完播率',pct],['interaction','互动率',pct]].map(([key,label,formatter])=>`<div class="ax-pair-chart"><h4>${label}</h4>${bars([{name:'个人视频',value:p[key]},{name:'商单视频',value:b[key]}],{formatter})}</div>`).join('')+`<div class="ax-mini-table" role="table" aria-label="近90天个人与商业视频补充指标"><div role="row"><span role="columnheader">指标</span><span role="columnheader">个人</span><span role="columnheader">商单</span></div>${[['发布作品',p.count,b.count],['平均时长',`${p.duration}秒`,`${b.duration}秒`],['平均点赞',num(p.likes),num(b.likes)],['平均评论',num(p.comments),num(b.comments)],['平均转发',num(p.shares),num(b.shares)]].map(r=>`<div role="row">${r.map(v=>`<span role="cell">${esc(v)}</span>`).join('')}</div>`).join('')}</div>`;
    $('#ax-peer-performance',root).innerHTML=['播放量中位数','完播率','互动率'].map((name,i)=>`<div class="ax-pair-chart"><h4>${name}</h4>${bars([{name:'个人视频',value:p.percentiles[i]},{name:'商单视频',value:b.percentiles[i]}],{max:100})}</div>`).join('');
  }
  function seed(){
    const s=d.seed_windows.find(s=>s.days===days);
    $('#ax-seed-window',root).innerHTML=`<p class="ax-note">${s.start?`${s.start.replaceAll('-','.')}—${s.end.replaceAll('-','.')}`:'近180天的内容样本'}</p>${stats([[s.videos,'视频样本'],[s.brands,'识别品牌'],[s.categories,'识别品类']])}${bars([{name:'累计点赞',value:s.likes},{name:'累计评论',value:s.comments},{name:'累计分享',value:s.shares}],{unit:'',formatter:compact})}<div class="ax-seed-averages"><span>均赞 ${num(s.mean_likes)}</span><span>均评 ${num(s.mean_comments)}</span><span>均转 ${num(s.mean_shares)}</span><span>报价口径 CPE ${num(s.cpe)}</span></div><h4>同类对比</h4>${bars(['平均点赞','平均评论','平均分享'].map((name,i)=>({name,value:s.peers[i]})),{max:100})}`;
  }
  root.addEventListener('click',e=>{const t=e.target.closest('[data-ax-traffic]'),s=e.target.closest('[data-ax-seed]');if(t){traffic=t.dataset.axTraffic;root.querySelectorAll('[data-ax-traffic]').forEach(b=>b.setAttribute('aria-pressed',String(b===t)));performance();}if(s){days=+s.dataset.axSeed;root.querySelectorAll('[data-ax-seed]').forEach(b=>b.setAttribute('aria-pressed',String(b===s)));seed();}});
  performance();seed();
}

try {
  const response=await fetch(new URL('./data/account-analytics-20261103.json',import.meta.url));
  if(!response.ok)throw new Error(`Snapshot HTTP ${response.status}`);
  const data=await response.json();
  const selection=await loadWorkSelection();
  data.recent.works=data.recent.works.filter(work=>selection.byId.has(work.url.split('/').at(-1))).map(work=>({...work,publication_group:selection.byId.get(work.url.split('/').at(-1)).publication_group}));
  for(const key of ['all','excluded'])data.recent.mean[key]=data.recent.works.reduce((sum,w)=>sum+w[key],0)/data.recent.works.length;
  renderReach($('#analytics-reach'),data);
  renderAudience($('#analytics-audience'),data);
  renderCommercial($('#analytics-commercial'),data);
  for(const root of document.querySelectorAll('.ax-section'))root.dataset.ready='true';
  if(['#analytics-reach','#analytics-audience','#analytics-commercial'].includes(location.hash))requestAnimationFrame(()=>$(location.hash)?.scrollIntoView({block:'start',behavior:'instant'}));
} catch(error) {
  for(const root of document.querySelectorAll('.ax-section'))root.innerHTML='<div class="wrap"><p>数据暂未加载成功，请刷新重试。</p></div>';
  console.error('Account analytics load failed',error);
}
