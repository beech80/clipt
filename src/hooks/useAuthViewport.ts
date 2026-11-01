import {useCallback,useLayoutEffect,useState} from 'react';

/** Keep authentication in one visible viewport; scrolling belongs to the form. */
export function useAuthViewport(enabled:boolean){
 const [root,setRoot]=useState<HTMLDivElement|null>(null);
 const ref=useCallback((node:HTMLDivElement|null)=>setRoot(node),[]);
 useLayoutEffect(()=>{
  if(!enabled||!root)return;
  const viewport=window.visualViewport;
  let frame=0;
  const update=()=>{
   frame=0;
   const finite=(value:number|undefined,fallback:number)=>typeof value==='number'&&Number.isFinite(value)&&value>0?value:fallback;
   root.style.setProperty('--clipt-auth-height',finite(viewport?.height,window.innerHeight)+'px');
   root.style.setProperty('--clipt-auth-width',finite(viewport?.width,window.innerWidth)+'px');
   root.style.setProperty('--clipt-auth-top',Math.max(0,viewport?.offsetTop||0)+'px');
   root.style.setProperty('--clipt-auth-left',Math.max(0,viewport?.offsetLeft||0)+'px');
   root.style.setProperty('--clipt-auth-layout-height',window.innerHeight+'px');
   const controller=root.querySelector<HTMLElement>('.clipt-controller[data-page-controller]');
   if(controller)root.style.setProperty('--clipt-auth-controller-height',controller.getBoundingClientRect().height+'px');
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  const controller=root.querySelector<HTMLElement>('.clipt-controller[data-page-controller]');
  const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(schedule);
  if(controller)observer?.observe(controller);
  window.addEventListener('resize',schedule);
  viewport?.addEventListener('resize',schedule);
  viewport?.addEventListener('scroll',schedule);
  update();
  return()=>{if(frame)cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener('resize',schedule);viewport?.removeEventListener('resize',schedule);viewport?.removeEventListener('scroll',schedule);};
 },[enabled,root]);
 return ref;
}
