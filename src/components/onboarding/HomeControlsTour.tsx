import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import {useSearchParams} from 'react-router-dom';
import {HOME_TOUR_STEPS,hasSeenHomeTour,rememberHomeTour,homeTourKey,homeTourPlacement,type TourRect,type TourViewport} from '@/lib/home-controls-tour';
import './home-controls-tour.css';

function visible(element:Element):element is HTMLElement {
 if(!(element instanceof HTMLElement)||!element.getClientRects().length)return false;
 const r=element.getBoundingClientRect(),v=window.visualViewport,left=v?.offsetLeft??0,top=v?.offsetTop??0;if(r.width<=0||r.height<=0||r.right<=left||r.left>=left+(v?.width||innerWidth)||r.bottom<=top||r.top>=top+(v?.height||innerHeight))return false;
 for(let node:HTMLElement|null=element;node;node=node.parentElement){const s=getComputedStyle(node);if(s.display==='none'||s.visibility==='hidden'||s.opacity==='0')return false;}
 return true;
}
function firstVisible(selector:string){return selector?Array.from(document.querySelectorAll(selector)).find(visible)??null:null;}
function panelOpen(){return Array.from(document.querySelectorAll('[role="dialog"],[role="menu"]')).some(visible);}
function rect(element:Element):TourRect{const r=element.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};}
function storage(){try{return window.localStorage;}catch{return null;}}
function videoPixels(){const v=document.querySelector<HTMLVideoElement>('[data-active-clip="true"] video');if(!v?.videoWidth||!v.videoHeight)return null;const r=v.getBoundingClientRect(),scale=Math.min(r.width/v.videoWidth,r.height/v.videoHeight),w=v.videoWidth*scale,h=v.videoHeight*scale;return {left:r.left+(r.width-w)/2,top:r.top+(r.height-h)/2,right:r.left+(r.width+w)/2,bottom:r.top+(r.height+h)/2};}

