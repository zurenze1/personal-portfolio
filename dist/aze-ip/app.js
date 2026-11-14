(async()=>{'use strict';
const {createSiteSound}=window.__m_sound_js;
const siteSound = createSiteSound();
const $ = (s) => document.querySelector(s);
// Resolves when the visitor clicks into the site (enter page), or straight away when there is none.
const entered = new Promise(resolve => {
  const root = document.documentElement, gate = document.getElementById('enter-gate');
  const wordmark = document.getElementById('gate-enter');
  if (!root.classList.contains('has-gate') || !gate || !wordmark) { resolve(false); return; }
  let entering = false;
  const go = async () => {
    if(entering) return;
    entering = true;
    // Unlock audio in the gesture, while letting the page enter immediately.
    void siteSound.unlock().catch(()=>{});
    root.classList.add('entered'); gate.setAttribute('aria-hidden', 'true');
    wordmark.disabled = true; resolve(true);
  };
  wordmark.addEventListener('click', go);
  wordmark.addEventListener('keydown', e => {
    if (root.classList.contains('entered') || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault(); go();
  });
  try { wordmark.focus({ preventScroll: true, focusVisible: false }); }
  catch { wordmark.focus({ preventScroll: true }); }
});
// The first screen starts independently of the content catalog and videos.
entered.then(()=>document.body.classList.add('intro-visible','scroll-visible'));
setupHeadlineDrop();
const content = await fetch('./content.json?v=20261112-interview').then(r => {if(!r.ok) throw Error('Content unavailable');return r.json();});
const {setupWorld}=window.__m_world_js;

const openPersonalCard = fillPhotoFan($('#world .photo-fan'));
setupWorld();
$('#intro-lead').textContent = content.introLead;
$('#intro-detail').textContent = content.introDetail;
const modules = [{id:'home',number:'01',title:'首屏 Hero'}, ...content.chapters];
modules.forEach(item => {
  const link = document.createElement('a');
  link.href = `#${item.id}`;
  const number = document.createElement('span');
  number.textContent = item.number;
  link.append(number, document.createTextNode(item.title));
  $('#module-links').append(link);
});

// Old chapter links now arrive at the matching section in this same document.
const url = new URL(location.href);
const previousPage = url.searchParams.get('page');
// Removed modules (关于我 / 工作方法) and older anchors land on the nearest remaining section.
const aliases = {profile:'world', about:'world', method:'work', chapters:'modules'};
const legacyHash = aliases[url.hash.slice(1)];
if(modules.some(item => item.id === previousPage) || legacyHash){
  const target = legacyHash || previousPage;
  url.searchParams.delete('page');
  url.hash = target;
  history.replaceState(null, '', url);
  requestAnimationFrame(() => document.getElementById(target).scrollIntoView({behavior:'instant'}));
}
setupWorkGallery();
setupToolbox();
setupIpBoards();
setupNowPlaying();
document.addEventListener('play', event => {
  if(!event.target.matches?.('audio[controls],video[controls]'))return;
  document.querySelectorAll('audio,video[controls]').forEach(media=>{if(media!==event.target)media.pause();});
}, true);
setupContact();
setupCharacter();

function setupWorkGallery(){
  const track = $('#work-track');
  const cards = [...track.querySelectorAll('.work-slot')];
  const controls = [...track.querySelectorAll('.work-select')];
  let active = null;
  const select = index => {
    if(index === active) return;
    active = index;
    cards.forEach((card, i) => {
      card.classList.toggle('is-active', i === active);
      card.style.zIndex = String(i === active ? cards.length + 1 : cards.length - i);
      if(controls[i].tagName === 'BUTTON') controls[i].setAttribute('aria-pressed', String(i === active));
    });
  };
  cards.forEach((card, i) => {
    card.addEventListener('pointerenter', event => { if(event.pointerType !== 'touch') select(i); });
    controls[i].addEventListener('focus', () => select(i));
    controls[i].addEventListener('click', () => {
      select(i);
      if(controls[i].tagName === 'A') return;
      const project = content.projects?.[i];
      if(project) openPersonalCard({...project, theme:'project', number:String(i+1).padStart(2,'0')}, controls[i]);
    });
  });
  track.addEventListener('pointerleave', () => select(-1));
  track.addEventListener('focusout', event => { if(!track.contains(event.relatedTarget)) select(-1); });
  track.addEventListener('keydown', event => {
    const next = event.key === 'ArrowLeft' ? (active < 0 ? cards.length - 1 : (active - 1 + cards.length) % cards.length) :
      event.key === 'ArrowRight' ? (active + 1) % cards.length :
      event.key === 'Home' ? 0 : event.key === 'End' ? cards.length - 1 : null;
    if(next === null) return;
    event.preventDefault(); controls[next].focus({preventScroll:true});
  });
  select(-1);
}

async function setupToolbox(){
  const root = $('#toolbox');
  if(!root) return;
  const cards = [...root.querySelectorAll('.toolbox-card')];
  const scroller = root.querySelector('.toolbox-scroll');
  let catalog = [];
  try {
    const response = await fetch('./assets/zurenze/tools.json?v=20261112-books-content');
    if(!response.ok) throw Error('Tool catalog unavailable');
    catalog = (await response.json()).filter(tool => tool.id !== 'markdown');
  } catch(error) { console.warn('Tool catalog unavailable', error); }
  const toolsFor = index => (content.toolboxStories?.[index]?.toolIds || [])
    .map(id => catalog.find(tool => tool.id === id)).filter(Boolean);
  let active = -1;
  function select(index, reveal = false){
    if(index !== active){
      active = index;
      cards.forEach((card, i) => {
        card.classList.toggle('is-active', i === active);
        if(card.tagName === 'BUTTON') card.setAttribute('aria-pressed', String(i === active));
      });

    }
    if(reveal){
      // Move only the horizontal rack, never the page or the character.
      const card = cards[active];
      const x = card.offsetLeft - scroller.clientWidth / 2 + 90;
      scroller.scrollTo({left: Math.max(0, x), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    }
  }
  cards.forEach((card, i) => {
    // Fixed hit areas and pointer-transparent covers prevent hover oscillation
    // when a raised cover travels across its neighbours. CSS retargets in flight.
    const tools = toolsFor(i);
    if(tools.length){
      card.querySelector('.toolbox-cover-footer b').textContent = `${tools.length} ↗`;
      card.setAttribute('aria-label', `打开${card.dataset.title}`);
    }
    if(card.tagName !== 'A'){
      card.setAttribute('aria-haspopup', 'dialog');
      card.setAttribute('aria-controls', 'world-story');
      card.setAttribute('aria-expanded', 'false');
    }
    card.addEventListener('pointerenter', e => { if(e.pointerType !== 'touch') select(i); });
    card.addEventListener('click', () => {
      select(i);
      if(card.tagName === 'A') return;
      const story = content.toolboxStories?.[i];
      if(story) openPersonalCard({...story, tools:toolsFor(i),
        ...(toolsFor(i).length ? {paragraphs:[],details:[]} : {}),
        theme:'toolbox', number:String(i + 1).padStart(2,'0')}, card);
    });
    card.addEventListener('focus', () => select(i, true));
    card.addEventListener('keydown', e => {
      const next = e.key === 'ArrowRight' ? Math.min(i + 1, cards.length - 1) : e.key === 'ArrowLeft' ? Math.max(i - 1, 0) : e.key === 'Home' ? 0 : e.key === 'End' ? cards.length - 1 : null;
      if(next === null) return;
      e.preventDefault();cards[next].focus({preventScroll:true});
    });
  });
  select(3);
}

function createToolCover(tool){
  const cover = document.createElement('span');cover.className='tool-cover';
  cover.dataset.tone=tool.coverTheme || 'paper';
  const image=document.createElement('img');
  image.src=new URL(tool.cover,location.href).href;
  image.alt='';image.width=200;image.height=132;
  const name=document.createElement('span');name.textContent=tool.shortName || tool.name;
  cover.append(image,name);return cover;
}

function createToolEntry(tool, compact = false){
  const entry = document.createElement('article');
  entry.className = 'tool-entry' + (compact ? ' tool-entry--compact' : '');
  entry.dataset.tool = tool.id;
  if(tool.cover)entry.append(createToolCover(tool));
  const heading = document.createElement('div'); heading.className = 'tool-entry-heading';
  const title = document.createElement(compact ? 'h4' : 'h3'); title.textContent = tool.name;
  const type = document.createElement('span'); type.textContent = tool.type;
  heading.append(title, type); entry.append(heading);
  if(!compact){
    const tagline = document.createElement('p'); tagline.textContent = tool.tagline;
    entry.append(tagline);
  }
  const actions = document.createElement('div'); actions.className = 'tool-entry-actions';
  for(const [url,label,download] of [[tool.web,tool.webLabel || (tool.localOnly?'本机打开':'查看项目'),false],[tool.download,'下载 Mac',true]]){
    if(!url)continue;
    const link = document.createElement('a');
    link.href = new URL(url, new URL('../secret-weapons/',location.href)).href;
    link.textContent = label + (download ? ' ↓' : ' ↗');
    link.setAttribute('aria-label', `${label} · ${tool.name}`);
    if(download)link.download='';else{link.target='_blank';link.rel='noopener noreferrer';}
    actions.append(link);
  }
  entry.append(actions);
  if(!compact){
    const more = document.createElement('details'), summary = document.createElement('summary');
    summary.textContent = '能力与功能';more.open=true;more.append(summary);
    const description = document.createElement('p');description.textContent=tool.description;more.append(description);
    for(const [label,items,tag] of [['可以做什么',tool.features,'ul'],['开始使用',tool.steps,'ol']]){
      if(!items?.length)continue;
      const subtitle=document.createElement('h4');subtitle.textContent=label;
      const list=document.createElement(tag);
      for(const text of items || []){const item=document.createElement('li');item.textContent=text;list.append(item);}
      more.append(subtitle,list);
    }
    for(const text of [tool.platform,tool.note]){if(text){const p=document.createElement('p');p.textContent=text;more.append(p);}}
    entry.append(more);
  }
  return entry;
}

function setupContact(){
  const status = $('#contact-status');
  for(const key of ['phone', 'email']){
    const value = content.contact?.[key]?.trim();
    const block = $('.contact-' + key);
    block.hidden = !value;
    if(!value) continue;
    $('#contact-' + key).textContent = value;
    const action = $(key === 'phone' ? '#call-phone' : '#send-email');
    action.hidden = false;
    action.href = (key === 'phone' ? 'tel:' : 'mailto:') + value;
    const copy = $('#copy-' + key);
    copy.disabled = false;
    copy.addEventListener('click', async () => {
      const label = key === 'phone' ? '电话 / 微信号' : '邮箱';
      try{
        await navigator.clipboard.writeText(value);
        status.textContent = label + '已复制';
      }catch{
        status.textContent = '暂时无法自动复制，请选中上方' + label + '手动复制。';
      }
    });
  }
}

function createClientShowcase(projects){
  const root=document.createElement('div');root.className='client-showcase';
  for(const project of projects){
    const article=document.createElement('article');article.className='client-showcase-project';
    const label=document.createElement('p');label.className='client-showcase-label';label.textContent=project.label;
    const title=document.createElement('h3');title.textContent=project.title;
    const purpose=document.createElement('p');purpose.className='client-showcase-purpose';purpose.textContent=project.purpose;
    const gallery=createMaterialsPreview(project.gallery);
    gallery.querySelectorAll('figcaption b').forEach(node=>{node.textContent=node.textContent.replace(/ ↗$/,'');});
    article.append(label,title,purpose);if(project.gallery.length)article.append(gallery);
    const features=document.createElement('ul');features.className='client-showcase-features';
    for(const text of project.features){const item=document.createElement('li');item.textContent=text;features.append(item);}
    article.append(features);
    if(project.film){
      const figure=document.createElement('figure');figure.className='client-showcase-film';
      const frame=document.createElement('iframe');frame.src=project.film;frame.title=project.title+'产品演示';frame.loading='lazy';frame.allow='fullscreen';frame.allowFullscreen=true;frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-presentation');
      const caption=document.createElement('figcaption');caption.textContent='产品演示 · 约2分7秒 · 点击片内播放可开启声音';figure.append(frame,caption);article.append(figure);
    }
    if(project.achievement){const award=document.createElement('p');award.className='client-showcase-achievement';award.textContent=project.achievement;article.append(award);}
    const role=document.createElement('p');role.className='client-showcase-role';role.textContent='我的工作：'+project.role;article.append(role);root.append(article);
  }
  return root;
}

function createMaterialsPreview(items,layout){
  const section=document.createElement('section');section.className='world-materials-gallery';if(layout)section.dataset.layout=layout;section.setAttribute('aria-label','工具与素材界面');
  for(const item of items){const figure=document.createElement('figure'),button=document.createElement('button'),image=document.createElement('img'),caption=document.createElement('figcaption'),title=document.createElement('b'),copy=document.createElement('span');
    button.type='button';button.setAttribute('aria-label','放大查看'+item.title);image.src=item.src;image.alt=item.alt;image.width=item.width;image.height=item.height;image.loading='lazy';button.append(image);button.addEventListener('click',()=>openMaterialsImage(item,button));title.textContent=item.title+' ↗';copy.textContent=item.caption;if(item.url){const link=document.createElement('a');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label','查看'+item.title+'项目');link.append(title);caption.append(link,copy);}else{caption.append(title,copy);}figure.append(button,caption);section.append(figure);
  }return section;
}
let materialsImageDialog,materialsImageTrigger;
function openMaterialsImage(item,trigger){
  if(!materialsImageDialog){materialsImageDialog=document.createElement('dialog');materialsImageDialog.className='materials-image-dialog';materialsImageDialog.setAttribute('aria-label','素材截图大图');materialsImageDialog.innerHTML='<header><p></p><a class="materials-image-original" target="_blank" rel="noopener noreferrer">查看原图 ↗</a><button type="button" aria-label="关闭素材大图">关闭 ×</button></header><img alt="">';document.body.append(materialsImageDialog);materialsImageDialog.querySelector('button').addEventListener('click',()=>materialsImageDialog.close());materialsImageDialog.addEventListener('click',e=>{if(e.target===materialsImageDialog)materialsImageDialog.close();});materialsImageDialog.addEventListener('close',()=>{materialsImageDialog.querySelector('img').removeAttribute('src');materialsImageTrigger?.focus({preventScroll:true});});}
  materialsImageTrigger=trigger;const image=materialsImageDialog.querySelector('img');image.src=item.src;image.alt=item.alt;materialsImageDialog.querySelector('p').textContent=item.title;materialsImageDialog.querySelector('a').href=item.src;materialsImageDialog.showModal();materialsImageDialog.querySelector('button').focus();
}
function createAudiovisualShowcase(data){
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    element.className = className;
    if(text) element.textContent = text;
    return element;
  };
  const link = (text, href) => {
    const a = node('a', 'av-file', text); a.href = href; a.download = ''; return a;
  };
  const player = (src, label) => {
    const audio = document.createElement('audio');
    audio.controls = true; audio.preload = 'metadata'; audio.src = src; audio.tabIndex = 0;
    audio.setAttribute('aria-label', label); return audio;
  };
  const root = node('div', 'av-showcase');
  const voice = node('section', 'av-voice');
  const voiceName = data.voice.name || '祖仁泽';
  voice.setAttribute('aria-label', `${voiceName}原声与${data.voice.models.length}模型试听对照`);
  voice.append(node('p', 'av-eyebrow', '01 / 声音克隆'), node('h3', '', data.voice.title || '用我的声音，读新的文案。'));
  const inputs = node('div', 'av-inputs');
  const reference = node('article', 'av-input av-reference');
  reference.append(node('h4', '', data.voice.referenceLabel || '本人参考原声'), node('span', 'av-meta', `${data.voice.referenceMeta || '电脑录音'} · ${data.voice.referenceDuration.toFixed(2)}秒`),
    player(data.voice.reference, `试听${voiceName}参考原声`), node('blockquote', '', data.voice.referenceText));
  if(data.voice.fullReference) reference.append(link('完整原声录音 ↓', data.voice.fullReference));
  if(data.voice.referenceSourceUrl){const source=node('a','av-file','打开原视频 ↗');source.href=data.voice.referenceSourceUrl;source.target='_blank';source.rel='noopener noreferrer';reference.append(source);}
  if(data.voice.cloningReference) reference.append(link('去伴奏克隆参考 ↓',data.voice.cloningReference));
  const script = node('article', 'av-input av-script');
  script.append(node('h4', '', `给${data.voice.models.length}个模型的同一份文案`), node('span', 'av-meta', data.voice.scriptLabel || '统一试音稿'), node('blockquote', '', data.voice.text));
  inputs.append(reference, script); voice.append(inputs);
  const flow = node('ol', 'av-flow');
  (data.voice.flow || ['采集参考原声', '输入新文案', '模型生成', '对照试听']).forEach((text, i) => {
    const step = node('li', ''); step.append(node('b', '', String(i + 1).padStart(2, '0')), document.createTextNode(text)); flow.append(step);
  });
  voice.append(flow, node('p', 'av-listening-note', data.voice.note || '以下为同响度试听；每段保留原始合成。'));
  const models = node('div', 'av-models');
  data.voice.models.forEach((model, i) => {
    const card = node('article', 'av-model');
    card.append(node('span', 'av-eyebrow', `${model.backend || 'LOCAL'} / ${String(i + 1).padStart(2, '0')}`), node('h4', '', model.name));
    const wave = node('img', 'av-wave'); wave.src = model.wave; wave.alt = `${model.name}试听音频的实际波形`; wave.width = 900; wave.height = 120; wave.loading = 'lazy';
    card.append(wave, player(model.src, `试听${voiceName}的${model.name}克隆音`));
    const facts = node('dl', 'av-facts');
    const rows=[['音频时长', `${model.duration.toFixed(2)}秒`], ['采样率', `${model.sampleRate / 1000}kHz`]];
    if(model.elapsed != null) rows.push(['当次用时', `${model.elapsed.toFixed(2)}秒`]);
    if(model.seed != null) rows.push(['随机种子', String(model.seed)]);
    rows.forEach(([label, text]) => {const fact = node('div', ''); fact.append(node('dt', '', label), node('dd', '', text)); facts.append(fact);});
    card.append(facts, link(`下载原始${model.rawFormat || 'WAV'} ↓`, model.raw)); models.append(card);
  });
  voice.append(models); root.append(voice);
  const avatar = node('section', 'av-avatar');
  avatar.append(node('p', 'av-eyebrow', '02 / 数字人'), node('h3', '', '从脚本、配音，到数字人口播。'), node('p', '', '数字人项目因肖像授权范围，暂不公开演示。'));
  root.append(avatar);
  const film = node('section', 'av-film');
  film.append(node('p', 'av-eyebrow', '03 / AIGC影像'));
  if(data.shots?.length){
    film.append(node('h3', '', 'AIGC镜头作品'));
    const shots = node('div', 'av-shot-grid');
    data.shots.forEach((clip, i) => {
      const figure = node('figure', 'av-shot');
      const player = document.createElement('video');
      player.controls = true; player.playsInline = true; player.preload = 'metadata';
      player.poster = clip.poster; player.src = clip.src; player.tabIndex = 0;
      player.width = 1280; player.height = 720;
      player.setAttribute('aria-label', `播放AIGC镜头：${clip.title}`);
      const caption = node('figcaption', '');
      caption.append(node('span', 'av-clip-meta', `${String(i + 1).padStart(2, '0')} / AIGC · ${clip.duration.toFixed(2)}秒`), node('h4', '', clip.title));
      figure.append(player, caption); shots.append(figure);
    });
    film.append(shots);
  }
  film.append(node('h3', 'av-mv-title', '原创小说《灵珠》· 剧情MV'));
  const video = document.createElement('video');
  video.controls = true; video.playsInline = true; video.preload = 'none'; video.poster = data.film.poster; video.src = data.film.src; video.tabIndex = 0;
  video.setAttribute('aria-label', '播放灵珠78秒剧情MV');
  film.append(video, node('p', 'av-film-credit', '78秒完整成片 · 16张分镜图 / 13条镜头 / 23段剪辑 · 原作小说：祖仁泽'));
  root.append(film);
  root.addEventListener('play', event => {
    root.querySelectorAll('audio,video').forEach(media => { if(media !== event.target) media.pause(); });
  }, true);
  return root;
}

function caseNode(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;}
function createCaseOverview(data){
  const root=caseNode('section','case-overview');root.setAttribute('aria-label','作品数据与个人分工');
  root.append(caseNode('p','case-dateline',`${data.account} / 发布于 ${data.publishedOn}`));
  const metrics=caseNode('dl','case-metrics');
  for(const item of data.metrics){const n=caseNode('div','case-metric');
    const value=item.value==null?'—':(item.approximate?'约':'')+(item.value>=10000?(item.value/10000).toFixed(1).replace(/\.0$/,'')+'万':item.value.toLocaleString('zh-CN'));
    n.append(caseNode('dt','',item.label),caseNode('dd','',value));
    if(item.value!=null)n.title=`${item.approximate?'约':''}${item.value.toLocaleString('zh-CN')} · 记录于${item.observedOn}`;
    metrics.append(n);
  }
  root.append(metrics,caseNode('p','case-metric-note',data.metricsNote));
  const role=caseNode('section','case-role');role.append(caseNode('h3','','我的分工'));
  const tags=caseNode('div','case-role-tags');for(const text of data.role)tags.append(caseNode('span','',text));
  role.append(tags,caseNode('p','',data.roleNote));root.append(role);return root;
}
function createTranscriptDocument(data){
  const root=caseNode('section','case-transcript-document');
  root.setAttribute('aria-label',data.title+'逐字稿Word文档');
  const bar=caseNode('div','transcript-document-toolbar');
  const download=caseNode('a','', '下载 Word ↗');
  download.href=data.file;download.download=data.downloadName;
  download.setAttribute('aria-label','下载'+data.title+'逐字稿Word文档');
  bar.append(caseNode('span','',`Word 文档 · ${data.pages.length} 页`),download);root.append(bar);
  const pages=caseNode('div','transcript-document-pages');
  data.pages.forEach((page,i)=>{
    const figure=caseNode('figure','transcript-document-page');
    const button=caseNode('button','transcript-page-open');button.type='button';
    button.setAttribute('aria-label',`放大${data.title}逐字稿第${i+1}页`);
    const image=caseNode('img','');image.src=page.src;image.width=page.width;image.height=page.height;
    image.loading='lazy';image.alt=`${data.title}逐字稿 第${i+1}页`;
    button.append(image);button.addEventListener('click',()=>openTranscriptPage(data,page,i,button));
    figure.append(button,caseNode('figcaption','',`第 ${i+1} / ${data.pages.length} 页 · 点击放大`));pages.append(figure);
  });root.append(pages);return root;
}
let transcriptPageViewer,transcriptPageOpener;
function openTranscriptPage(data,page,index,trigger){
  if(!transcriptPageViewer){
    const dialog=caseNode('dialog','transcript-page-viewer');
    dialog.setAttribute('aria-label','逐字稿文档页面');
    dialog.innerHTML='<header><p></p><div><button type="button" class="transcript-page-zoom">放大阅读</button><button type="button" class="transcript-page-close">关闭 ×</button></div></header><div class="transcript-page-canvas"><img alt=""></div>';
    document.body.append(dialog);transcriptPageViewer=dialog;
    dialog.querySelector('.transcript-page-close').addEventListener('click',()=>dialog.close());
    dialog.querySelector('.transcript-page-zoom').addEventListener('click',()=>{
      const zoomed=dialog.classList.toggle('is-zoomed');
      dialog.querySelector('.transcript-page-zoom').textContent=zoomed?'适应宽度':'放大阅读';
      dialog.querySelector('.transcript-page-canvas').scrollTo(0,0);
    });
    dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
    dialog.addEventListener('close',()=>{dialog.querySelector('img').removeAttribute('src');transcriptPageOpener?.focus({preventScroll:true});});
  }
  const dialog=transcriptPageViewer;transcriptPageOpener=trigger;
  dialog.classList.remove('is-zoomed');dialog.querySelector('.transcript-page-zoom').textContent='放大阅读';
  dialog.querySelector('header p').textContent=`${data.title}逐字稿 · 第 ${index+1} / ${data.pages.length} 页`;
  const image=dialog.querySelector('img');image.src=page.src;image.alt=`${data.title}逐字稿 第${index+1}页`;
  image.width=page.width;image.height=page.height;dialog.showModal();
  dialog.querySelector('.transcript-page-canvas').scrollTo(0,0);
  dialog.querySelector('.transcript-page-close').focus();
}

function createCaseStudy(data){
  const root=caseNode('section','case-study');root.setAttribute('aria-label','作品创作内容');
  const nav=caseNode('div','case-study-tabs');nav.setAttribute('role','tablist');nav.setAttribute('aria-label','案例内容');
  const panels=caseNode('div','case-study-panels');
  const labels=['结构与节奏','写作思路','逐字稿'];const buttons=[],bodies=[];
  labels.forEach((label,i)=>{
    const b=caseNode('button','',label);b.type='button';b.id='case-study-tab-'+i;b.setAttribute('role','tab');b.setAttribute('aria-controls','case-study-panel-'+i);
    const panel=caseNode('section','case-study-panel');panel.id='case-study-panel-'+i;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',b.id);
    buttons.push(b);bodies.push(panel);nav.append(b);panels.append(panel);
  });
  const select=i=>{buttons.forEach((b,j)=>{b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1;bodies[j].hidden=i!==j;});};
  buttons.forEach((b,i)=>{b.addEventListener('click',()=>select(i));b.addEventListener('keydown',e=>{const n=e.key==='ArrowRight'?(i+1)%3:e.key==='ArrowLeft'?(i+2)%3:e.key==='Home'?0:e.key==='End'?2:null;if(n==null)return;e.preventDefault();select(n);buttons[n].focus();});});
  bodies[0].append(caseNode('h3','case-hook',data.hook));
  const stages=caseNode('ol','case-structure');
  data.structure.forEach((stage,i)=>{const li=caseNode('li','');li.append(caseNode('span','case-stage-no',String(i+1).padStart(2,'0')),caseNode('h4','',stage.title),caseNode('p','',stage.action));const why=caseNode('p','case-stage-purpose');why.append(caseNode('b','','这一步的作用'),document.createTextNode(stage.purpose));li.append(why);stages.append(li);});
  bodies[0].append(stages);
  const thoughts=caseNode('div','case-thinking');data.thinking.forEach(item=>{const article=caseNode('article','');article.append(caseNode('h3','',item.title),caseNode('p','',item.text));thoughts.append(article);});bodies[1].append(thoughts);
  if(data.transcriptDocument){bodies[2].append(createTranscriptDocument(data.transcriptDocument));}
  else{
    bodies[2].append(caseNode('p','case-transcript-note',data.transcriptNote));
    const script=caseNode('div','case-transcript');data.transcript.forEach((text,i)=>{const p=caseNode('p','',text);p.id='case-paragraph-'+i;script.append(p);});bodies[2].append(script);
  }
  root.append(nav,panels);select(0);return root;
}

function fillPhotoFan(gallery){
  const photos = content.worldPhotos || [];
  const middle = (photos.length - 1) / 2;
  const dialog = document.createElement('dialog');
  dialog.className = 'world-dialog';
  dialog.id = 'world-story';
  dialog.setAttribute('aria-labelledby', 'world-story-title');
  dialog.innerHTML = `<button class="world-dialog-close" type="button" aria-label="关闭介绍">×</button>
    <div class="world-story-layout"><div class="world-story-photo"><img alt=""><div class="world-work-player" hidden></div><span class="world-media-word" aria-hidden="true"></span><div class="world-story-archive" hidden><b></b><strong></strong></div><div class="world-story-tool-covers" hidden></div></div>
    <div class="world-story-content"><h2 id="world-story-title"></h2>
    <p class="world-story-lead"></p><div class="world-case-overview" hidden></div><div class="world-song-grid" hidden></div><div class="world-story-paragraphs"></div><div class="world-materials-slot"></div><div class="world-av-slot"></div><section class="world-story-honors" hidden aria-label="军旅荣誉"><h3>军旅荣誉</h3><div class="honor-grid"></div><p></p></section><dl class="world-story-details"></dl><div class="world-tool-list" hidden></div><div class="world-project-links" hidden></div></div></div><div class="world-case-study" hidden></div>`;
  document.body.append(dialog);
  const close = dialog.querySelector('.world-dialog-close');
  let opener = null, previousOverflow = '';
  close.addEventListener('click', () => dialog.close());
  let backdropDown = false;
  dialog.addEventListener('pointerdown', event => { backdropDown = event.target === dialog; });
  dialog.addEventListener('click', event => { if(backdropDown && event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    dialog.querySelectorAll('audio,video').forEach(media => media.pause());
    dialog.querySelector('.world-materials-slot').replaceChildren();
    dialog.querySelector('.world-work-player').replaceChildren();
    document.documentElement.style.overflow = previousOverflow;
    opener?.setAttribute('aria-expanded', 'false');
    opener?.focus({preventScroll:true});
  });
  function openStory(photo, trigger){
    if(dialog.open) return;
    opener = trigger;
    const caseData=photo.caseStudy;
    dialog.classList.toggle('world-dialog--case',!!caseData);
    const overview=dialog.querySelector('.world-case-overview'),study=dialog.querySelector('.world-case-study');
    overview.hidden=!caseData;study.hidden=!caseData;
    overview.replaceChildren(...(caseData?[createCaseOverview(caseData)]:[]));
    study.replaceChildren(...(caseData?[createCaseStudy(caseData)]:[]));
    const hasGallery=!!photo.gallery?.length;dialog.classList.toggle('world-dialog--gallery',hasGallery);dialog.querySelector('.world-story-photo').hidden=hasGallery||!!photo.showcase;const slot=dialog.querySelector('.world-materials-slot');slot.replaceChildren(...(photo.clientShowcase?[createClientShowcase(photo.clientShowcase)]:hasGallery?[createMaterialsPreview(photo.gallery,photo.galleryLayout)]:[]));
    dialog.classList.toggle('world-dialog--av', !!photo.showcase);
    dialog.querySelector('.world-av-slot').replaceChildren(...(photo.showcase ? [createAudiovisualShowcase(photo.showcase)] : []));
    const image = dialog.querySelector('img');
    image.hidden = !photo.src;
    const playerSlot = dialog.querySelector('.world-work-player');
    playerSlot.replaceChildren(); playerSlot.hidden = !photo.video;
    dialog.classList.toggle('world-dialog--work', !!photo.video);
    if(photo.video){
      image.hidden = true;
      const video = document.createElement('video');
      video.controls = true; video.playsInline = true; video.preload = 'metadata';
      video.poster = photo.src; video.src = photo.video; video.tabIndex = 0;
      video.setAttribute('aria-label', '播放' + (photo.displayTitle || photo.title));
      playerSlot.append(video);
    }
    const archive = dialog.querySelector('.world-story-archive');
    archive.hidden = Boolean(photo.src) || !!photo.tools?.length;
    const covers = dialog.querySelector('.world-story-tool-covers');
    covers.hidden = !photo.tools?.length;
    covers.replaceChildren(...(photo.tools || []).filter(tool=>tool.cover).map(tool=>createToolCover(tool)));
    if(photo.src){image.src = photo.src; image.alt = photo.alt; image.width = photo.width; image.height = photo.height;}
    else {image.removeAttribute('src'); archive.querySelector('b').textContent = photo.number; archive.querySelector('strong').textContent = photo.title;}
    const honors = dialog.querySelector('.world-story-honors');
    honors.hidden = !photo.honors?.length;
    honors.querySelector('.honor-grid').replaceChildren(...(photo.honors || []).map(honor => {
      const item = document.createElement('div'), count = document.createElement('b'), label = document.createElement('span');
      count.textContent = `${Number(honor.count)} 次`; label.textContent = honor.label; item.append(count, label); return item;
    }));
    honors.querySelector('p').textContent = photo.honorNote || '';
    dialog.dataset.theme = photo.theme || 'about';
    dialog.querySelector('h2').textContent = photo.displayTitle || photo.title || photo.alt;
    dialog.querySelector('.world-media-word').textContent = photo.mediaWord || '';
    const tools = dialog.querySelector('.world-tool-list');
    tools.hidden = !photo.tools?.length;
    tools.replaceChildren(...(photo.tools || []).map(tool => createToolEntry(tool)));
    const songs = dialog.querySelector('.world-song-grid');
    songs.hidden = !photo.songs?.length;
    songs.replaceChildren(...(photo.songs || []).map(song => {
      const card = document.createElement('article'); card.className = 'song-card';
      const link = document.createElement('a'); link.className = 'song-art'; link.href = song.url; link.target = '_blank'; link.rel = 'noopener';
      link.setAttribute('aria-label', `在 Apple Music 打开${song.title}`);
      const disc = document.createElement('span'); disc.className = 'song-vinyl'; disc.setAttribute('aria-hidden','true');
      const cover = document.createElement('img'); cover.src = song.cover; cover.alt = `Beyond《${song.album}》封面`; cover.width = 300; cover.height = 300;
      link.append(disc, cover);
      const copy = document.createElement('div'); copy.className = 'song-copy';
      const title = document.createElement('h3'), reason = document.createElement('p');
      title.textContent = song.title; reason.textContent = song.reason;
      copy.append(title, reason); card.append(link, copy); return card;
    }));
    const links=dialog.querySelector('.world-project-links');
    links.hidden=!photo.links?.length;
    links.replaceChildren(...(photo.links||[]).map(item=>{const link=document.createElement('a');link.href=item.url;link.textContent=item.label+' ↗';link.target='_blank';link.rel='noopener noreferrer';return link;}));
    dialog.querySelector('.world-story-lead').textContent = photo.description || '';
    dialog.querySelector('.world-story-paragraphs').replaceChildren(...(photo.paragraphs || []).map(text => {
      const p = document.createElement('p'); p.textContent = text; return p;
    }));
    dialog.querySelector('.world-story-details').replaceChildren(...(photo.details || []).map(([label, text]) => {
      const row = document.createElement('div'), term = document.createElement('dt'), detail = document.createElement('dd');
      term.textContent = label; detail.textContent = text; row.append(term, detail); return row;
    }));
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    trigger.setAttribute('aria-expanded', 'true');
    dialog.showModal(); dialog.scrollTop = 0;
    close.focus({preventScroll:true});
  }
  photos.forEach((photo, index) => {
    const card = document.createElement('li'); card.className = 'fan-card';
    const cover = photo.cover || photo;
    const image = document.createElement('img');
    image.src = cover.src; image.alt = cover.alt;
    image.width = cover.width; image.height = cover.height;
    image.decoding = 'async'; image.loading = 'lazy';
    image.style.objectPosition = cover.position || 'center';
    const trigger = document.createElement('button');
    trigger.type = 'button'; trigger.className = 'photo-trigger';
    trigger.dataset.look = index < middle ? 'left' : index > middle ? 'right' : 'front';
    trigger.setAttribute('aria-label', photo.video ? `查看${photo.title}作品详情` : `打开${photo.title || photo.alt}介绍`);
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', dialog.id);
    trigger.setAttribute('aria-expanded', 'false');
    const caption = document.createElement('span');
    caption.className = 'fan-caption'; caption.textContent = photo.title || photo.alt;
    trigger.append(image, caption);
    trigger.addEventListener('click', () => openStory(photo, trigger));
    card.append(trigger); gallery.append(card);
  });
  return openStory;
}

async function setupCharacter(){
  const video=$('#character'),figure=$('.figure'),replay=$('#replay');
  const revealAll=()=>document.body.classList.add('intro-visible','scroll-visible');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let manifest,callback=null,broken=false,run=0,decodedAtStart=0,droppedAtStart=0,presented=new Set();
  video.muted=true;video.defaultMuted=true;video.loop=false;video.playbackRate=1;
  const quality=()=>video.getVideoPlaybackQuality?.()||{};
  const debug=new URLSearchParams(location.search).has('qa')?document.body.appendChild(document.createElement('pre')):null;
  if(debug){debug.id='playback-diagnostics';debug.style.cssText='position:fixed;right:10px;bottom:10px;z-index:99;background:#111;color:#fff;padding:12px;max-width:380px;font:11px monospace;white-space:pre-wrap';}
  const report=()=>{
    const q=quality();
    figure.dataset.playback=JSON.stringify({run,codec:figure.dataset.codec,time:video.currentTime,duration:video.duration,decodedTotal:q.totalVideoFrames,decodedSincePlay:(q.totalVideoFrames||0)-decodedAtStart,droppedTotal:q.droppedVideoFrames,dropped:(q.droppedVideoFrames||0)-droppedAtStart,frameCallbacks:presented.size,firstFrame:Math.min(...presented),lastFrame:Math.max(...presented),rate:video.playbackRate,loop:video.loop,ended:video.ended});
    if(debug)debug.textContent=figure.dataset.playback;
  };
  const cues=(time)=>{
    if(time>=42/24)document.body.classList.add('intro-visible');
    if(time>=84/24)document.body.classList.add('scroll-visible');
  };
  const observe=(_,frame)=>{
    presented.add(Math.round(frame.mediaTime*(manifest?.fps||48)));cues(frame.mediaTime);
    callback=video.requestVideoFrameCallback(observe);
  };
  const fallback=()=>{
    if(broken)return;broken=true;
    video.pause();if(callback!==null)video.cancelVideoFrameCallback?.(callback);
    const image=document.createElement('img');image.id='character';image.alt='阿泽的男性潮玩形象';image.width=720;image.height=1280;image.src=video.poster;
    // Replace the whole media element; never stack a poster below transparent video.
    video.replaceWith(image);figure.dataset.state='fallback';replay&&(replay.hidden=true);revealAll();
  };
  const play=async()=>{
    if(broken)return;
    video.pause();if(video.currentTime>0)video.currentTime=0;video.playbackRate=1;
    if(callback!==null)video.cancelVideoFrameCallback?.(callback);
    const q=quality();decodedAtStart=q.totalVideoFrames||0;droppedAtStart=q.droppedVideoFrames||0;presented=new Set();run++;
    if(video.requestVideoFrameCallback)callback=video.requestVideoFrameCallback(observe);
    try{await video.play();figure.dataset.state='playing';}
    catch(error){if(error.name==='NotAllowedError'){figure.dataset.state='static';revealAll();
      // autoplay was blocked: start on the visitor's first click or key anywhere on the page
      const go=()=>{removeEventListener('pointerdown',go);removeEventListener('keydown',go);play();};addEventListener('pointerdown',go);addEventListener('keydown',go);}else fallback();}
  };
  if(replay)replay.disabled=true;
  video.addEventListener('timeupdate',()=>{cues(video.currentTime);report();});
  video.addEventListener('ended',()=>{figure.dataset.state='complete';revealAll();report();if(callback!==null){video.cancelVideoFrameCallback?.(callback);callback=null;}scheduleEncore();});
  // He keeps saying hello: after a few seconds back on his phone he plays the greeting again.
  // First and last frames are identical, so restarting from 0 shows no jump. Only while the
  // hero is on screen and the tab is visible; scrolling back to the top resumes it.
  let encore=null,heroVisible=false,characterReady=false,entranceAllowed=false;
  let initialAway = !!location.hash && location.hash !== '#home';
  const scheduleEncore=()=>{clearTimeout(encore);if(reduced||broken)return;
    encore=setTimeout(()=>{if(heroVisible&&!document.hidden&&video.ended)play();else encore=null;},6000);};
  new IntersectionObserver(e=>{heroVisible=e[e.length-1].isIntersecting && e[e.length-1].intersectionRatio >= .35;
    if(!heroVisible)initialAway=false;
    if(heroVisible&&!initialAway&&characterReady&&entranceAllowed&&run===0)play();
    else if(heroVisible&&video.ended&&encore===null)scheduleEncore();},{threshold:.35}).observe(document.getElementById('home'));
  document.addEventListener('azu:replay-hero',()=>{initialAway=false;if(characterReady&&!reduced)play();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&video.ended&&encore===null)scheduleEncore();});
  // The intro never waits on the video: on a slow connection the poster stands in meanwhile.
  figure.dataset.state='loading';
  setTimeout(()=>{if(figure.dataset.state==='loading')revealAll();},6000);
  try{
    manifest=await fetch('./release.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Missing release');return r.json();});
    figure.dataset.release=manifest.release;video.poster=manifest.assets['poster.png'].path;
    // The alpha check runs on this element's own first frame, so the file is downloaded once and
    // a slow connection only delays the motion. Only a decode error or missing alpha moves on.
    let key=null;
    for(const k of alphaOrder().map(k=>k==='vp9'?'vp9.webm':'hevc.mov')){
      if(await firstFrame(video,manifest.assets[k].path)&&characterHasAlpha(video)){key=k;break;}
    }
    if(!key){fallback();return;}figure.dataset.codec=key;
    video.addEventListener('error',fallback);
    // Start once enough is buffered to play straight through, so a slow connection does not
    // stutter the one-shot animation. Some mobile browsers stop buffering before that point
    // until play() is called; when the download is suspended like that, start anyway.
    let started=false;
    const start=()=>{if(started)return;started=true;if(replay)replay.disabled=false;if(reduced){figure.dataset.state='static';revealAll();}else {characterReady=true;entered.then(()=>{entranceAllowed=true;if(heroVisible&&!initialAway)play();});}};
    if(video.readyState>=4)start();else{video.addEventListener('canplaythrough',start,{once:true});video.addEventListener('suspend',start,{once:true});}
    replay?.addEventListener('click',play);
  }catch(error){console.warn('Character static fallback',error);fallback();}
  window.addEventListener('pagehide',()=>{video.pause();if(callback!==null)video.cancelVideoFrameCallback?.(callback);},{once:true});
  // Native video keeps the final decoded frame. No rewind or final-image swap.
}

// Codec order without downloading anything: Safari and every iOS browser show alpha only from
// HEVC, Chromium and Firefox from VP9. It is a guess; the decoded frame has the final word.
function alphaOrder(){
  const t=document.createElement('video'),ua=navigator.userAgent;
  const webkit=/AppleWebKit/.test(ua)&&!/Chrome|Chromium|Edg|OPR|Android/.test(ua);
  const vp9=t.canPlayType('video/webm; codecs="vp9"')!=='',hevc=t.canPlayType('video/mp4; codecs="hvc1"')!=='';
  return (webkit?['hevc','vp9']:['vp9','hevc']).filter(k=>k==='vp9'?vp9:hevc||webkit);
}
// Loads url into the element and waits for its first frame, however long that takes.
// false only on a real error (unsupported or broken file).
function firstFrame(v,url){
  return new Promise(resolve=>{
    const done=ok=>{v.removeEventListener('loadeddata',yes);v.removeEventListener('error',no);resolve(ok);};
    const yes=()=>done(true),no=()=>done(false);
    v.addEventListener('loadeddata',yes);v.addEventListener('error',no);v.src=url;v.load();
  });
}
// Two pixels of the decoded first frame: a transparent corner and a fully opaque jacket pixel,
// so a decoder that drops alpha (or draws nothing) cannot pass.
function characterHasAlpha(v){
  try{
    const canvas=document.createElement('canvas');canvas.width=2;canvas.height=1;
    const context=canvas.getContext('2d',{willReadFrequently:true});
    context.drawImage(v,0,0,1,1,0,0,1,1);context.drawImage(v,350,400,1,1,1,0,1,1);
    const pixels=context.getImageData(0,0,2,1).data;
    return pixels[3]===0&&pixels[7]===255;
  }catch{return location.protocol==='file:';}
}

// 03–05 boards: each has one looping transparent IP clip. The codec is chosen once by a real
// alpha check (VP9 alpha for Chrome/Firefox, HEVC alpha for Safari); without either, the still
// poster is shown. Clips play only while their board is on screen.
async function setupIpBoards(){
  const stages=[...document.querySelectorAll('.ip-stage[data-ip]')];
  if(!stages.length)return;
  let manifest;
  try{manifest=await fetch('./assets/ip/manifest.json').then(r=>{if(!r.ok)throw Error('IP manifest');return r.json();});}catch{return;}
  for(const stage of stages){const clip=manifest[stage.dataset.ip];if(!clip)continue;const v=stage.querySelector('video');v.poster=clip.assets.png.path;v.width=clip.size[0];v.height=clip.size[1];}
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The mouse-following frames need no video codec, so they start before the codec check.
  const arsenal=stages.find(s=>s.dataset.ip==='arsenal');
  if(arsenal&&manifest.arsenal?.gaze&&!reducedMotion)setupGaze(arsenal,manifest.arsenal);
  // No separate probe download: the first board clip that decodes is itself the alpha check.
  // Until then (and on a slow connection) each board shows its poster.
  const order=alphaOrder().map(k=>k==='vp9'?'webm':'mov');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The arsenal clip is replaced by the mouse-following frames, so its loop video is not loaded.
  const gazes=s=>s.dataset.ip==='arsenal'&&manifest.arsenal?.gaze;
  const boards=stages.filter(s=>!gazes(s)&&s.querySelector('video'));
  let verified=false;
  const load=s=>{const v=s.querySelector('video');v.dataset.kind=order[0];v.src=manifest[s.dataset.ip].assets[order[0]].path;};
  // This format shows no alpha here (or will not decode): move every loaded board to the next one.
  const reject=v=>{
    if(verified||v.dataset.kind!==order[0])return;
    order.shift();
    for(const s of boards){const w=s.querySelector('video');if(!w.dataset.kind)continue;
      if(order[0]){load(s);if(s.dataset.seen){if(s.dataset.ip==='music')greet(w,manifest.music);w.play().catch(()=>{});}}
      else{w.pause();delete w.dataset.kind;w.removeAttribute('src');w.load();}}
    if(!order[0])observer.disconnect();
  };
  const observer=new IntersectionObserver(entries=>{
    for(const e of entries){
      const v=e.target.querySelector('video');if(!v||!order[0])continue;
      if(e.isIntersecting){
        const first=!e.target.dataset.seen;e.target.dataset.seen='1';
        if(!v.dataset.kind)load(e.target);
        if(e.target.dataset.ip==='music'&&first)greet(v,manifest.music);
        v.play().catch(()=>{});
      }
      else{v.pause();delete e.target.dataset.seen;}
    }
  },{rootMargin:'200px 0px'});
  for(const s of boards){const v=s.querySelector('video');
    v.addEventListener('loadeddata',()=>{if(verified||v.dataset.kind!==order[0])return;if(frameHasAlpha(v))verified=true;else reject(v);});
    v.addEventListener('error',()=>reject(v));}
  if(order.length&&!reduced)boards.forEach(s=>observer.observe(s));
  const talk=boards.find(s=>s.dataset.ip==='talk');
  if(talk&&manifest.talk?.greetEnd&&order.length&&!reduced)setupTalk(talk,manifest.talk);
}

// 05: he sits and smiles; when you come near (and each time the board comes into view) he leans
// in and reaches out to say hi, then settles back. The clip is cut for this (build_talk.py):
// greeting first [0, greetEnd), then sitting [greetEnd, greetFrom), then three frames that lead
// back into the sitting start. Sitting loops by jumping back to greetEnd; a greeting is played by
// jumping from greetFrom to 0, which continues the same motion (source 89 → 90).
function setupTalk(stage,clip){
  const v=stage.querySelector('video'),section=stage.closest('section')||stage;
  v.loop=false;let want=false;const frame=1/48;  // the first play already starts with the greeting
  const greeting=()=>v.currentTime<clip.greetEnd-frame;
  const ask=()=>{if(!greeting())want=true;};
  const check=t=>{if(want&&t>=clip.greetFrom-frame/2&&t<clip.greetFrom+4*frame){want=false;v.currentTime=0;}};
  if('requestVideoFrameCallback' in HTMLVideoElement.prototype){
    const on=(_,m)=>{check(m.mediaTime);v.requestVideoFrameCallback(on);};v.requestVideoFrameCallback(on);
  }else v.addEventListener('timeupdate',()=>check(v.currentTime));
  v.addEventListener('ended',()=>{v.currentTime=want?(want=false,0):clip.greetEnd;v.play().catch(()=>{});});
  section.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')ask();});
  section.addEventListener('pointerdown',ask);
  new IntersectionObserver(e=>{if(e[e.length-1].isIntersecting)ask();},{rootMargin:'-25% 0px'}).observe(stage);
}

// 04 秘密武器库: he watches the mouse the normal way — only real frames of him turning his eyes and
// head: the stretch of the clip where he looks left (source 60) → at you (80) → right (124), RIFE 2x,
// neighbouring frames blended by position. No warping. Each time the page comes into view he first
// looks around (left, right, back to you); then on a row he turns his head to the pointer, and only
// loosely follows it elsewhere. With nobody pointing he glances aside now and then.
function setupGaze(stage,clip){
  const g=clip.gaze,section=stage.closest('section'),video=stage.querySelector('video');
  const P=g.poses,first=g.firstSource,last=first+(g.frames.length-1)/g.perSource;
  const images=[];let canvas,ctx,raf=null,prev=null,ready=false,inView=false;
  let p=P.front,v=0,target=P.front,pointer=false,holdUntil=0,glanceAt=0,looked=null,sweep=[];
  const toPose=t=>t<0?P.front+t*(P.front-P.left):P.front+t*(P.right-P.front);
  // -1 … 1: where x is from his face, left measured to the board's left edge, right to its right edge
  function side(x){
    const r=stage.getBoundingClientRect(),b=section.getBoundingClientRect(),hx=r.left+r.width*0.5;
    return Math.max(-1,Math.min(1,x<hx?(x-hx)/Math.max(80,(hx-b.left)*0.7):(x-hx)/Math.max(80,(b.right-hx)*0.7)));
  }
  function aimAt(x,li){
    sweep=[];
    // on a row he looks right at the pointer (his footage turns only left/right, not up/down);
    // elsewhere on the page he follows it only loosely
    target=toPose(side(x)*(li?1:0.6));
  }
  function lookAtRow(li){looked?.classList.remove('is-looked');looked=li;li?.classList.add('is-looked');}
  // Frames arrive in two stages; draw blends the nearest loaded frame below and above.
  const below=i=>{for(let k=i;k>=0;k--)if(images[k])return k;return -1;};
  const above=i=>{for(let k=i;k<images.length;k++)if(images[k])return k;return -1;};
  function draw(){
    const q=(p-first)*g.perSource;let i=below(Math.floor(q)),j=above(Math.ceil(q));
    if(i<0)i=j;if(j<0)j=i;
    const w=j>i?(q-i)/(j-i):0;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(w<0.02||i===j)ctx.drawImage(images[i],0,0);
    else if(w>0.98)ctx.drawImage(images[j],0,0);
    else{ // 'lighter' adds premultiplied colour and alpha: an exact blend of the two neighbours
      ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-w;ctx.drawImage(images[i],0,0);
      ctx.globalAlpha=w;ctx.drawImage(images[j],0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
    canvas.dataset.gaze=p.toFixed(1);
  }
  function tick(t){
    raf=null;if(!inView||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches){prev=null;return;}
    const dt=prev===null?1/60:Math.min(0.04,(t-prev)/1000);prev=t;
    if(sweep.length&&!pointer){ // looking around on arrival: each pose, then how long he holds it
      const s=sweep[0];target=s.pose;
      if(Math.abs(p-s.pose)<1.5&&Math.abs(v)<6){s.since??=t;if(t-s.since>s.hold){sweep.shift();glanceAt=t+2200;}}
    }else if(!pointer&&t>holdUntil&&t>glanceAt){target=P.front+(Math.random()-0.5)*(Math.random()<0.5?8:24);glanceAt=t+1800+Math.random()*2400;}
    // a softer, critically damped spring: the head eases into place instead of snapping
    const w0=9,z=1;v+=(w0*w0*(target-p)-2*z*w0*v)*dt;p+=v*dt;p=Math.max(first,Math.min(last,p));
    draw();raf=requestAnimationFrame(tick);
  }
  const run=()=>{if(ready&&inView&&raf===null&&!matchMedia('(prefers-reduced-motion: reduce)').matches)raf=requestAnimationFrame(tick);};
  const lookAround=()=>{sweep=[{pose:P.left+4,hold:450},{pose:P.right-6,hold:550},{pose:P.front,hold:0}];};
  section.addEventListener('pointermove',e=>{
    if(e.pointerType==='touch')return;pointer=true;
    if(performance.now()<holdUntil)return;
    const li=e.target.closest('.toolbox-card');lookAtRow(li);aimAt(e.clientX,li);
  },{passive:true});
  section.addEventListener('pointerleave',()=>{pointer=false;glanceAt=0;lookAtRow(null);target=P.front;});
  section.addEventListener('pointerdown',e=>{const li=e.target.closest('.toolbox-card');lookAtRow(li);aimAt(e.clientX,li);
    holdUntil=performance.now()+(e.pointerType==='touch'?1800:700);glanceAt=holdUntil;});
  // Frames start loading well before the board is reached. Every 4th frame first (he can move as
  // soon as those are in), then the rest fills in so the motion gets finer.
  const load=new IntersectionObserver(async entries=>{
    if(!entries.some(e=>e.isIntersecting)||images.length)return;
    load.disconnect();images.length=g.frames.length;
    const get=async i=>{const im=new Image();im.src=`${g.dir}/${g.frames[i]}`;await im.decode();images[i]=im;};
    const idx=g.frames.map((_,i)=>i),firstSet=idx.filter(i=>i%4===0||i===idx.length-1);
    await Promise.all(firstSet.map(get));
    canvas=document.createElement('canvas');[canvas.width,canvas.height]=clip.size;canvas.className='ip-video';
    canvas.setAttribute('role','img');canvas.setAttribute('aria-label',video.getAttribute('aria-label'));
    ctx=canvas.getContext('2d');draw();video.pause();video.replaceWith(canvas);ready=true;
    if(inView&&!pointer)lookAround();run();
    Promise.all(idx.filter(i=>!firstSet.includes(i)).map(get)).catch(()=>{});
  },{rootMargin:'1400px 0px'});
  load.observe(section);
  new IntersectionObserver(entries=>{const was=inView;inView=entries[entries.length-1].isIntersecting;
    if(inView&&!was&&ready&&!pointer)lookAround();run();},{rootMargin:'-20% 0px'}).observe(section);
  document.addEventListener('visibilitychange',run);
}

// Each time the music board comes on screen he starts from where he turns to you and smiles
// (source 118), then carries on with his own groove at normal speed.
function greet(v,clip){
  const start=()=>{v.currentTime=(118-clip.loopStartSource)/24;};
  if(v.readyState>=1)start();else v.addEventListener('loadedmetadata',start,{once:true});
}
// The now-playing card plays / pauses the song (content.json → bgm). Browsers only allow sound
// after a click, so it starts paused.
function setupNowPlaying(){
  const button=document.querySelector('.now-playing'),audio=document.getElementById('bgm'),hint=document.getElementById('now-playing-hint');
  if(!button||!audio)return;
  const bgm=content.bgm||{};
  if(bgm.title)button.querySelector('.track b').textContent=bgm.title;
  if(bgm.artist)button.querySelector('.track small').textContent=bgm.artist;
  const show=playing=>{button.setAttribute('aria-pressed',String(playing));button.setAttribute('aria-label',`${playing?'暂停':'播放'} ${bgm.artist||''}《${bgm.title||''}》`);};
  audio.addEventListener('play',()=>show(true));audio.addEventListener('pause',()=>show(false));
  const source=document.getElementById('now-playing-source');
  if(bgm.sourceUrl){source.href=bgm.sourceUrl;source.textContent=bgm.sourceLabel||'音源与许可 ↗';source.hidden=false;}else if(bgm.appleMusicUrl&&!bgm.src){source.href=bgm.appleMusicUrl;source.hidden=false;}
  // Resolve near the music card, so playback can begin in the actual click gesture.
  async function resolve(){
    if(bgm.src)return bgm.src;
    if(!bgm.appleTrackId)return null;
    const r=await fetch(`https://itunes.apple.com/lookup?id=${bgm.appleTrackId}`).then(r=>r.json());
    return r.results?.[0]?.previewUrl||null;
  }
  let loading=null,resumeOnReturn=false;
  function prepare(){
    if(audio.getAttribute('src'))return Promise.resolve(true);
    if(loading)return loading;
    loading=resolve().then(url=>{
      if(!url)return false;
      audio.src=url;audio.preload='auto';audio.load();return true;
    }).catch(()=>false).finally(()=>{loading=null;});
    return loading;
  }
  const nearMusic=new IntersectionObserver(entries=>{
    if(entries.some(entry=>entry.isIntersecting)){void prepare();nearMusic.disconnect();}
  },{rootMargin:'500px'});
  nearMusic.observe(button);
  async function play(){
    if(document.hidden){resumeOnReturn=true;return;}
    try{audio.volume=.7;await audio.play();hint.textContent='';}
    catch{hint.textContent='点击播放';show(false);}
  }
  button.addEventListener('click',async()=>{
    resumeOnReturn=false;
    if(!audio.paused){audio.pause();return;}
    if(!audio.getAttribute('src')){
      hint.textContent='正在载入…';
      if(!await prepare()){hint.textContent='暂时连不上音乐，请稍后再试';return;}
    }
    void play();
  });
  // Only restore a song the visitor actually started; switching tabs is not a manual pause.
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){resumeOnReturn=!audio.paused;audio.pause();}
    else if(resumeOnReturn){resumeOnReturn=false;void play();}
  });
}
function frameHasAlpha(v){
  try{
    // Real alpha means the frame has both fully transparent and fully opaque pixels.
    const c=document.createElement('canvas');c.width=32;c.height=32;const x=c.getContext('2d',{willReadFrequently:true});
    x.drawImage(v,0,0,32,32);const d=x.getImageData(0,0,32,32).data;let clear=false,solid=false;
    for(let i=3;i<d.length;i+=4){if(d[i]===0)clear=true;else if(d[i]===255)solid=true;}
    return clear&&solid;
  }catch{return location.protocol==='file:';}
}

// 01 headline. Entrance, cartoon style: each letter of CONTENT & AI drops in from above the page,
// lands a little below its place with a squash and a bounce, and cracks in two along one slanted
// line that only just opens (a couple of tiny chips, a small puff). Once all are down the chunks snap
// back together and the letters hop up into place. Profile text stays visible throughout.
// After that the letters play with the mouse: the one nearest the pointer is pushed taller and a
// little wider, its neighbours a little less, and they spring back when the pointer leaves.
// Sound (a crisp tap on landing, a crack and glassy chips on breaking) is made live with Web Audio. Browsers keep sound off until
// the page is clicked. The entry button unlocks audio; clicking the headline replays it.
function setupHeadlineDrop(){
  const box=document.querySelector('.hero-headline'),svg=box?.querySelector('svg'),text=svg?.querySelector('text');
  const reveal=()=>document.body.classList.add('headline-done');
  if(!text||!document.documentElement.classList.contains('js-drop')){reveal();return;}
  const ns='http://www.w3.org/2000/svg',str=text.textContent,base=Number(text.getAttribute('y'));
  const rnd=(a,b)=>a+Math.random()*(b-a),FALL=820,STEP=65,FLOOR=26;
  let running=false,live=[],hasRun=false;
  const el=(tag,attrs)=>{const n=document.createElementNS(ns,tag);for(const k in attrs)n.setAttribute(k,attrs[k]);return n;};
  const defs=svg.querySelector('defs')||svg.insertBefore(el('defs',{}),svg.firstChild);
  const extents=()=>[...str].map((c,i)=>c===' '?null:{c,e:text.getExtentOfChar(i)}).filter(Boolean);

  // --- sound -----------------------------------------------------------------------------------
  const soundReady = () => siteSound.ready();
  function noise(ctx,sec){const b=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*sec),ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b;}
  // everything goes through one gentle compressor so eleven overlapping hits never clip
  let bus=null;
  function out(ctx){
    if(bus&&bus.context===ctx)return bus;
    const comp=ctx.createDynamicsCompressor(),g=ctx.createGain();
    comp.threshold.value=-18;comp.ratio.value=6;comp.attack.value=0.002;comp.release.value=0.12;g.gain.value=.65;
    comp.connect(g).connect(siteSound.output());bus=comp;return bus;
  }
  function burst(ctx,t,{type,freq,q=1,vol,len}){ // a short filtered noise hit
    const n=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
    n.buffer=noise(ctx,len+0.02);f.type=type;f.frequency.value=freq;f.Q.value=q;
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0005,t+len);n.connect(f).connect(g).connect(out(ctx));n.start(t);n.stop(t+len+0.02);
  }
  function ping(ctx,t,{freq,vol,len,type='sine'}){ // a short ringing tone
    const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*0.97,t+len);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.003);g.gain.exponentialRampToValueAtTime(0.0005,t+len);
    o.connect(g).connect(out(ctx));o.start(t);o.stop(t+len+0.02);
  }
  // landing: a crisp "tok" — a bright click, a short woody ring and only a little body underneath
  function land(ctx,t,vol){
    burst(ctx,t,{type:'highpass',freq:2500,vol:vol*0.9,len:0.018});
    ping(ctx,t,{freq:rnd(1300,1700),vol:vol*0.55,len:0.07,type:'triangle'});
    ping(ctx,t,{freq:rnd(420,520),vol:vol*0.35,len:0.05});
  }
  // breaking: a sharp "crack", then a few bright glassy chips ringing out over a quarter second
  function breakSound(ctx,t,vol){
    burst(ctx,t,{type:'bandpass',freq:rnd(3000,4200),q:0.8,vol,len:0.035});
    burst(ctx,t+0.012,{type:'highpass',freq:5000,vol:vol*0.6,len:0.05});
    for(let k=0;k<5;k++){const s=t+0.02+rnd(0,0.22);
      ping(ctx,s,{freq:rnd(3200,7200),vol:vol*rnd(.18,.35),len:rnd(0.06,0.16)});
      burst(ctx,s,{type:'bandpass',freq:rnd(4000,8000),q:3,vol:vol*0.25,len:0.012});}
  }

  // --- letters: two chunks each, cut along one slanted crack ---------------------------------------
  function clearLetters(){svg.querySelectorAll('.drop-ch,.live-ch').forEach(n=>n.remove());defs.querySelectorAll('.drop-clip').forEach(n=>n.remove());live=[];}
  function build(){
    clearLetters();
    return extents().map(({c,e},i)=>{
      const x0=e.x-2,x1=e.x+e.width+2,y0=e.y-6,y1=base+10,h=y1-y0;
      const m=y0+h*rnd(.42,.58),ta=rnd(.08,.16)*h*(Math.random()<.5?-1:1);
      // one crack with a small kink in the middle, like a cartoon break
      const kx=(x0+x1)/2,ky=m+rnd(-.05,.05)*h;
      const polys=[[[x0,y0],[x1,y0],[x1,m+ta],[kx,ky],[x0,m-ta]],[[x0,m-ta],[kx,ky],[x1,m+ta],[x1,y1],[x0,y1]]];
      const g=el('g',{class:'drop-ch','aria-hidden':'true'}),pieces=polys.map((poly,k)=>{
        const id=`drop-${i}-${k}`,clip=el('clipPath',{id,class:'drop-clip',clipPathUnits:'userSpaceOnUse'});
        clip.append(el('polygon',{points:poly.map(p=>p.join(',')).join(' ')}));defs.append(clip);
        const pg=el('g',{class:'drop-piece'}),t=el('text',{x:e.x,y:base,textLength:e.width,lengthAdjust:'spacingAndGlyphs','clip-path':`url(#${id})`});
        t.textContent=c;pg.append(t);g.append(pg);return pg;
      });
      svg.append(g);return {g,pieces,e};
    });
  }
  function puff(e){
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const ground=base+FLOOR;
    for(let k=0;k<2;k++){
      const s=rnd(4,7),cx=e.x+e.width*(k?rnd(.65,.9):rnd(.1,.35)),p=el('polygon',{class:'drop-shard',points:`${cx},${ground} ${cx+s},${ground+s*0.3} ${cx+s*0.4},${ground-s*0.8}`});svg.append(p);
      const dx=(k?1:-1)*rnd(18,38),dy=rnd(-40,-22);
      p.animate([{transform:'translate(0,0)',opacity:1},{transform:`translate(${dx}px,${dy}px) rotate(${rnd(-120,120)}deg)`,opacity:1,offset:.5},{transform:`translate(${dx*1.3}px,4px) rotate(${rnd(-200,200)}deg)`,opacity:0}],
        {duration:520,easing:'ease-out',fill:'forwards'}).finished.then(()=>p.remove());
    }
    const dust=el('ellipse',{class:'drop-dust',cx:e.x+e.width/2,cy:ground,rx:e.width*0.35,ry:6});svg.append(dust);
    dust.animate([{transform:'scale(.4,.5)',opacity:.35},{transform:'scale(1.25,1.2)',opacity:0}],{duration:450,easing:'ease-out',fill:'forwards'}).finished.then(()=>dust.remove());
  }

  function run(withSound){
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    if(running)return;running=true;
    const sound=withSound?soundReady():Promise.resolve(null),startedAt=performance.now(),hits=[];
    hasRun=true;box.dataset.animation='playing';box.dataset.animationSound='off';
    document.body.classList.remove('headline-done');box.classList.remove('is-dropped');box.classList.add('is-dropping');
    const letters=build();
    letters.forEach(({g,pieces,e},i)=>{
      const rot=rnd(4,9)*(Math.random()<.5?-1:1),delay=100+i*STEP,hit=delay+FALL*0.7;
      g.animate([
        {transform:`translate(0,-1100px)`,opacity:0,easing:'cubic-bezier(.55,0,1,.45)'},
        {offset:.05,opacity:1},
        {offset:.7,transform:`translate(0,${FLOOR}px) scale(1.18,.72)`,easing:'cubic-bezier(.2,.9,.35,1)'},
        {offset:.84,transform:`translate(0,${FLOOR-26}px) rotate(${rot*0.5}deg) scale(.92,1.1)`,easing:'cubic-bezier(.6,0,1,1)'},
        {transform:`translate(0,${FLOOR}px) rotate(${rot}deg) scale(1,1)`,opacity:1}
      ],{duration:FALL,delay,fill:'forwards'});
      // the crack opens just a hair: the top chunk slips sideways and tips a degree or two
      const slip=rnd(2,4)*(Math.random()<.5?-1:1);
      pieces[0].animate([{transform:'translate(0,0) rotate(0deg)'},{transform:`translate(${slip}px,-2px) rotate(${slip*0.5}deg)`}],
        {duration:220,delay:hit+FALL*0.14,easing:'cubic-bezier(.3,1.6,.6,1)',fill:'forwards'});
      setTimeout(()=>puff(e),hit);
      hits.push({land:hit,crack:hit+FALL*0.14});
    });
    // Schedule only future impacts once audio becomes available. A blocked or
    // slow audio device never delays the visual animation or hides the text.
    sound.then(ctx=>{
      if(!ctx||!running||document.hidden)return;
      box.dataset.animationSound='on';siteSound.monitor(2600);
      const elapsed=performance.now()-startedAt,now=ctx.currentTime;
      for(const hit of hits){
        if(hit.land>elapsed)land(ctx,now+(hit.land-elapsed)/1000,0.75);
        if(hit.crack>elapsed)breakSound(ctx,now+(hit.crack-elapsed)/1000,0.6);
      }
    }).catch(()=>{box.dataset.animationSound='off';});
    const allDown=100+(letters.length-1)*STEP+FALL+350;
    setTimeout(()=>{
      const back=[];
      letters.forEach(({g,pieces},i)=>{
        const d=Math.abs(i-(letters.length-1)/2)*35;
        pieces.forEach(pg=>back.push(pg.animate([{transform:getComputedStyle(pg).transform},{transform:'translate(0,0) rotate(0deg)'}],{duration:240,delay:d,easing:'cubic-bezier(.3,1.4,.6,1)',fill:'forwards'}).finished));
        back.push(g.animate([{transform:getComputedStyle(g).transform},{transform:`translate(0,-14px) rotate(0deg) scale(.97,1.05)`,offset:.55},{transform:'translate(0,0) rotate(0deg) scale(1,1)'}],{duration:620,delay:d+160,easing:'cubic-bezier(.3,.9,.4,1.2)',fill:'forwards'}).finished);
      });
      Promise.all(back).then(()=>{box.classList.remove('is-dropping');goLive();running=false;box.dataset.animation='complete';reveal();});
    },allDown);
  }

  // --- after the entrance: one plain letter each, which the mouse can squeeze -------------------
  function goLive(){
    clearLetters();
    live=extents().map(({c,e})=>{
      const g=el('g',{class:'live-ch','aria-hidden':'true'}),t=el('text',{x:e.x,y:base,textLength:e.width,lengthAdjust:'spacingAndGlyphs'});
      t.textContent=c;g.append(t);svg.append(g);return {g,cx:e.x+e.width/2};
    });
    box.classList.add('is-live');
  }
  let frame=null,last=null;
  function squeeze(){
    frame=null;
    if(!live.length)return;
    const r=svg.getBoundingClientRect(),unit=1400/r.width;
    live.forEach(({g,cx})=>{
      let k=0;
      if(last){
        const dx=(last.x-r.left)*unit-cx,dy=Math.max(0,Math.abs((last.y-r.top)-r.height/2)-r.height*0.35);
        k=Math.exp(-(dx*dx)/(2*115*115))*Math.exp(-(dy*dy)/(2*90*90));
      }
      g.style.transform=k<0.01?'':`scale(${(1+0.14*k).toFixed(3)},${(1+0.3*k).toFixed(3)})`;
    });
  }
  const hero=box.closest('.hero')||box;
  hero.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;last={x:e.clientX,y:e.clientY};if(!frame)frame=requestAnimationFrame(squeeze);},{passive:true});
  hero.addEventListener('pointerleave',()=>{last=null;if(!frame)frame=requestAnimationFrame(squeeze);});
  addEventListener('resize',()=>{if(live.length&&!running)goLive();});

  // Prewarm the local face behind the entry gate; never hold the entrance for it.
  const fontReady=document.fonts.ready;
  let visible = false, mayStart = false;
  let initialAway = !!location.hash && location.hash !== '#home';
  const visibleHero = new IntersectionObserver(entries => {
    visible = entries[entries.length-1].isIntersecting && entries[entries.length-1].intersectionRatio >= .35;
    if(!visible)initialAway=false;
    if(visible && !initialAway && mayStart && !hasRun) run(true);
  },{threshold:.35});
  visibleHero.observe(hero);
  document.addEventListener('azu:sound-change',()=>{
    if(visible&&!initialAway&&mayStart&&!hasRun)run(true);
  });
  entered.then(()=>{mayStart=true;if(visible&&!initialAway)run(true);});
  fontReady.then(()=>{if(live.length&&!running)goLive();});
  // Returning through Home is an explicit replay gesture, including from deep links.
  document.querySelectorAll('a[href="#home"]').forEach(link=>link.addEventListener('click',()=>{
    initialAway=false;siteSound.unlock();
    if(mayStart)run(true);
    document.dispatchEvent(new Event('azu:replay-hero'));
  }));
  box.style.cursor='pointer';box.title='点一下，再摔一次（有声音）';
  box.addEventListener('click',()=>run(true));
}

const ivMotion = matchMedia('(prefers-reduced-motion: reduce)');
function stopDecorativeMotion(){
  if(!ivMotion.matches)return;
  document.querySelectorAll('video:not([controls])').forEach(video=>video.pause());
  document.querySelectorAll('.hero-headline *, .toolbox-box').forEach(node=>node.getAnimations().forEach(animation=>{try{animation.finish();}catch{animation.pause();}}));
  document.documentElement.classList.remove('has-gate');
  document.body.classList.add('intro-visible','scroll-visible');
}
ivMotion.addEventListener('change',stopDecorativeMotion);
document.addEventListener('play',event=>{if(ivMotion.matches&&event.target.matches?.('video:not([controls])'))event.target.pause();},true);
stopDecorativeMotion();

})().catch(e=>console.error(e));
