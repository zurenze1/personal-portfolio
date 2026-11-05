// Native Web Audio playback of Alexander Holm's CC BY 3.0 Salamander piano sample.
// Sound is unlocked only by an explicit click or keyboard action; hover never bypasses autoplay rules.
export function mountGraphPiano(root) {
  const button = root.querySelector('#hd-piano-toggle');
  const status = root.querySelector('#hd-piano-status');
  const lastNote = root.querySelector('#hd-piano-note');
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!button || !Audio) {
    if (button) {button.disabled = true; button.textContent = '当前浏览器暂不支持钢琴声';}
    return;
  }
  const scale = [[0,'C4'],[2,'D4'],[4,'E4'],[7,'G4'],[9,'A4'],[12,'C5'],[14,'D5'],[16,'E5']];
  let context, buffer, loading, wanted = true, request = 0, lastPlayed = -Infinity;
  const voices = new Set();
  const pointFrom = target => target instanceof Element ? target.closest('circle[data-hd-work]') : null;
  const notice = text => {if (status.textContent !== text) status.textContent = text;};
  function stopVoices() {
    request++;
    for (const voice of voices) {
      const now = context.currentTime;
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setTargetAtTime(0,now,.015);
      voice.source.stop(now+.08);
    }
  }
  async function ready() {
    context ||= new Audio({latencyHint:'interactive'});
    // resume() is invoked synchronously inside the user's click/keydown handler.
    const resuming = context.resume();
    if (!buffer && !loading) {
      loading = fetch(new URL('./media/piano/C4.mp3',import.meta.url))
        .then(response => {if (!response.ok) throw new Error('音色未能读取');return response.arrayBuffer();})
        .then(bytes => context.decodeAudioData(bytes))
        .then(decoded => {buffer = decoded;return decoded;})
        .finally(() => {loading = null;});
    }
    await Promise.all([resuming,buffer || loading]);
    if (context.state !== 'running') throw new Error('声音尚未启用');
  }
  function play(point) {
    if (!wanted || !buffer || context?.state !== 'running' || document.hidden || document.querySelector('dialog[open]')) return;
    const now = context.currentTime;
    if (now-lastPlayed < .1) return;
    lastPlayed = now;
    if (voices.size >= 4) voices.values().next().value.source.stop();
    const height = point.ownerSVGElement.viewBox.baseVal.height;
    const y = Number(point.getAttribute('cy'));
    const fraction = Math.max(0,Math.min(1,(height-55-y)/(height-80)));
    const [semitones,name] = scale[Math.round(fraction*(scale.length-1))];
    const source = context.createBufferSource(), gain = context.createGain();
    source.buffer = buffer;
    source.playbackRate.value = 2**(semitones/12);
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.linearRampToValueAtTime(.23,now+.012);
    gain.gain.exponentialRampToValueAtTime(.0001,now+1.5);
    source.connect(gain);gain.connect(context.destination);
    const voice = {source,gain};voices.add(voice);
    source.onended = () => {voices.delete(voice);source.disconnect();gain.disconnect();};
    source.start(now);source.stop(now+1.55);
    lastNote.textContent = '♪ '+name;
    notice('钢琴声已开启 · 移过圆点，或用左右键演奏。');
  }
  async function activate(point) {
    if (!wanted || !point) return;
    const currentRequest = ++request;
    try {
      await ready();
      if (currentRequest !== request || !wanted) return;
      for (const media of document.querySelectorAll('video,audio')) if (!media.muted && !media.paused) media.pause();
      play(point);
    } catch {
      if (wanted) notice('音色暂未就绪，请再点一次圆点或钢琴开关。');
    }
  }
  button.addEventListener('click',() => {
    wanted = !wanted;
    button.setAttribute('aria-pressed',String(wanted));
    button.textContent = wanted ? '钢琴声：开 ♪' : '钢琴声：关';
    if (!wanted) {stopVoices();lastNote.textContent = '♪';notice('已静音，图表仍可正常操作。');}
    else activate(root.querySelector('circle[data-hd-work][tabindex="0"]') || root.querySelector('circle[data-hd-work]'));
  });
  root.addEventListener('click',event => {const point=pointFrom(event.target);if(point) activate(point);});
  root.addEventListener('pointerover',event => {
    const point = pointFrom(event.target);
    if (point && point !== pointFrom(event.relatedTarget)) play(point);
  });
  root.addEventListener('focusin',event => {const point=pointFrom(event.target);if(point) play(point);});
  root.addEventListener('keydown',event => {
    if (!event.target.closest('#hd-timeline,#hd-pairs')) return;
    if (event.key === 'Enter' || event.key === ' ') {
      const point = pointFrom(event.target);
      if (point) {event.preventDefault();point.dispatchEvent(new MouseEvent('click',{bubbles:true}));}
    } else if (['ArrowLeft','ArrowRight','Home','End'].includes(event.key) && wanted) {
      // Existing chart handlers move focus before the promise resolves.
      ready().then(() => {const point=pointFrom(document.activeElement);if(point)play(point);})
        .catch(() => notice('请点击一个圆点启用钢琴声。'));
    }
  },true);
  document.addEventListener('visibilitychange',() => {if(document.hidden)stopVoices();});
  document.addEventListener('play',event => {
    if (event.target instanceof HTMLMediaElement && !event.target.muted) stopVoices();
  },true);
}
