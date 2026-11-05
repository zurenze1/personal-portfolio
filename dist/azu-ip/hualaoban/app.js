'use strict';
const selectionReady=import('./work-selection.js?v=20261105-tenure2').then(async module=>({...(await module.loadWorkSelection()),selectionLabel:module.selectionLabel,publicationLabel:module.publicationLabel}));
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const cover = $('#cover-video');
const main = $('#main-video');
const modal = $('#video-dialog');
const player = $('#dialog-video');
let coverPausedByUser = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let coverInView = true;
let introRunning = false;
let introTimer = 0;
let introReturnFocus = null;
const fashionIntro = $('#fashion-intro');
const introMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function finishFashionIntro() {
  clearTimeout(introTimer);
  introRunning = false;
  fashionIntro.hidden = true;
  fashionIntro.classList.remove('is-playing','is-exiting');
  fashionIntro.style.removeProperty('--intro-exit-from');
  document.body.classList.remove('intro-playing','intro-exiting');
  if (introReturnFocus) {
    introReturnFocus.focus({preventScroll:true});
    introReturnFocus = null;
  }
  resumeCover();
}
function startFashionIntro(replay = false) {
  if (introMotion.matches) { finishFashionIntro(); return; }
  clearTimeout(introTimer);
  introRunning = true;
  main.pause(); player.pause(); cover.pause();
  if (replay) {
    introReturnFocus = $('#replay-fashion-intro');
    window.scrollTo({top:0, behavior:'instant'});
  }
  fashionIntro.hidden = false;
  document.body.classList.add('intro-playing');
  fashionIntro.classList.remove('is-playing','is-exiting');
  document.body.classList.remove('intro-exiting');
  void fashionIntro.offsetWidth;
  fashionIntro.classList.add('is-playing');
  // The fallback also releases the page if an animation is interrupted.
  introTimer = window.setTimeout(finishFashionIntro, 2750);
}
fashionIntro.addEventListener('animationend', (event) => {
  if (event.target === fashionIntro && ['editorial-uncover','editorial-soft-exit'].includes(event.animationName)) finishFashionIntro();
});
function softenFashionExit() {
  if(!introRunning || introMotion.matches){finishFashionIntro();return;}
  fashionIntro.style.setProperty('--intro-exit-from',getComputedStyle(fashionIntro).opacity);
  fashionIntro.classList.add('is-exiting');document.body.classList.add('intro-exiting');
  clearTimeout(introTimer);introTimer=window.setTimeout(finishFashionIntro,650);
}
$('#skip-fashion-intro').addEventListener('click', softenFashionExit);
$('#replay-fashion-intro').addEventListener('click', () => startFashionIntro(true));
introMotion.addEventListener('change', () => {
  $('#replay-fashion-intro').hidden = introMotion.matches;
  if (introMotion.matches) finishFashionIntro();
});
$('#replay-fashion-intro').hidden = introMotion.matches;

function updateCoverButton() {
  $('#cover-toggle').textContent = cover.paused ? '播放影像 ▶' : '暂停影像 Ⅱ';
  $('#cover-toggle').setAttribute('aria-label', cover.paused ? '播放封面影像' : '暂停封面影像');
  $('#cover-toggle').setAttribute('aria-pressed', String(!cover.paused));
}
function resumeCover() {
  if (!introRunning && !coverPausedByUser && coverInView && !document.hidden && main.paused && !modal.open) {
    cover.play().catch(updateCoverButton);
  }
}
cover.addEventListener('play', updateCoverButton);
cover.addEventListener('pause', updateCoverButton);
$('#cover-toggle').addEventListener('click', () => {
  coverPausedByUser = !cover.paused;
  if (cover.paused) { cover.play().catch(updateCoverButton); } else { cover.pause(); }
});
new IntersectionObserver((entries) => {
  coverInView = entries[0].isIntersecting;
  if (!coverInView) cover.pause(); else resumeCover();
}, {threshold: 0.1}).observe(cover);
startFashionIntro();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cover.pause(); main.pause(); player.pause(); } else resumeCover();
});
main.addEventListener('play', () => { cover.pause(); player.pause(); $('#play-main').textContent = '正在播放 · 点击暂停 Ⅱ'; });
main.addEventListener('pause', () => { $('#play-main').textContent = '继续播放案例 ▶'; });
main.addEventListener('ended', () => { $('#play-main').textContent = '重新播放案例 ↻'; });
$('#play-main').addEventListener('click', () => {
  if (main.paused) {
    if (main.ended) main.currentTime = 0;
    main.play().catch(() => { $('#play-main').textContent = '请点击视频内的播放键 ▶'; });
  } else main.pause();
});

