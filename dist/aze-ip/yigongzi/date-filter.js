window.__m_yigongzi_date_filter_js=(()=>{'use strict';
const $=s=>document.querySelector(s);
const labels={count:'作品数量',likes:'累计点赞',comments:'累计评论',shares:'累计分享',collects:'累计收藏'};
const fmt=n=>n>=10000?(n/10000).toLocaleString('zh-CN',{maximumFractionDigits:1})+'万':n.toLocaleString('zh-CN',{maximumFractionDigits:1});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function keysBetween(start,end,unit){
 const from=new Date(start+'T00:00:00Z'),to=new Date(end+'T00:00:00Z'),keys=[];
 if(unit==='year'){from.setUTCMonth(0,1);to.setUTCMonth(0,1)}
 if(unit==='month'){from.setUTCDate(1);to.setUTCDate(1)}
 while(from<=to){keys.push(from.toISOString().slice(0,unit==='year'?4:unit==='month'?7:10));if(unit==='year')from.setUTCFullYear(from.getUTCFullYear()+1);else if(unit==='month')from.setUTCMonth(from.getUTCMonth()+1);else from.setUTCDate(from.getUTCDate()+1)}
 return keys;
}
async function initDateFilters(){
 const response=await fetch('data/dated-works-20261030.json?v=20261111-v64');if(!response.ok)throw Error('日期样本读取失败');
 const data=await response.json(),start=$('#ygd-start'),end=$('#ygd-end'),group=$('#ygd-granularity'),metric=$('#ygd-metric');
 start.value=data.min_date;end.value=data.max_date;
 for(const input of [start,end]){input.min=data.min_date;input.max=data.max_date}
 function render(){
  const a=start.value,b=end.value,unit=group.value,key=metric.value,error=$('#ygd-date-error');
  const valid=a&&b&&a<=b&&a>=data.min_date&&b<=data.max_date;
  error.hidden=!!valid;
  if(!valid){error.textContent=`请选择 ${data.min_date} 至 ${data.max_date} 内的有效日期，开始日期不能晚于结束日期。`;$('#ygd-month-chart').innerHTML='';$('#ygd-work-list').innerHTML='';$('#ygd-month-total').textContent='请调整筛选日期';$('#ygd-range-detail').textContent='';return}
  const records=data.records.filter(x=>x.date>=a&&x.date<=b);
  $('#ygd-work-list').innerHTML=records.map(r=>`<a class="tenure-work-row" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" data-work-id="${esc(r.id)}" data-published="${esc(r.date)}"><time datetime="${esc(r.date)}">${esc(r.date)}</time><strong>${esc(r.display_title||r.title)}</strong><span>${esc(r.type||'视频')}${Number.isFinite(r.likes)?' · '+fmt(r.likes)+'赞':''}</span><b aria-hidden="true">↗</b></a>`).join('');
  const keys=keysBetween(a,b,unit),bins=new Map(keys.map(k=>[k,{date:k,count:0,value:0,known:0}]));
  for(const row of records){const bin=bins.get(row.date.slice(0,unit==='year'?4:unit==='month'?7:10));bin.count++;if(key==='count'||Number.isFinite(row[key])){bin.value+=key==='count'?1:row[key];bin.known++}}
  const rows=[...bins.values()],known=rows.reduce((s,x)=>s+x.known,0),total=rows.reduce((s,x)=>s+x.value,0);
  $('#ygd-month-total').textContent=key!=='count'&&records.length>0&&known===0?`${a} — ${b} / ${labels[key]}：未取得`:`${a} — ${b} / ${labels[key]}${key==='count'?'':'已知值'}合计：${fmt(total)}${key==='count'?'条':'次'}`;
  $('#ygd-range-detail').textContent=`目录收录 ${records.length} 条${key==='count'?'':` · 其中 ${known} 条有该指标，${records.length-known} 条缺失`}${records.length?'':' · 该区间暂无已核作品'}。${unit==='day'&&keys.length>90?'日视图可横向滑动查看。':''}`;
  const max=Math.max(1,...rows.map(x=>x.value)),step=unit==='day'?30:unit==='year'?145:62,w=Math.max(740,rows.length*step+60),h=285,left=35,base=236,slot=(w-left-20)/Math.max(1,rows.length),tickEvery=unit==='day'?Math.max(1,Math.ceil(rows.length/35)):1;
  let chart=`<svg class="ygd-chart ygd-date-chart" style="min-width:${w}px" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(a+'至'+b+' '+labels[key]+'按'+({year:'年',month:'月',day:'日'}[unit])+'汇总图')}，可横向滑动"><title>${esc(labels[key])}；空缺指标不按0补齐</title><path class="axis" d="M${left} 20V${base}H${w-8}"/>`;
  rows.forEach((x,i)=>{const bh=x.value/max*165,xx=left+slot*(i+.2),cx=left+slot*(i+.5),missing=key!=='count'&&x.count>0&&x.known===0,label=unit==='year'?x.date:unit==='month'?x.date.slice(2):x.date.slice(5);chart+=`<g><title>${esc(x.date)}：${missing?'该指标缺失':fmt(x.value)}；已核作品${x.count}条${key==='count'?'':`，有指标${x.known}条`}</title>${missing?`<path class="missing-mark" d="M${cx-4} ${base-8}l8 8m-8 0 8-8"/>`:`<rect class="bar${i%2?' bar-alt':''}" x="${xx}" y="${base-bh}" width="${Math.max(3,slot*.6)}" height="${bh}" rx="2"/>`}${(rows.length<=40||x.value===max)&&!missing?`<text x="${cx}" y="${base-bh-9}" text-anchor="middle">${fmt(x.value)}</text>`:''}${i%tickEvery===0?`<text x="${cx}" y="${base+26}" text-anchor="middle">${esc(label)}</text>`:''}</g>`});
  $('#ygd-month-chart').innerHTML=chart+'</svg>';
  document.querySelectorAll('[data-ygd-range]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.ygdRange==='all'?a===data.min_date&&b===data.max_date:a==='2022-10-01'&&b==='2023-06-30')));
 }
 for(const input of [start,end,group,metric])input.addEventListener('change',render);
 document.querySelectorAll('[data-ygd-range]').forEach(button=>button.addEventListener('click',()=>{start.value=button.dataset.ygdRange==='all'?data.min_date:'2022-10-01';end.value=button.dataset.ygdRange==='all'?data.max_date:'2023-06-30';render()}));
 render();
}

return {initDateFilters};})();
