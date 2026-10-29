import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import * as clipCarouselScroll from '../../src/lib/clip-carousel-scroll.ts';
const require=createRequire(import.meta.url);
const read=path=>readFileSync(new URL('../../src/'+path,import.meta.url),'utf8');
function walk(node,predicate){
  if(!node||typeof node!=='object')return null;
  if(predicate(node))return node;
  for(const child of React.Children.toArray(node.props?.children)){const hit=walk(child,predicate);if(hit)return hit;}
  return null;
}
test('one feed-owned comment dock follows a sideways slide without closing or retaining old metadata',()=>{
  const values=[],refs=[],effects=[];let slot=0,refSlot=0;
  const Dialog=()=>null,Hud=()=>null,Post=()=>null;
  const rows=[{id:'first',content:'First caption',profiles:{username:'one'}},{id:'second',content:'Second caption',profiles:{username:'two'}}];
  const deps={
    '@/lib/publishing-status':{publishingSnapshot:()=>null,subscribePublishing:()=>()=>{}},
    react:{...React,useState:initial=>{const index=slot++;if(!(index in values))values[index]=initial;return [values[index],value=>{values[index]=typeof value==='function'?value(values[index]):value;}];},useEffect:fn=>effects.push(fn),useRef:initial=>{const index=refSlot++;return refs[index]??(refs[index]={current:initial});}},
    '@tanstack/react-query':{useQuery:()=>({isSuccess:true,data:[]}),useInfiniteQuery:()=>({data:{pages:[rows]},isPending:false})},
    '@/contexts/AuthContext':{useAuth:()=>({user:null})},'@/lib/supabase':{supabase:{}},
    '@/components/ui/tabs':{Tabs:()=>null,TabsList:()=>null,TabsTrigger:()=>null},'@/components/ui/button':{Button:()=>null},
    '@/components/ui/dialog':{Dialog},'@/components/post/EngagementHud':{EngagementHud:Hud},
    '@/hooks/usePortraitSwipe':{usePortraitSwipe:()=>({current:null})},
    '@/components/PostItem':{default:Post,__esModule:true},'react-router-dom':{Link:()=>null,useSearchParams:()=>[new URLSearchParams(),()=>{}]},'./clipt-console.css':{},'./clipt-feed-surface.css':{},'./clipt-channels.css':{},'@/lib/channel-feeds':{validChannelGame:()=>true},'@/lib/clip-carousel-scroll':clipCarouselScroll,
  };
  const output=ts.transpileModule(read('pages/Clipts.tsx'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  deps.react.useSyncExternalStore=()=>null;
  const mod={exports:{}};new Function('require','module','exports',output)(name=>deps[name]??require(name),mod,mod.exports);
  const render=()=>{slot=0;refSlot=0;return mod.exports.default();};
  let tree=render();const first=walk(tree,n=>n.type===Post);assert.ok(first,JSON.stringify(tree));first.props.onOpenEngagement();tree=render();
  assert.equal(walk(tree,n=>n.type===Dialog).props.open,true);
  assert.equal(walk(tree,n=>n.type===Hud).props.postId,'first');
  const track=walk(tree,n=>n.props?.['data-horizontal-feed']!==undefined);
  refs[0].current={clientWidth:300,getBoundingClientRect:()=>({left:0}),querySelectorAll:()=>rows.map((row,index)=>({dataset:{slideIndex:String(index)},getBoundingClientRect:()=>({left:(index-1)*300,width:300})}))};
  track.props.onScroll();tree=render();
  const hud=walk(tree,n=>n.type===Hud);
  assert.equal(hud.props.postId,'second');assert.equal(hud.props.username,'two');assert.equal(hud.props.caption,'Second caption');assert.equal(hud.props.followFeed,true);
  assert.equal(walk(tree,n=>n.type===Dialog).props.open,true);
  const previousWindow=globalThis.window;const handlers=new Map();
  try {
    globalThis.window={addEventListener:(name,fn)=>handlers.set(name,fn),removeEventListener:name=>handlers.delete(name)};
    const cleanup=effects[0]();handlers.get('clipt:toggle-feed')();
    assert.equal(render().props['data-feed'],'squad');handlers.get('clipt:toggle-feed')();
    assert.equal(render().props['data-feed'],'clipts');cleanup();assert.equal(handlers.size,0);
  } finally {globalThis.window=previousWindow;}
});
test('dock retains native vertical scrolling and video pane has no landscape metadata overlays',()=>{
  const css=read('pages/clipt-console.css'),hud=read('components/post/EngagementHud.tsx');
  assert.match(css,/touch-action: pan-y pinch-zoom; scrollbar-gutter: stable; -webkit-overflow-scrolling: touch/);
  assert.match(css,/touch-action: pan-x pan-y pinch-zoom/);
  assert.match(css,/\.clipt-fyp \.clipt-cinematic-header,[\s\S]*display: none/);
  assert.match(css,/body:has\(\.clipt-engagement-hud\[role="dialog"\]\) \.clipt-fyp \.clipt-cinematic-media \{ height: 100%; bottom: 0/);
  assert.match(hud,/followFeed && target.closest\('\.clipt-fyp-track'\)/);
  assert.match(hud,/<CommentList key=\{postId\}/);
  assert.match(hud,/className="clipt-comment-author"/);assert.match(hud,/className="clipt-comment-caption"/);
});
