// One approved OR selection shared by every work-bearing surface.
let pending;
export function loadWorkSelection() {
  return pending ||= fetch(new URL('./data/work-selection.json?v=20261105-tenure2',import.meta.url),{cache:'no-cache'}).then(async response=>{
    if(!response.ok)throw new Error('作品筛选清单未能读取');
    const data=await response.json();
    if(data.schema!=='hualaoban-work-selection/v1'||data.rule!=='A OR B OR C'||!Array.isArray(data.works)||new Set(data.works.map(w=>w.id)).size!==data.works.length)throw new Error('作品筛选清单格式错误');
    for(const w of data.works){
      const reasons=[];
      if(data.rankings.A.includes(w.id)&&w.date>=data.employment.ranking_start&&w.date<=data.employment.end)reasons.push('A');
      if(data.rankings.B.includes(w.id)&&w.date>=data.employment.ranking_start&&w.date<=data.employment.end&&Number.isFinite(w.metrics.views?.value))reasons.push('B');
      if(w.date>=data.recent_window.start&&w.date<=data.recent_window.end)reasons.push('C');
      if(!reasons.length||JSON.stringify(reasons)!==JSON.stringify(w.selection)||w.url!=='https://www.douyin.com/video/'+w.id||w.publication_group!==(w.date>data.employment.end?'after_exit':'employment_window'))throw new Error('作品入选依据不一致：'+w.id);
    }
    return {...data,byId:new Map(data.works.map(w=>[w.id,w]))};
  });
}
export const selectionLabel = work => work.selection.map(key=>key==='A'?`高赞样本第${work.ranks.A}名`:key==='B'?`${work.playback_rank.group}第${work.playback_rank.rank}名`:'2026年7—10月发布').join(' · ');
export const publicationLabel = work => work.publication_group==='after_exit'?'离职后发布补充':work.entry_month_boundary?'入职月份 · 具体先后待核':'任职窗口内发布';
