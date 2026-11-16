/* Same-origin adapter for the brand ribbon. No independent page scroll inside
   the frame. Messages are scoped by both origin and the exact frame window. */
(() => {
  'use strict';
  const root=document.querySelector('.bf-flight');if(!root)return;
  const frame=root.querySelector('.bf-frame'),shell=root.querySelector('.bf-sticky');
  const talkLink=root.querySelector('.bf-talk');
  const view=root.closest('[data-view]'),rm=matchMedia('(prefers-reduced-motion:reduce)');
  const abort=new AbortController(),on=(el,name,fn,options={})=>el.addEventListener(name,fn,{...options,signal:abort.signal});
  const clamp=n=>Math.max(0,Math.min(1,n));
  let ready=false,raf=0;
  const origin=window.location.origin;
  root.classList.add('js');
  function geometry(){const rect=root.getBoundingClientRect();return{rect,top:rect.top+scrollY,travel:Math.max(1,root.offsetHeight-shell.offsetHeight)};}
  function send(data){if(ready)frame.contentWindow.postMessage(data,origin);}
  function load(){if(!frame.getAttribute('src'))frame.src=frame.dataset.src;}
  function update(){
    raf=0;
    const visible=!view.hidden,{rect,travel}=geometry();
    const near=visible&&rect.bottom>-800&&rect.top<innerHeight+800;
    if(near)load();
    const active=visible&&!document.hidden&&rect.bottom>0&&rect.top<innerHeight;
    const progress=clamp(-rect.top/travel);
    root.style.setProperty('--flight-exit',Math.min(0,rect.bottom-shell.offsetHeight).toFixed(2)+'px');
    root.dataset.progress=progress.toFixed(4);root.dataset.active=String(active);
    talkLink.hidden=progress<.965;
    send({type:'gt-brand:progress',progress,active});
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(update);}
  function seek(progress,behavior='instant'){
    const g=geometry();window.scrollTo({top:g.top+clamp(progress)*g.travel,behavior:rm.matches?'instant':behavior});schedule();
  }
  function discuss(){
    const contact=document.getElementById('k-svyaz');
    if(contact){history.replaceState(history.state,'','#k-svyaz');contact.scrollIntoView({behavior:rm.matches?'instant':'smooth'});}
  }
  on(window,'message',event=>{
    if(event.origin!==origin||event.source!==frame.contentWindow||!event.data)return;
    const data=event.data;
    if(data.type==='gt-brand:ready'){ready=true;root.classList.add('loaded');update();}
    if(data.type==='gt-brand:seek'&&Number.isFinite(data.progress))seek(data.progress,data.behavior==='smooth'?'smooth':'instant');
    if(data.type==='gt-brand:delta'&&Number.isFinite(data.delta)&&!view.hidden){window.scrollBy({top:Math.max(-innerHeight*3,Math.min(innerHeight*3,data.delta)),behavior:'instant'});schedule();}
    if(data.type==='gt-brand:talk')discuss();
  });
  on(talkLink,'click',event=>{event.preventDefault();discuss();});
  on(root.closest('.brand-chapter'),'click',event=>{
    const link=event.target.closest('a[href="#k-brend-final"]');if(!link||event.button||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();event.stopPropagation();
    history.replaceState(history.state,'','#k-brend-final');
    seek(1,'smooth');
  },{capture:true});
  on(window,'scroll',schedule,{passive:true});on(window,'resize',schedule,{passive:true});
  on(document,'visibilitychange',schedule);
  const viewObserver=new MutationObserver(schedule);viewObserver.observe(view,{attributes:true,attributeFilter:['hidden']});
  const sizeObserver=new ResizeObserver(schedule);sizeObserver.observe(shell);
  on(window,'pageshow',()=>{viewObserver.observe(view,{attributes:true,attributeFilter:['hidden']});sizeObserver.observe(shell);schedule();});
  on(window,'pagehide',()=>{if(raf)cancelAnimationFrame(raf);raf=0;viewObserver.disconnect();sizeObserver.disconnect();send({type:'gt-brand:progress',progress:Number(root.dataset.progress)||0,active:false});});
  const entryHash=window.location.hash;
  function restoreEntryAnchor(){
    if(view.hidden||window.location.hash!==entryHash)return;
    if(entryHash==='#k-brend-final')seek(1);
    else if(['#k-brend','#k-brend-flight','#k-uslugi'].includes(entryHash))document.getElementById(entryHash.slice(1))?.scrollIntoView({behavior:'instant'});
  }
  const restoreAfterLayout=()=>document.fonts.ready.then(()=>requestAnimationFrame(restoreEntryAnchor));
  if(document.readyState==='complete')restoreAfterLayout();
  else on(window,'load',restoreAfterLayout,{once:true});
  schedule();
})();
