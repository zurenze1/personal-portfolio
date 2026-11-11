(()=>{'use strict';
const dialog=document.querySelector('#selectedPlayer'),video=document.querySelector('#selectedPlayerVideo'),title=document.querySelector('#selectedPlayerTitle'),error=document.querySelector('#selectedPlayerError');
let trigger;
document.querySelectorAll('[data-watch]').forEach(link=>link.addEventListener('click',event=>{
 event.preventDefault();trigger=link;title.textContent=link.querySelector('h4').textContent;
 document.querySelectorAll('video,audio').forEach(media=>media.pause());
 error.hidden=true;video.poster=link.querySelector('img').src;video.src=link.href;
 dialog.showModal();document.body.classList.add('watching-video');
 video.play().catch(()=>{});
}));
video.addEventListener('error',()=>{error.hidden=false});
document.querySelector('#selectedPlayerClose').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()}});
dialog.addEventListener('close',()=>{video.pause();video.removeAttribute('src');video.load();document.body.classList.remove('watching-video');trigger?.focus()});
})();