/** First home entry only; local preference metadata never authorizes backend access. */
export function HomeControlsTour({userId,ready=true}:{userId:string;ready?:boolean}){
 const [params,setParams]=useSearchParams();
 const replay=params.get('tour')==='controls';
 const [open,setOpen]=useState(false),[checked,setChecked]=useState(false),[step,setStep]=useState(0),[expanded,setExpanded]=useState(false);
 const [layout,setLayout]=useState<{viewport:TourViewport;placement:ReturnType<typeof homeTourPlacement>;target:TourRect|null;targetName:string;portrait:boolean;postVisible:boolean;blocked:boolean;disabled:boolean}|null>(null);
 const card=useRef<HTMLElement>(null),nextButton=useRef<HTMLButtonElement>(null),previousFocus=useRef<HTMLElement|null>(null),focusAssigned=useRef(false);
 const watch=open||!checked||replay;
 const current=HOME_TOUR_STEPS[step];

 useLayoutEffect(()=>{
  if(!watch)return;
  let frame=0;
  const measure=()=>{
   const vv=window.visualViewport,cs=getComputedStyle(document.documentElement),inset=(side:string)=>parseFloat(cs.getPropertyValue('--clipt-tour-safe-'+side))||0;
   const viewport={left:(vv?.offsetLeft??0)+inset('left'),top:(vv?.offsetTop??0)+inset('top'),width:(vv?.width||innerWidth)-inset('left')-inset('right'),height:(vv?.height||innerHeight)-inset('top')-inset('bottom')};
   const selectors=current.target.split(',').filter(Boolean);
   let target:HTMLElement|null=null;
   for(const selector of selectors){target=firstVisible(selector);if(target)break;}
   const own=Boolean(target);
   if(!target&&current.id==='post')target=firstVisible('[data-swipe-menu],.clipt-controller-home');
   if(!target&&current.target)target=firstVisible('.clipt-controller-more')??firstVisible('.clipt-controller-toggle');
   const controls=Array.from(document.querySelectorAll('.clipt-controller button,.clipt-controller-joystick,[data-swipe-menu],.clipt-feed-tabs [role="tab"],.clipt-fyp-header button')).filter(visible).map(rect);
   const placement=homeTourPlacement(viewport,controls,videoPixels(),Math.max(180,Math.ceil(parseFloat(cs.fontSize)*13)));
   const result={viewport,placement,target:target?rect(target):null,targetName:target?(own?'Highlighted control':current.id==='post'?'Open CLIPT → Post / Create':target.matches('.clipt-controller-more')?'Open All controller actions':'Show controls'): '',
    portrait:Boolean(firstVisible('[data-swipe-menu]')),postVisible:Boolean(firstVisible('.clipt-controller-post')),blocked:panelOpen(),disabled:target instanceof HTMLButtonElement&&target.disabled};
   setLayout(old=>JSON.stringify(old)===JSON.stringify(result)?old:result);
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;measure();});};
  const observer=new MutationObserver(records=>{
   if(records.every(r=>r.target instanceof Element&&r.target.closest('[data-clipt-feed-tour],[data-home-tour-highlight]')))return;
   if(records.some(r=>r.type==='childList'||r.target===document.documentElement||r.target instanceof Element&&r.target.matches('.clipt-controller,[role="dialog"],[data-sliding-panel]')))schedule();
  });
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['data-hand','data-layout','data-hidden','data-expanded','data-portrait-viewing','data-state','class','style']});
  const size=new ResizeObserver(schedule);size.observe(document.documentElement);
  if(card.current)size.observe(card.current);
  window.addEventListener('resize',schedule);window.addEventListener('orientationchange',schedule);window.visualViewport?.addEventListener('resize',schedule);window.visualViewport?.addEventListener('scroll',schedule);
  measure();
  return()=>{cancelAnimationFrame(frame);observer.disconnect();size.disconnect();window.removeEventListener('resize',schedule);window.removeEventListener('orientationchange',schedule);window.visualViewport?.removeEventListener('resize',schedule);window.visualViewport?.removeEventListener('scroll',schedule);};
 },[watch,step]);

 useEffect(()=>{
  if(!ready||!layout||layout.blocked||checked&&!replay)return;
  setChecked(true);
  if(!replay&&hasSeenHomeTour(userId,storage()))return;
  previousFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  rememberHomeTour(userId,'seen',storage());focusAssigned.current=false;setStep(0);setExpanded(false);setOpen(true);
  if(replay){const next=new URLSearchParams(params);next.delete('tour');setParams(next,{replace:true});}
 },[userId,ready,layout?.blocked,Boolean(layout),checked,replay,params,setParams]);

 useEffect(()=>{
  const sync=(event:StorageEvent)=>{if(event.key===homeTourKey(userId)&&event.newValue){setOpen(false);setChecked(true);}};
  window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);
 },[userId]);

 function finish(outcome:'skipped'|'completed'){
  rememberHomeTour(userId,outcome,storage());setOpen(false);
  requestAnimationFrame(()=>{const old=previousFocus.current;if(old?.isConnected&&old!==document.body&&old!==document.documentElement&&!old.closest('[data-clipt-feed-tour]'))old.focus({preventScroll:true});else firstVisible('[data-swipe-menu],.clipt-controller-home')?.focus({preventScroll:true});});
 }
 useEffect(()=>{
  if(!open||layout?.blocked||!ready)return;
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!event.defaultPrevented&&!panelOpen()){event.preventDefault();finish('skipped');}};
  document.addEventListener('keydown',escape);
  return()=>document.removeEventListener('keydown',escape);
 },[open,layout?.blocked,ready,userId]);
 useEffect(()=>{
  if(!open||layout?.blocked||!ready||step!==0||focusAssigned.current)return;
  const frame=requestAnimationFrame(()=>{if(!panelOpen()&&nextButton.current){nextButton.current.focus({preventScroll:true});focusAssigned.current=true;}});
  return()=>cancelAnimationFrame(frame);
 },[open,layout?.blocked,ready,step]);

 if(!open||!layout||layout.blocked||!ready)return null;
 const p=layout.placement,compact=p.compact&&!expanded;
 const full=expanded&&p.compact;
 const style={left:full?layout.viewport.left+12:p.left,top:full?layout.viewport.top+12:p.top,width:p.width,maxHeight:full?Math.max(88,layout.viewport.height-24):p.maxHeight,'--tour-accent':current.color} as CSSProperties;
 const body=current.id==='browse'?(layout.portrait?'Swipe up for the next Clipt, or down for the previous one, inside the bottom CLIPT pad. Tap the pad to open navigation.':'Move the joystick left or right to browse Clipts. When the feed has keyboard focus, its arrow keys also move between clips.'):
  current.id==='post'?(layout.postVisible?'Tap the camera button to create a post. '+current.body:'Open CLIPT → Post / Create. '+current.body):current.body;
 const target=layout.target;
 return createPortal(<>
  {target&&!compact&&<div data-home-tour-highlight className="clipt-home-tour-highlight" aria-hidden="true" style={{left:Math.max(layout.viewport.left,target.left-3),top:Math.max(layout.viewport.top,target.top-3),width:Math.min(layout.viewport.left+layout.viewport.width,target.right+3)-Math.max(layout.viewport.left,target.left-3),height:Math.min(layout.viewport.top+layout.viewport.height,target.bottom+3)-Math.max(layout.viewport.top,target.top-3),'--tour-accent':current.color} as CSSProperties}/>}
  <aside ref={card} data-clipt-feed-tour data-step={current.id} data-compact={compact} className="clipt-home-tour" role="region" aria-label="CLIPT home tutorial" style={style}>
   {compact?<><button type="button" onClick={()=>setExpanded(true)}>Open tutorial</button><button type="button" onClick={()=>finish('skipped')}>Skip</button></>:<>
   <header><p aria-live="polite">Step {step+1} of {HOME_TOUR_STEPS.length}</p><button type="button" onClick={()=>finish('skipped')}>Skip</button></header>
   <div className="clipt-home-tour-body" tabIndex={0} aria-label="Tutorial instructions">
    <h2>{current.title}</h2><p>{body}</p>
    {target&&<p className="clipt-home-tour-target">{layout.targetName}</p>}
    {layout.disabled&&<p className="clipt-home-tour-note">Post actions become available when a Clipt is on screen.</p>}
    {full&&<button type="button" onClick={()=>setExpanded(false)}>Collapse tutorial</button>}
   </div>
   <footer><button type="button" disabled={step===0} onClick={()=>setStep(i=>Math.max(0,i-1))}>Back</button>
    <button ref={nextButton} type="button" onClick={()=>step===HOME_TOUR_STEPS.length-1?finish('completed'):setStep(i=>i+1)}>{step===0?'Start tutorial':step===HOME_TOUR_STEPS.length-1?'Finish':'Next'}</button>
   </footer></>}
  </aside>
 </>,document.body);
}
