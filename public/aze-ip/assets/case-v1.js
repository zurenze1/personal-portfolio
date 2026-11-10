(async()=>{'use strict';
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const targets = [...document.querySelectorAll('[data-reveal]')];
let observer;
function syncMotion() {
  observer?.disconnect();
  targets.forEach(target => target.classList.remove('reveal-pending', 'is-visible'));
  if (motion.matches || !('IntersectionObserver' in window)) return;
  observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, {threshold: 0.08});
  targets.forEach(target => {
    // First-screen media and copy remain immediately readable.
    if (target.getBoundingClientRect().top < innerHeight) return;
    target.classList.add('reveal-pending');
    observer.observe(target);
  });
}
syncMotion();
motion.addEventListener('change', syncMotion);

})().catch(e=>console.error(e));
