(async()=>{'use strict';
const dialog=document.getElementById('image-dialog');
const full=document.getElementById('image-full');
const caption=document.getElementById('image-caption');
const frame=document.getElementById('actor-film');
let lastButton=null;
const pauseFilm=()=>frame.contentWindow?.postMessage({type:'case:pause'},'*');
document.querySelectorAll('[data-image]').forEach(button=>button.addEventListener('click',()=>{
  lastButton=button;pauseFilm();full.src=button.dataset.image;full.alt=button.dataset.caption;caption.textContent=button.dataset.caption;dialog.showModal();
}));
const close=()=>dialog.close();
document.getElementById('image-close').addEventListener('click',close);
dialog.addEventListener('click',event=>{if(event.target===dialog)close();});
dialog.addEventListener('close',()=>{full.removeAttribute('src');lastButton?.focus({preventScroll:true});});
new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)pauseFilm();},{threshold:0}).observe(frame);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseFilm();});

})().catch(e=>console.error(e));
