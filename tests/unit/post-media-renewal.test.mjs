import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';

test('renewed playback URLs clear stale media errors without losing the saved playback position',()=>{
  const require=createRequire(import.meta.url);
  const effects=[],refs=[],states=[true,true,4,[],0,false,false,false];
  let stateIndex=0,refIndex=0;
  const deps={
    react:{...React,useState:initial=>{const index=stateIndex++;return [states[index]??initial,value=>{states[index]=value;}];},useRef:initial=>refs[refIndex++]??(refs[refIndex-1]={current:initial}),useEffect:(fn,dependencies)=>effects.push({fn,dependencies})},
    '@tanstack/react-query':{useQuery:()=>({data:null,isPending:false})},
    '@/lib/supabase':{supabase:{}},'@/components/ui/badge':{Badge:()=>null},'./PhotoCollage':{__esModule:true,default:()=>null},
    '@/components/ui/dialog':{Dialog:()=>null,DialogContent:()=>null,DialogTitle:()=>null},
    '@/hooks/usePrivateMedia':{usePrivateMediaUrl:()=>({src:'renewed-private-source',isLoading:false}),usePrivateMediaUrls:()=>[]},
    '@/lib/post-image-references':{postImageReferences:()=>[]},
  };
  const code=ts.transpileModule(readFileSync(new URL('../../src/components/post/PostContent.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const mod={exports:{}};new Function('require','module','exports',code)(name=>deps[name]??require(name),mod,mod.exports);
  const props={postId:'actual-post',videoUrl:'owned-media-reference',frameAspectRatio:'16 / 19'};
  mod.exports.default(props);
  refs[0].current=5;
  const renewal=effects.find(effect=>effect.dependencies[0]==='renewed-private-source');
  assert.ok(renewal);renewal.fn();assert.deepEqual(states.slice(0,3),[false,false,null]);assert.equal(refs[0].current,5);
  stateIndex=0;refIndex=0;
  const tree=mod.exports.default(props);
  const findVideo=node=>{if(!node||typeof node!=='object')return null;if(node.type==='video')return node;for(const child of React.Children.toArray(node.props?.children)){const found=findVideo(child);if(found)return found;}return null;};
  const video=findVideo(tree);assert.ok(video);assert.equal(video.props.controls,true);assert.equal(video.props.playsInline,true);
  const element={currentTime:0,duration:20};video.props.onLoadedMetadata({currentTarget:element});assert.equal(element.currentTime,5);
});

test('a pending optional rendition lookup does not block an authorized original video',()=>{
  const require=createRequire(import.meta.url);
  const deps={
    react:{...React,useState:initial=>[initial,()=>{}],useRef:initial=>({current:initial}),useEffect(){}},
    '@tanstack/react-query':{useQuery:()=>({data:null,isPending:true})},
    '@/lib/supabase':{supabase:{}},'@/components/ui/badge':{},'./PhotoCollage':{},
    '@/components/ui/dialog':{},'@/lib/post-image-references':{postImageReferences:()=>[]},
    '@/hooks/usePrivateMedia':{usePrivateMediaUrl:()=>({src:'authorized-original',isLoading:false}),usePrivateMediaUrls:()=>[]},
  };
  const code=ts.transpileModule(readFileSync(new URL('../../src/components/post/PostContent.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const mod={exports:{}};new Function('require','module','exports',code)(name=>deps[name]??require(name),mod,mod.exports);
  const tree=mod.exports.default({postId:'actual-post',videoUrl:'owned-original'});
  const visit=node=>{if(!node||typeof node!=='object')return null;if(node.type==='video')return node;for(const child of React.Children.toArray(node.props?.children)){const found=visit(child);if(found)return found;}return null;};
  const video=visit(tree);assert.ok(video);assert.equal(video.props.src,'authorized-original');
});
