export const HOME_TOUR_VERSION=1;
export type TourOutcome='seen'|'skipped'|'completed';
const sessionSeen=new Set<string>();
export const homeTourKey=(userId:string)=>'clipt-home-controls-v1:'+userId;
export function hasSeenHomeTour(userId:string,storage:Pick<Storage,'getItem'>|null,session=sessionSeen){
 if(session.has(userId))return true;
 try{return ['seen','skipped','completed'].includes(storage?.getItem(homeTourKey(userId))??'');}catch{return false;}
}
export function rememberHomeTour(userId:string,outcome:TourOutcome,storage:Pick<Storage,'setItem'>|null,session=sessionSeen){
 session.add(userId);try{if(!storage)return false;storage.setItem(homeTourKey(userId),outcome);return true;}catch{return false;}
}
export const HOME_TOUR_STEPS=[
 {id:'welcome',title:'Welcome to CLIPT',body:'A quick guide to your home controls. Choose Start, or Skip whenever you like.',color:'#c084fc',target:''},
 {id:'browse',title:'Move between Clipts',body:'',color:'#c084fc',target:'.clipt-bottom-swipe-zone,.clipt-controller-joystick'},
 {id:'menu',title:'Your CLIPT menu',body:'Tap CLIPT to find Discovery, your profile, messages, Settings and Help. Buttons on other pages change to useful actions for that page.',color:'#c084fc',target:'[data-swipe-menu],.clipt-controller-home'},
 {id:'post',title:'Create a post',body:'Choose your video or photo, add a game and caption, then publish. Your upload progress appears on Home.',color:'#c084fc',target:'.clipt-controller-post'},
 {id:'like',title:'Like a Clipt',body:'The pink heart likes the current post. Tap it again to remove your Like.',color:'#f472b6',target:'.clipt-controller-like'},
 {id:'comment',title:'Open the conversation',body:'The blue comment button opens the creator’s full caption and comments. Read, reply or add your own comment.',color:'#22d3ee',target:'.clipt-controller-comment'},
 {id:'follow',title:'Meet the creator',body:'Tap the teal profile picture to open the current creator’s profile. Follow them there to see their posts in Squad.',color:'#2dd4bf',target:'.clipt-controller-follow'},
 {id:'trophy',title:'Give a Trophy',body:'The gold Trophy button helps rank eligible public videos. Trophy rankings are video-only.',color:'#facc15',target:'.clipt-controller-trophy'},
 {id:'feeds',title:'Choose your feed',body:'FYP shows the latest Clipts. Squad shows posts from creators you follow. Use Discovery to find games and their CLIPT Channels.',color:'#c084fc',target:'.clipt-portrait-feed-toggle,.clipt-feed-flip,.clipt-feed-tabs [role="tablist"]'},
 {id:'finish',title:'You’re ready',body:'Make the controls yours in Settings → Accessibility → Hand Preference. You can replay this tutorial from Help / User Guide.',color:'#c084fc',target:''}
] as const;
export type TourRect={left:number;top:number;right:number;bottom:number};
export type TourViewport={left:number;top:number;width:number;height:number};
export function rectanglesOverlap(a:TourRect,b:TourRect){return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;}
/** Place the compact guide in free space around actual controls, including mirrored layouts. */
export function homeTourPlacement(v:TourViewport,blocked:TourRect[],video?:TourRect|null,minCardHeight=180){
 const margin=12,left=v.left+margin,top=v.top+margin,right=v.left+v.width-margin,bottom=v.top+v.height-margin;
 const width=Math.max(44,Math.min(320,right-left));
 const candidates:{left:number;top:number;width:number;maxHeight:number;compact:boolean;score:number}[]=[];
 for(const x of new Set([left,Math.max(left,(left+right-width)/2),Math.max(left,right-width)])){
  const intervals=blocked.filter(r=>r.right+6>x&&r.left-6<x+width&&r.bottom>top&&r.top<bottom)
   .map(r=>({top:Math.max(top,r.top-6),bottom:Math.min(bottom,r.bottom+6)})).sort((a,b)=>a.top-b.top);
  let cursor=top;
  const add=(end:number)=>{const height=end-cursor;if(height<56)return;
   const shown=Math.min(260,height),area=video?Math.max(0,Math.min(x+width,video.right)-Math.max(x,video.left))*Math.max(0,Math.min(cursor+shown,video.bottom)-Math.max(cursor,video.top)):0;
   candidates.push({left:x,top:cursor,width,maxHeight:height,compact:height<minCardHeight,
    score:(height<minCardHeight?100000:Math.max(0,260-height)*100)+area/400+(cursor-top)*.05+(x-left)*.01});};
  for(const r of intervals){if(r.top>cursor)add(r.top);cursor=Math.max(cursor,r.bottom);}
  if(cursor<bottom)add(bottom);
 }
 const best=candidates.sort((a,b)=>a.score-b.score)[0];
 return best??{left,top,width,maxHeight:Math.max(44,bottom-top),compact:true,score:0};
}
