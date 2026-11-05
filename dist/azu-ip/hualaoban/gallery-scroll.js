// Chapter colours and spatial reveals, inspired by an exhibition runway.
(() => {
  'use strict';
  const root = document.querySelector('#main');
  if (!root) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const wide = matchMedia('(min-width: 760px)');
  const palette = {
    top:['#f4f6fa','#23364d'], profile:['#edf1f7','#23364d'], experience:['#e7edf6','#23364d'],
    case:['#edf0f7','#23364d'], 'editing-projects':['#e5eef0','#23364d'],
    'script-comparison':['#eeebf5','#23364d'], 'account-data':['#e7eaf5','#23364d'],
    stories:['#f0e9ee','#23364d'], whitepaper:['#e7eef5','#23364d'],
  };
  const defaults = [['#e9eef5','#23364d'],['#eeedf5','#23364d']];
  const clamp = n => Math.max(0, Math.min(1, n));
  const nodes = [...root.children].filter(n => n.tagName === 'SECTION');
  let previous = '#f2f5f8';
  const scenes = nodes.map((node, index) => {
    const [paper, ink] = palette[node.id] || defaults[index % 2];
    const dark = false;
    const muted = dark ? '#c2cfde' : '#425770';
    const line = dark ? '#e7f0ff48' : '#263c5438';
    node.classList.add('gallery-scene');
    node.dataset.sceneTone = dark ? 'dark' : 'light';
    for (const [key, value] of Object.entries({
      '--scene-paper': paper, '--scene-ink': ink, '--previous-paper': previous,
      '--paper': paper, '--ink': ink, '--muted': muted, '--line': line,
      '--hd-paper': paper, '--hd-ink': ink, '--hd-muted': muted,
      '--hd-line': line, '--hd-accent': dark ? '#a5c6fa' : '#315f9c',
    })) node.style.setProperty(key, value);
    previous = paper;
    return {node, paper, ink};
  });
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'gallery-toggle';
  button.setAttribute('aria-label', '切换展览浏览');
  document.querySelector('.site-header').append(button);
  let enabled = !reduce.matches, lenis = null, priorLock = null, frame = 0;
  const pageTop = node => {
    let value = 0;
    for (let n = node; n; n = n.offsetParent) value += n.offsetTop || 0;
    return value;
  };
  function decorate() {
    for (const {node} of scenes) {
      // Transform bounded media groups, never a whole multi-screen data table.
      for (const item of node.querySelectorAll(':scope > .section-label, :scope > .section-heading, :scope > .cover-grid, :scope > .case-heading, :scope > figure, :scope > .editing-evidence-grid, :scope > .story-grid, :scope > .wrap > .case-heading, :scope > .wrap > .case-grid, :scope > .wrap > .hd-heading')) {
        item.classList.add('gallery-reveal');
        item.classList.toggle('gallery-reveal-flat', item.offsetHeight > innerHeight * 1.2);
        item.style.setProperty('--reveal-depth', Math.max(120, Math.round(item.offsetHeight * .2)) + 'px');
      }
    }
  }
  function update() {
    frame = 0;
    const vh = innerHeight, y = scrollY, focus = y + vh * .46;
    const boxes = scenes.map(scene => ({...scene, top: pageTop(scene.node), height: scene.node.offsetHeight}));
    let active = boxes[0];
    for (const scene of boxes) {
      if (scene.top <= focus && scene.height > 30) active = scene;
      const enter = enabled ? clamp((vh * .91 - (scene.top - y)) / (vh * .73)) : 1;
      scene.node.style.setProperty('--scene-enter', enter.toFixed(3));
    }
    if (active) {
      const stops=boxes.map(scene=>({...scene,point:scene.top+Math.min(scene.height*.4,vh*.48)}));
      let paper=stops[0].paper;
      for(let i=1;i<stops.length;i++){
        const a=stops[i-1],b=stops[i];
        if(focus>=b.point){paper=b.paper;continue;}
        const raw=clamp((focus-a.point)/Math.max(1,b.point-a.point)),t=raw*raw*(3-2*raw);
        const rgb=hex=>hex.slice(1).match(/../g).map(v=>parseInt(v,16));
        const aa=rgb(a.paper),bb=rgb(b.paper);
        paper='rgb('+aa.map((v,k)=>Math.round(v+(bb[k]-v)*t)).join(',')+')';break;
      }
      document.body.style.setProperty('--expo-background', paper);
      document.body.style.setProperty('--expo-ink', '#23364d');
      document.body.dataset.activeChapter = active.node.id;
      for (const link of document.querySelectorAll('.site-header nav a')) {
        link.classList.toggle('chapter-active', link.hash === '#' + active.node.id);
      }
    }
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  function syncLock() {
    if (!lenis) return;
    const lock = document.body.classList.contains('intro-playing') || !!document.querySelector('dialog[open]');
    if (lock === priorLock) return;
    priorLock = lock;
    if (lock) lenis.stop();
    else {
      lenis.start(); lenis.scrollTo(scrollY, {immediate: true, force: true});
    }
  }
  function configure() {
    enabled = enabled && !reduce.matches;
    document.body.classList.toggle('gallery-motion', enabled);
    document.documentElement.dataset.galleryMode = enabled ? 'exhibition' : 'reading';
    button.textContent = enabled ? '展览浏览 · 开' : '展览浏览 · 关';
    button.setAttribute('aria-pressed', String(enabled)); button.hidden = reduce.matches;
    if (lenis) { lenis.destroy(); lenis = null; }
    priorLock = null;
    if (enabled && wide.matches && typeof window.Lenis === 'function') {
      lenis = new window.Lenis({
        autoRaf: true, lerp: .095, smoothWheel: true, syncTouch: false,
        anchors: true,
        prevent: node => !!node.closest('dialog,textarea,input,select,.hd-chart-scroll,.hd-table-scroll,.archive-table-wrap,[data-lenis-prevent]'),
      });
      lenis.on('scroll', schedule); syncLock();
    }
    schedule();
  }
  button.addEventListener('click', () => { enabled = !enabled; configure(); });
  reduce.addEventListener('change', () => { enabled = !reduce.matches; configure(); });
  wide.addEventListener('change', configure);
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', schedule, {passive: true});
  document.addEventListener('toggle',schedule,true);
  document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{const target=document.getElementById(a.hash.slice(1));const details=target?.closest('details');if(details)details.open=true;}));
  new MutationObserver(syncLock).observe(document.body, {attributes: true, attributeFilter: ['class']});
  new MutationObserver(syncLock).observe(document.body, {subtree: true, attributes: true, attributeFilter: ['open']});
  if (typeof ResizeObserver === 'function') {
    const resize = new ResizeObserver(() => { decorate(); schedule(); });
    for (const {node} of scenes) resize.observe(node);
  }
  decorate(); configure();
})();
