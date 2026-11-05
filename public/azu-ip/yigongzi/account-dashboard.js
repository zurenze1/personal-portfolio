import {initDateFilters} from './date-filter.js?v=20261031-r1';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const Q=s=>document.querySelector(s);
const fmt=n=>n>=10000?(n/10000).toLocaleString('zh-CN',{maximumFractionDigits:1})+'万':Number(n).toLocaleString('zh-CN',{maximumFractionDigits:1});
function bars(rows,{percent=false,max=null}={}){const m=max??(percent?100:Math.max(...rows.map(x=>x.value),1));return '<div class="ygd-bar-list">'+rows.map(x=>`<div class="ygd-bar-row"><span>${E(x.label)}</span><i><b style="width:${Math.min(100,x.value/m*100)}%"></b></i><strong>${percent?x.value.toFixed(2)+'%':fmt(x.value)}</strong></div>`).join('')+'</div>'}
function monthly(rows,key,label){const values=rows.map(x=>Number(x[key]??0));const max=Math.max(...values,1);const w=760,h=245,left=30,bottom=211,step=(w-left-18)/rows.length;return `<svg class="ygd-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${E(label)}"><title>${E(label)}</title><path class="axis" d="M${left} 15V${bottom}H${w-6}"/>`+rows.map((x,i)=>{const value=values[i],bh=value/max*157,xx=left+i*step;return `<g><title>${E(x.month)}：${fmt(value)}</title><rect class="bar${i%2?' bar-alt':''}" x="${xx+step*.22}" y="${bottom-bh}" width="${step*.56}" height="${bh}" rx="1"/><text x="${xx+step*.5}" y="${bottom-bh-9}" text-anchor="middle">${fmt(value)}</text><text x="${xx+step*.5}" y="${bottom+24}" text-anchor="middle">${E(x.month.slice(2))}</text></g>`}).join('')+'</svg>'}
function hourly(rows){
 const max=Math.max(...rows.map(x=>x.value),1),ceiling=Math.ceil(max/4)*4;
 const peak=rows.reduce((a,b)=>b.value>a.value?b:a),w=800,h=260,left=42,bottom=214,top=28,step=(w-left-12)/24;
 const grid=Array.from({length:4},(_,i)=>{const value=ceiling*i/3,y=bottom-(bottom-top)*i/3;return `<path class="ygd-hour-grid" d="M${left} ${y}H${w-8}"/><text class="ygd-hour-axis" x="${left-8}" y="${y+6}" text-anchor="end">${Number(value.toFixed(1))}%</text>`}).join('');
 return `<p class="ygd-hour-summary">活跃高峰 <strong>${peak.hour}时 · ${peak.value.toFixed(2)}%</strong><span>0—23时</span></p><svg class="ygd-hours-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="粉丝24小时活跃占比，${peak.hour}时最高，为${peak.value}%"><title>粉丝24小时活跃分布</title>${grid}`+rows.map(x=>{
  const bh=x.value/ceiling*(bottom-top),cx=left+(x.hour+.5)*step;
  return `<g><title>${x.hour}时：${x.value.toFixed(2)}%</title><rect class="ygd-hour-bar${x.value===max?' ygd-hour-peak':''}" x="${cx-step*.31}" y="${bottom-bh}" width="${step*.62}" height="${bh}" rx="1"/>${x.hour%3===0?`<text class="ygd-hour-axis" x="${cx}" y="${bottom+30}" text-anchor="middle">${x.hour}时</text>`:''}</g>`;
 }).join('')+'</svg>';
}
async function init(){
 const response=await fetch('data/account-dashboard-20261030.json?v=20261031-data2');if(!response.ok)throw Error('数据快照读取失败');const d=await response.json();
 Q('#ygd-tenure-chart').innerHTML=monthly(d.tenure.months,'count','2022年10月至2023年12月已核日期样本的发布数量');
 Q('#ygd-formats').innerHTML=bars(d.tenure.publish_time_bins);
 Q('#ygd-topics').innerHTML=bars(d.tenure.topics);
 Q('#ygd-plays').innerHTML=bars([{label:'近15条最低播放',value:d.xingtu.recent15.min_plays},{label:'近15条平均播放',value:d.xingtu.recent15.mean_plays},{label:'近15条最高播放',value:d.xingtu.recent15.max_plays}]);
 Q('#ygd-milestones').innerHTML=d.milestones.map((x,i)=>`<article><b>${E(x.date.slice(0,7).replace('-', '年')+'月')}</b><strong>${E(x.display)}</strong><small>${['入职前','任职期间','离职前'][i]}</small></article>`).join('');
 await initDateFilters();
 const labels={age:'年龄分布',segments:'人群分布',province:'省份分布',city:'城市分布',city_tier:'城市层级',devices:'设备品牌',price:'消费价格偏好',content:'内容偏好',brands:'品牌偏好',activity:'活跃程度'};
 function audience(kind){const a=d.audience[kind];document.querySelectorAll('[data-ygd-audience]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.ygdAudience===kind)));Q('#ygd-gender').innerHTML='<div class="ygd-gender">'+a.gender.map(x=>`<i style="width:${x.value}%" title="${E(x.label)} ${x.value}%"></i>`).join('')+'</div><div class="ygd-legend">'+a.gender.map(x=>`<span>${E(x.label)} ${x.value}%</span>`).join('')+'</div>';for(const key of ['age','segments','province'])Q('#ygd-'+key).innerHTML=bars(a[key],{percent:true});Q('#ygd-audience-more').innerHTML=Object.entries(labels).filter(([k])=>!['age','segments','province'].includes(k)&&a[k]?.length).map(([k,title])=>`<article class="ygd-panel"><h4>${title}</h4>${bars(a[k],{percent:true})}</article>`).join('');Q('#ygd-hours-wrap').hidden=!a.hours?.length;if(a.hours?.length)Q('#ygd-hours').innerHTML=hourly(a.hours)}
 document.querySelectorAll('[data-ygd-audience]').forEach(x=>x.addEventListener('click',()=>audience(x.dataset.ygdAudience)));audience('fans');
 Q('#ygd-quotes').innerHTML=bars(d.xingtu.quotes.map(x=>({label:x.product,value:x.yuan})));
 Q('#ygd-connected').innerHTML=bars(d.xingtu.connected_levels);
 const unusedComparators=d.comparators.map(x=>`<a href="${E(x.url)}" target="_blank" rel="noopener"><strong>${E(x.name)} ↗</strong><small>${E(x.type)}</small><span>${E(x.focus)}</span></a>`).join('');
 document.querySelectorAll('[data-ygd-open-video]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();const clip=Q('#featuredVideo');const disclosure=clip.closest('details');if(disclosure)disclosure.open=true;clip.scrollIntoView({behavior:'auto',block:'start'});}));
 const dialog=Q('#ygd-image-dialog');document.querySelectorAll('[data-ygd-image]').forEach(button=>button.addEventListener('click',()=>{Q('#ygd-dialog-image').src=button.dataset.ygdImage;Q('#ygd-dialog-image').alt=button.dataset.caption;dialog.showModal()}));Q('#ygd-close-image').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
}
init().catch(error=>{console.error(error);const note=Q('#ygd-load-note');if(note){note.hidden=false;note.textContent='数据图表暂未载入，请刷新页面。'}});