const steps = {
  topic: {number:'01 / TOPIC', title:'用一个变化，提出人物问题。', text:'负责选题。成片以人物形象的变化切入，用一个观众能感知的问题建立好奇，再把叙事引向人物经历。', image:'megan', alt:'梅根福克斯作品的片头画面'},
  script: {number:'02 / SCRIPT', title:'从外界评价，写到人物处境。', text:'负责文案。成片从外界评价逐步转向人物处境，形成由表及里的叙事转折。事实与叙事判断分开处理。', image:'megan-story', alt:'梅根福克斯作品中的人物影像素材'},
  shoot: {number:'03 / SHOOTING', title:'口播拍摄与现场执行。', text:'拍摄花老板口播，搜集人物影视与历史影像，围绕叙事组织实拍与资料画面。', image:'megan-material', alt:'梅根福克斯作品中的人物历史素材，与花老板口播实拍分开说明'},
  edit: {number:'04 / EDITING', title:'让口播、素材和字幕接成一条线。', text:'负责剪辑。用口播连接人物影像与字幕，从片头悬念推进到后段的人物解释，让不同类型的素材形成一致的叙事。', image:'megan-edit', alt:'梅根福克斯作品后段的人物影像与字幕'}
};
function selectStep(button) {
  $$('.case-tabs [role="tab"]').forEach((tab) => {
    tab.setAttribute('aria-selected', String(tab === button));
    tab.tabIndex = tab === button ? 0 : -1;
  });
  const step = steps[button.dataset.step];
  $('#case-panel').setAttribute('aria-labelledby', button.id);
  $('#step-number').textContent = step.number;
  $('#step-title').textContent = step.title;
  $('#step-description').textContent = step.text;
  $('#step-image').src = 'media/' + step.image + '.jpg';
  $('#step-image').alt = step.alt;
}
$$('.case-tabs [role="tab"]').forEach((button, index, tabs) => {
  button.addEventListener('click', () => selectStep(button));
  button.addEventListener('keydown', (event) => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); tabs[next].focus(); selectStep(tabs[next]); }
  });
});

