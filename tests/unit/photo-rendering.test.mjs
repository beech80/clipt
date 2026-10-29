import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import * as clipCarouselScroll from '../../src/lib/clip-carousel-scroll.ts';
const require=createRequire(import.meta.url);
test('all collage sizes report real image loading and failure to the parent',()=>{
  const Collage=load('components/post/PhotoCollage.tsx',{});
  for(const size of [1,2,3,4,5]) {
    let loaded=0,failed=0;
    const tree=Collage({images:Array.from({length:size},(_,i)=>`photo-${i}`),onImageLoad:()=>loaded++,onImageError:()=>failed++});
    const image=find(tree,'img');
    image.props.onLoad(); image.props.onError();
    assert.equal(loaded,1); assert.equal(failed,1);
  }
});
test('photo retry reloads an unchanged authorized URL only after successful access refresh',async()=>{
  for (const denied of [false,true]) {
    let index=0; const updates=[];
    const values=[false,true,null,['owned-photo'],0,false,false,false,0];
    const Component=load('components/post/PostContent.tsx',{
      react:{...React,useState:initial=>{const slot=index++;return [values[slot]??initial,value=>updates.push({slot,value})];},useEffect:()=>{},useRef:initial=>({current:initial})},
      '@tanstack/react-query':{useQuery:()=>({isPending:false})},'@/lib/supabase':{supabase:{}},
      '@/components/ui/badge':{Badge:()=>null},'./PhotoCollage':{default:()=>null,__esModule:true},
      '@/components/ui/dialog':{Dialog:()=>null,DialogContent:()=>null,DialogTitle:()=>null,DialogDescription:()=>null},
      '@/hooks/usePrivateMedia':{usePrivateMediaUrl:()=>({}),usePrivateMediaUrls:()=>[{src:'same-authorized-url',retry:async()=>({isError:denied})}]},
      '@/lib/post-image-references':{postImageReferences:()=>['owned-photo']},
    });
    const tree=Component({postId:'photo',imageUrl:'owned-photo'});
    assert.match(find(tree,'img').key,/same-authorized-url=20$/);
    function retryButton(node) {
      if(!node||typeof node!=='object')return null;
      if(node.type==='button'&&node.props.children==='Retry media')return node;
      for(const child of React.Children.toArray(node.props?.children)){const result=retryButton(child);if(result)return result;}
      return null;
    }
    await retryButton(tree).props.onClick();
    // onClick deliberately starts the async retry without exposing its promise.
    await new Promise(resolve=>setImmediate(resolve));
    const revision=updates.find(update=>update.slot===8);
    if(denied) assert.equal(revision,undefined);
    else {assert.equal(revision.value(0),1);assert.ok(updates.some(update=>update.slot===1&&update.value===false));}
  }
});
function load(path,deps) {
  const source=ts.transpileModule(readFileSync(new URL('../../src/'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const imports={'./clipt-feed-surface.css':{},'./clipt-channels.css':{},'@/lib/game-catalog':{gameChannel:async()=>null},'@/components/GameChannelToolbar':{GameChannelToolbar:()=>null},'@/lib/channel-feeds':{validChannelGame:()=>true},'@/lib/clip-carousel-scroll':clipCarouselScroll,'@/lib/publishing-status':{publishingSnapshot:()=>null,subscribePublishing:()=>()=>{}},...deps};
  if(imports.react)imports.react={...imports.react,useSyncExternalStore:()=>null};
  const mod={exports:{}};new Function('require','module','exports',source)(name=>imports[name]??require(name),mod,mod.exports);return mod.exports.default;
}
function find(node,type) {if(!node||typeof node!=='object')return null;if(node.type===type)return node;for(const child of React.Children.toArray(node.props?.children)){const found=find(child,type);if(found)return found;}return null;}
test('cinematic photos remain inline and every album image stays reachable without fullscreen',()=>{
  for(const count of [1,5]){
    let index=0;const updates=[],values=[true,false,null,Array.from({length:count},(_,i)=>'owned-'+i),0,count>1,true,false,0];
    const Component=load('components/post/PostContent.tsx',{
      react:{...React,useState:initial=>{const slot=index++;return [values[slot]??initial,value=>updates.push({slot,value})];},useEffect(){},useRef:initial=>({current:initial})},
      '@tanstack/react-query':{useQuery:()=>({isPending:false})},'@/lib/supabase':{supabase:{}},
      '@/components/ui/badge':{Badge:()=>null},'./PhotoCollage':{default:()=>null,__esModule:true},
      '@/components/ui/dialog':{Dialog:()=>null,DialogContent:()=>null,DialogTitle:()=>null,DialogDescription:()=>null},
      '@/hooks/usePrivateMedia':{usePrivateMediaUrl:()=>({}),usePrivateMediaUrls:()=>Array.from({length:count},(_,i)=>({src:'authorized-'+i}))},
      '@/lib/post-image-references':{postImageReferences:()=>[]},
    });
    const tree=Component({postId:'photo',imageUrl:'owned',allowFullscreen:false});
    assert.equal(find(tree,'img').props.src,'authorized-0');
    const buttons=[];const visit=node=>{if(!node||typeof node!=='object')return;if(node.type==='button')buttons.push(node);React.Children.toArray(node.props?.children).forEach(visit);};visit(tree);
    assert.equal(buttons.length,count>1?2:0,'no expansion trigger');
    if(count>1){buttons.find(b=>b.props['aria-label']==='Next image').props.onClick();const advance=updates.find(u=>u.slot===4).value;assert.equal(advance(0),1);assert.equal(advance(4),0);}
  }
  assert.match(readFileSync(new URL('../../src/components/PostItem.tsx',import.meta.url),'utf8'),/allowFullscreen=\{!cinematic\}/);
});
test('photo renderer uses authorized source, contains original ratio and does not add competing swipe controls',()=>{
  let index=0,query;
  const values=[true,false,null,['owned-photo'],0,false,false,false];
  const Component=load('components/post/PostContent.tsx',{
    react:{...React,useState:initial=>[values[index++]??initial,()=>{}],useEffect:()=>{},useRef:initial=>({current:initial})},
    '@tanstack/react-query':{useQuery:options=>{query=options;return {isPending:false};}},'@/lib/supabase':{supabase:{}},
    '@/components/ui/badge':{Badge:()=>null},'./PhotoCollage':{default:()=>null,__esModule:true},
    '@/components/ui/dialog':{Dialog:()=>null,DialogContent:()=>null,DialogTitle:()=>null},
    '@/hooks/usePrivateMedia':{usePrivateMediaUrl:()=>({}),usePrivateMediaUrls:()=>[{src:'caller-authorized-signed-photo'}]},
    '@/lib/post-image-references':{postImageReferences:()=>['owned-photo']},
  });
  const tree=Component({postId:'photo-post',imageUrl:'owned-photo',frameAspectRatio:'16 / 19'});
  const image=find(tree,'img'),button=find(tree,'button');
  assert.equal(image.props.src,'caller-authorized-signed-photo');assert.match(image.props.className,/object-contain/);
  assert.equal(button.props.style.aspectRatio,'16 / 19');assert.equal(button.props.onTouchMove,undefined);assert.equal(query.enabled,false);
  assert.equal(find(tree,'video'),null);
});
test('horizontal FYP reads photos and videos with one combined public/Squad media filter',async()=>{
  let query,state=0;const filters=[];
  const builder={select(){return this;},or(value){filters.push(value);return this;},eq(){return this;},order(){return this;},range(){return this;},async retry(){return {data:[],error:null};}};
  const Component=load('pages/Clipts.tsx',{
    react:{...React,useState:initial=>[state++===0?'clipts':initial,()=>{}],useEffect:()=>{},useRef:initial=>({current:initial})},
    '@tanstack/react-query':{useQuery:()=>({data:[]}),useInfiniteQuery:options=>{query=options;return {data:{pages:[]},isPending:false};}},
    '@/lib/supabase':{supabase:{from:()=>builder}},'@/contexts/AuthContext':{useAuth:()=>({user:{id:'viewer'}})},
    '@/components/ui/tabs':{Tabs:()=>null,TabsList:()=>null,TabsTrigger:()=>null},'@/components/ui/button':{Button:()=>null},
    '@/components/ui/dialog':{Dialog:()=>null},'@/components/post/EngagementHud':{EngagementHud:()=>null},
    '@/hooks/usePortraitSwipe':{usePortraitSwipe:()=>({current:null})},
    '@/components/PostItem':{default:()=>null,__esModule:true},'react-router-dom':{Link:()=>null,useSearchParams:()=>[new URLSearchParams(),()=>{}],useNavigate:()=>()=>{}},'./clipt-console.css':{},
  });
  Component();await query.queryFn({pageParam:0});
  assert.equal(filters.length,1);assert.match(filters[0],/image_url.not.is.null/);assert.match(filters[0],/video_url.not.is.null/);assert.match(filters[0],/post_type.neq.squad/);
});

test('fullscreen photo failure has retry inside dialog and keyboard gallery navigation',()=>{
  let index=0; const updates=[];
  const values=[false,true,null,['photo-one','photo-two'],0,true,true,false];
  const DialogContent=()=>null;
  const Component=load('components/post/PostContent.tsx',{
    react:{...React,useState:initial=>[values[index++]??initial,value=>updates.push(value)],useEffect:()=>{},useRef:initial=>({current:initial})},
    '@tanstack/react-query':{useQuery:()=>({isPending:false})},'@/lib/supabase':{supabase:{}},
    '@/components/ui/badge':{Badge:()=>null},'./PhotoCollage':{default:()=>null,__esModule:true},
    '@/components/ui/dialog':{Dialog:()=>null,DialogContent,DialogTitle:()=>null,DialogDescription:()=>null},
    '@/hooks/usePrivateMedia':{usePrivateMediaUrl:()=>({}),usePrivateMediaUrls:()=>[{src:'signed-one'},{src:'signed-two'}]},
    '@/lib/post-image-references':{postImageReferences:()=>['photo-one','photo-two']},
  });
  const dialog=find(Component({postId:'photo',imageUrl:'photo-one'}),DialogContent);
  assert.ok(dialog); const retry=find(dialog,'button'); assert.equal(retry.props.children,'Retry media');
  let prevented=false,stopped=false;
  dialog.props.onKeyDown({key:'ArrowRight',preventDefault:()=>{prevented=true;},stopPropagation:()=>{stopped=true;}});
  assert.ok(prevented && stopped);assert.ok(updates.includes(false));assert.ok(updates.some(value=>typeof value==='function'));
  assert.match(find(dialog,'img').props.className,/h-full w-full.*object-contain/);
});