const cases = {
  megan: {
    id:'7699436259345709690', title:'她到底对自己做了什么？', category:'MEGAN FOX / 人物叙事',
    lead:'从形象变化的悬念，走到对人物处境的理解。',
    analysis:'片头以昔日形象与当下变化建立问题，中段展开公开人物经历，后段把视角转向公众标签与自主表达。叙事的转折，是从“外界怎样看她”走向“她如何被定义”。',
    excerpt:'完整案例 · 3:57 · 2026.10.22发布 · 离职后发布补充'
  },
  miu: {
    id:'7701314562998416122', title:'Miu Miu 与拉夫劳伦', category:'BRAND & STYLE / 品牌比较',
    lead:'把消费选择，讲成品牌与生活方式的差异。',
    analysis:'原作从熟悉品牌的消费现象切入，逐步讨论价格、生活方式与品牌人格。选读时关注同一维度的比较：讲设计就对应服装，讲定位就对应场景。比较品牌的风格与定位，让观众理解消费选择背后的生活方式。',
    excerpt:'原作节选05:45—06:25 · 2026.10.27发布 · 离职后发布补充'
  },
  coat: {
    id:'7693545828631202417', title:'一件外套，怎样重新流行。', category:'FASHION IN DETAIL / 服装与趋势',
    lead:'把专业的风格判断，转成看得见的识别方法。',
    analysis:'原作以拿破仑外套的流行为线索，在舞台、秀场与日常穿搭之间切换。内容可以围绕立领、盘扣、肩部和轮廓逐一比较，让观众先辨认细节，再理解风格。从服装的轮廓和结构，讲清一种风格为什么重新流行。',
    excerpt:'原作节选 03:10—03:50 · 原作发布于 2026.10.06'
  },
  guopei: {
    id:'7691975616564657905', title:'郭培：一针一线的故事。', category:'PEOPLE & CRAFT / 设计师人物',
    lead:'让作品与工艺的细节，支撑人物的分量。',
    analysis:'人物介绍与礼服、纹样、工艺画面交替出现，让抽象评价有了具体对象。观看时可以关注：哪件作品说明哪段经历，哪个细节支撑哪种判断。用采访、作品与工艺画面，让人物故事变得具体。',
    excerpt:'原作节选 01:40—02:20 · 原作发布于 2026.10.02'
  },
  alo: {
    id:'7673141448158544817', title:'alo 来了，然后呢？', category:'BRAND & LIFESTYLE / 品牌表达',
    lead:'注意力之后，产品与体验怎样让人留下。',
    analysis:'原作从明星合作与品牌入场切入，再讨论生活方式、产品和消费体验。后段把判断落实到设计、面料、做工、门店服务与品牌故事，形成“获得注意—建立认同—产品回应”的观察路径。让品牌态度落到观众能感知的产品细节。',
    excerpt:'原作节选 04:30—05:10 · 原作发布于 2026.08.12'
  },
  guyu: {
    id:'7690819270431337851', title:'谷雨：从话题走到日常需求。', category:'GUYU / 商业叙事选读',
    lead:'让前面提出的问题，成为后面介绍产品的理由。',
    analysis:'原作先借熟悉人物与状态变化引出好奇，再转向普通人的日常护理需求，衔接产品与个人使用表达。通过人物话题、日常需求与产品场景的衔接，让品牌信息自然进入故事。',
    excerpt:'原作节选 00:40—01:15 · 原作发布于 2026.09.29',
    credit:'商业内容 / 品牌叙事'
  },
};
const galleries = {
  megan: [['megan-material','人物历史素材'],['megan-edit','作品后段的人物画面']],
  miu: [['hero-fashion','服装与生活方式'],['portrait','花老板出镜表达']],
  coat: [['coat-detail','轮廓与盘扣'],['coat-stage','舞台造型']],
  guopei: [['craft','礼服细节'],['atelier','工艺画面']],
  alo: [['alo-life','生活方式画面'],['alo-store','品牌空间']],
  guyu: [['guyu-product','产品表达画面']]
};
async function openCase(key) {
  const data = cases[key];
  if (!data) return;
  const selection=await selectionReady;
  const work=selection.byId.get(data.id);
  if(!work)return;
  cover.pause(); main.pause();
  $('#dialog-label').textContent = work.contribution ? '我的代表作' : '账号案例';
  $('#dialog-category').textContent = data.category;
  $('#dialog-title').textContent = data.title;
  $('#dialog-lead').textContent = data.lead;
  $('#dialog-analysis').textContent = data.analysis;
  const gallery = document.createDocumentFragment();
  (galleries[key] || []).forEach(([file, caption]) => {
    const figure = document.createElement('figure');
    const image = document.createElement('img');
    image.src = 'media/' + file + '.jpg';
    image.alt = data.title + '作品中的' + caption;
    image.loading = 'lazy';
    image.width = 630; image.height = 1120;
    const label = document.createElement('figcaption'); label.textContent = caption;
    figure.append(image, label); gallery.append(figure);
  });
  $('#dialog-gallery').replaceChildren(gallery);
  $('#dialog-excerpt').textContent = data.excerpt + ' · 入选：2026年7—10月发布';
  $('#dialog-credit').textContent = work.contribution?.summary || data.credit || '账号内容选读';
  $('#dialog-original').href = 'https://www.douyin.com/video/' + data.id;
  $('#video-error').hidden = true;
  player.poster = 'media/' + key + '.jpg';
  player.setAttribute('aria-label', data.title + '视频');
  $('#dialog-source').src = 'media/' + key + '.mp4';
  player.load();
  modal.showModal();
  modal.scrollTop = 0;
  player.play().catch(() => { /* 原生播放控件仍可操作。 */ });
}
$$('[data-case]').forEach((button) => button.addEventListener('click', () => openCase(button.dataset.case)));
$('#dialog-close').addEventListener('click', () => modal.close());
modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    const rect = modal.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) modal.close();
  }
});
modal.addEventListener('close', () => {
  player.pause();
  $('#dialog-source').removeAttribute('src');
  player.removeAttribute('src');
  player.load();
  resumeCover();
});
player.addEventListener('error', () => { if (modal.open) $('#video-error').hidden = false; });
player.addEventListener('play', () => { main.pause(); cover.pause(); });
$$('[data-filter]').forEach((button) => button.addEventListener('click', () => {
  $$('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
  $$('#story-grid .story').forEach((story) => {
    story.hidden = button.dataset.filter !== 'all' && !story.dataset.categories.split(' ').includes(button.dataset.filter);
  });
}));

let catalogue = [], employment;
let page = 1;
const pageSize = 3;
const platformNames = {douyin:'抖音', xiaohongshu:'小红书'};
function renderArchive() {
  const term = $('#archive-search').value.trim().toLocaleLowerCase();
  const platform = $('#archive-platform').value;
  const period = $('#archive-period').value;
  const filtered = catalogue.filter((work) =>
    (!term || (work.title + ' ' + (work.keywords || '')).toLocaleLowerCase().includes(term)) &&
    (platform === 'all' || work.platform === platform) &&
    (period === 'all' || (period === 'after_exit' && work.publication_group === 'after_exit') ||
     (period === 'employment' && work.date && work.date >= employment.filter_start_assumption && work.date <= employment.end))
  );
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  page = Math.max(1, Math.min(page, pages));
  const fragment = document.createDocumentFragment();
  filtered.slice((page - 1) * pageSize, page * pageSize).forEach((work, index) => {
    const row = document.createElement('a');
    row.className = 'archive-item'; row.href = work.url; row.target = '_blank'; row.rel = 'noopener noreferrer';
    const number = document.createElement('span'); number.className = 'index';
    number.textContent = String((page - 1) * pageSize + index + 1).padStart(2, '0');
    const content = document.createElement('div');
    const title = document.createElement('h3'); title.textContent = work.title;
    const meta = document.createElement('span'); meta.className = 'meta';
    meta.textContent = work.selectionText + ' · ' + work.publicationText + ' · ' + (work.contribution?'我的代表作':'账号案例');
    content.append(title, meta);
    const date = document.createElement('time'); date.textContent = work.date || '日期未收录';
    if (work.date) date.dateTime = work.date;
    const go = document.createElement('span'); go.className = 'go'; go.textContent = '查看原作 ↗';
    row.append(number, content, date, go); fragment.append(row);
  });
  if (!filtered.length) {
    const empty = document.createElement('p'); empty.className = 'empty-state';
    empty.textContent = '没有找到匹配作品，请换一个关键词或调整筛选。';
    fragment.append(empty);
  }
  $('#archive-list').replaceChildren(fragment);
  $('#archive-count').textContent = '找到 ' + filtered.length + ' 条平台记录';
  $('#archive-page').textContent = page + ' / ' + pages;
  $('#archive-prev').disabled = page <= 1;
  $('#archive-next').disabled = page >= pages;
}
$('#archive-search').addEventListener('input', () => { page = 1; renderArchive(); });
['#archive-platform', '#archive-period'].forEach((selector) => $(selector).addEventListener('change', () => { page = 1; renderArchive(); }));
$('#archive-prev').addEventListener('click', () => { page--; renderArchive(); $('#archive-count').scrollIntoView({block:'start'}); });
$('#archive-next').addEventListener('click', () => { page++; renderArchive(); $('#archive-count').scrollIntoView({block:'start'}); });
selectionReady.then(selection => {
  employment=selection.employment;
  catalogue=selection.works.map(work=>({...work,platform:'douyin',selectionText:selection.selectionLabel(work),publicationText:selection.publicationLabel(work)}));
  document.querySelector('.archive-counts').innerHTML=`<span><b>${catalogue.length}</b>入选作品</span><span><b>${selection.coverage.recent}</b>7—10月作品</span><span><b>${selection.coverage.recent_after_exit}</b>离职后发布补充</span>`;
  renderArchive();
}).catch(() => {
  $('#archive-count').textContent = '目录暂时未能加载，请刷新重试。';
});

// Isolated public-data module; shared editorial HTML/CSS stay with the page owner.
import('./data-dashboard.js?v=20261105-tenure2')
  .then(({mountDataDashboard}) => mountDataDashboard())
  .catch((error) => {
    console.error('公开作品数据模块未能载入', error);
    const note = document.createElement('p');
    note.className = 'wrap'; note.setAttribute('role', 'status');
    note.textContent = '公开作品数据暂未载入，请稍后刷新页面。';
    $('#archive').before(note);
  });
