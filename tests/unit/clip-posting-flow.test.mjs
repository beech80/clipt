import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
const require=createRequire(import.meta.url);
function load(path,deps) {
  const output=ts.transpileModule(readFileSync(new URL('../../src/'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const mod={exports:{}};new Function('require','module','exports',output)(name=>deps[name]??require(name),mod,mod.exports);return mod.exports;
}
const clipTools=load('lib/clip-upload.ts',{});
const ERROR_STATE=11, UNCERTAIN_STATE=12;
function harness({destination='clipts',draftId=null,draft=null,uploadError=null,postError=null,status=201,capability=true,kind='video',authenticated=true,caption='Real caption',reward=()=>Promise.resolve({})}={}) {
  let stateIndex=0,queryIndex=0;
  const calls=[],states=[],notices=[],jobs=[];
  const user={id:'disposable-owner'};
  const file=draft?null:new File(['fixture'],kind==='photo'?'fixture.jpg':'fixture.mp4',{type:kind==='photo'?'image/jpeg':'video/mp4'});
  const values=[destination,file,'',caption,'#gaming','game-id','','idle',true,null,false,'',false,kind];
  const builder={insert(value){calls.push(['insert',value]);return this;},update(value){calls.push(['update',value]);return this;},eq(key,value){calls.push(['eq',key,value]);return this;},select(){return this;},retry(){return this;},async single(){return {data:postError?null:{id:'confirmed-post'},error:postError,status};}};
  const deps={
    react:{...React,useSyncExternalStore:()=>null,useState:initial=>{const index=stateIndex++;return [values[index]??initial,value=>states.push([index,value])];},useEffect:()=>{},useRef:value=>({current:value})},
    '@/lib/publishing-status':{beginPublishing:()=> 'fixture-job',publishingBlocked:()=>false,publishingUncertain:()=>false,updatePublishing:(id,patch)=>jobs.push(patch),subscribePublishing:()=>()=>{},publishingSnapshot:()=>null},
    'react-router-dom':{useNavigate:()=>url=>calls.push(['navigate',url]),useSearchParams:()=>[new URLSearchParams(draftId?{draft:draftId}:{})],Link:()=>null},
    '@tanstack/react-query':{useQuery:()=>[{data:draft,isSuccess:Boolean(draft)},{data:capability},{data:[]}][queryIndex++],useQueryClient:()=>({invalidateQueries:async args=>calls.push(['invalidate',args.queryKey[0]])})},
    '@/contexts/AuthContext':{useAuth:()=>({user})},
    '@/hooks/usePrivateMedia':{usePrivateMediaUrl:()=>({src:draft?.video_url})},
    '@/lib/game-catalog':{completeGameCatalog:()=>[]},
    '@/lib/supabase':{supabase:{auth:{getUser:async()=>({data:{user:authenticated?user:null}})},from:()=>builder,storage:{from:()=>({upload:async(path)=>{calls.push(['upload',path]);return {error:uploadError};},getPublicUrl:path=>({data:{publicUrl:'https://development.example/storage/v1/object/public/media/'+path}}),remove:async paths=>{calls.push(['cleanup',paths]);return {error:null};}})}}},
    '@/lib/photo-upload':{preparePhoto:()=>{},photoUploadError:()=> 'Photo upload denied; no new draft was saved.'},
    '@/lib/community-text':load('lib/community-text.ts',{}),
    '@/lib/clip-upload':clipTools,'@/lib/prepare-clip':{prepareClipFile:async file=>file},'@/lib/clip-reward':{checkClipReward:()=>{calls.push(['reward']);return reward();},clipRewardMessage:()=> 'Reward not confirmed'},
    sonner:{toast:message=>notices.push(message)},
    '@/components/ui/button':{Button:()=>null},'@/components/ui/input':{Input:()=>null},'@/components/ui/textarea':{Textarea:()=>null},'@/components/ui/back-button':{BackButton:()=>null},
  };
  const tree=load('pages/NewPost.tsx',deps).default();
  const findForm=node=>{if(!node||typeof node!=='object')return null;if(node.type==='form')return node;for(const child of React.Children.toArray(node.props?.children)){const found=findForm(child);if(found)return found;}return null;};
  const form=findForm(tree);assert.ok(form);
  return {submit:()=>form.props.onSubmit({preventDefault(){}}),calls,states,notices,jobs};
}
test('saving a draft persists unpublished data and navigates only after server confirmation',async()=>{
  const h=harness({destination:'draft'});await h.submit();
  const inserted=h.calls.find(c=>c[0]==='insert')[1];
  assert.equal(inserted.is_published,false);assert.equal(inserted.post_type,'clipt');assert.equal(inserted.user_id,'disposable-owner');
  assert.deepEqual(h.calls.filter(c=>c[0]==='navigate'),[['navigate','/drafts']]);assert.equal(h.calls.filter(c=>c[0]==='reward').length,0);
  assert.match(h.notices[0],/Draft saved privately/);
});
test('rejected caption warns before photo/video upload and never invents a saved draft',async()=>{
  for(const kind of ['photo','video']) {
    const h=harness({kind,caption:'sh1t'});await h.submit();assert.deepEqual(h.calls,[]);
    assert.match(h.states.find(state=>state[0]===ERROR_STATE)[1],/Keep Clipt positive/);assert.deepEqual(h.notices,[]);
  }
});
test('draft publishing reuses signed private media reference and owner-scoped update',async()=>{
  const h=harness({draftId:'owned-draft',draft:{id:'owned-draft',video_url:'https://development.example/storage/v1/object/public/media/disposable-owner/saved.mp4'}});await h.submit();
  assert.equal(h.calls.filter(c=>c[0]==='upload').length,0);
  assert.equal(h.calls.find(c=>c[0]==='update')[1].is_published,true);
  for(const pair of [['eq','id','owned-draft'],['eq','user_id','disposable-owner'],['eq','is_published',false]])assert.ok(h.calls.some(c=>JSON.stringify(c)===JSON.stringify(pair)));
  assert.deepEqual(h.calls.filter(c=>c[0]==='navigate'),[['navigate','/clipts']]);
  assert.ok(h.jobs.some(job=>job.stage==='complete'&&job.postId==='confirmed-post'));
});
test('Squad privacy capability denial produces no uploads, writes or public fallback',async()=>{
  const h=harness({destination:'squad',capability:false});await h.submit();assert.deepEqual(h.calls,[]);assert.match(h.states.find(s=>s[0]===ERROR_STATE)[1],/Nothing was posted/);
});
test('confirmed Squad posts use distinct type and never request public clip rewards',async()=>{
  const h=harness({destination:'squad'});await h.submit();assert.equal(h.calls.find(c=>c[0]==='insert')[1].post_type,'squad');assert.equal(h.calls.filter(c=>c[0]==='reward').length,0);
});
test('upload denial never inserts a post or falsely announces a saved draft',async()=>{
  const h=harness({uploadError:{statusCode:403}});await h.submit();assert.equal(h.calls.filter(c=>c[0]==='insert').length,0);assert.deepEqual(h.notices,[]);assert.match(h.states.filter(s=>s[0]===ERROR_STATE).at(-1)[1],/no new draft was saved/);
});
test('uncertain publishing retains uploaded bytes and blocks false success',async()=>{
  const h=harness({postError:{message:'lost response'},status:503});await h.submit();assert.equal(h.calls.filter(c=>c[0]==='cleanup').length,0);assert.deepEqual(h.calls.filter(c=>c[0]==='navigate'),[['navigate','/clipts']]);assert.ok(h.states.some(s=>s[0]===UNCERTAIN_STATE&&s[1]===true));assert.ok(h.jobs.some(job=>job.uncertain===true));assert.deepEqual(h.notices,[]);
});
test('definitively rejected insert cleans only its new unused upload',async()=>{
  const h=harness({postError:{message:'denied'},status:403});await h.submit();assert.equal(h.calls.filter(c=>c[0]==='cleanup').length,1);assert.deepEqual(h.calls.filter(c=>c[0]==='navigate'),[['navigate','/clipts']]);assert.equal(h.jobs.at(-1).stage,'error');assert.deepEqual(h.notices,[]);
});

test('photo posts reuse owner-scoped media storage and confirmed post persistence without video rewards',async()=>{
  const h=harness({kind:'photo'});await h.submit();
  const value=h.calls.find(c=>c[0]==='insert')[1];
  assert.equal(value.video_url,null);assert.match(value.image_url,/\/disposable-owner\/.+\.jpg$/);
  assert.equal(value.post_type,'clipt');assert.equal(value.is_published,true);
  assert.equal(h.calls.filter(c=>c[0]==='reward').length,0);
  assert.deepEqual(h.calls.filter(c=>c[0]==='navigate'),[['navigate','/clipts']]);
  assert.ok(h.calls.findIndex(c=>c[0]==='navigate')<h.calls.findIndex(c=>c[0]==='upload'));
});
test('private photo draft publishing reuses its locator and preserves owner-only update guards',async()=>{
  const h=harness({kind:'photo',draftId:'photo-draft',draft:{id:'photo-draft',image_url:'https://development.example/storage/v1/object/public/media/disposable-owner/saved.jpg'}});await h.submit();
  assert.equal(h.calls.filter(c=>c[0]==='upload').length,0);
  assert.match(h.calls.find(c=>c[0]==='update')[1].image_url,/saved.jpg$/);
  assert.ok(h.calls.some(c=>c[0]==='eq'&&c[1]==='is_published'&&c[2]===false));
});
test('photo uploads require fresh authentication and rejected writes never announce success',async()=>{
  const h=harness({kind:'photo',authenticated:false});await h.submit();assert.deepEqual(h.calls,[]);assert.deepEqual(h.notices,[]);
  const denied=harness({kind:'photo',uploadError:{statusCode:403}});await denied.submit();assert.equal(denied.calls.filter(c=>c[0]==='insert').length,0);assert.deepEqual(denied.notices,[]);
});

test('confirmed publication completes while its separate reward request is still pending',async()=>{
 const h=harness({reward:()=>new Promise(()=>{})});await h.submit();
 assert.ok(h.jobs.some(job=>job.stage==='complete'&&job.postId==='confirmed-post'));
 assert.ok(h.calls.some(call=>call[0]==='invalidate'&&call[1]==='clipts-feed'));
 assert.ok(h.calls.some(call=>call[0]==='reward'));assert.equal(h.jobs.some(job=>job.stage==='error'),false);
});
test('reward failure does not reverse a confirmed post or delete its video',async()=>{
 const h=harness({reward:()=>Promise.reject(new Error('reward service unavailable'))});
 await h.submit();await new Promise(resolve=>setImmediate(resolve));
 assert.ok(h.jobs.some(job=>job.stage==='complete'));assert.equal(h.jobs.some(job=>job.stage==='error'),false);
 assert.equal(h.calls.some(call=>call[0]==='cleanup'),false);assert.ok(h.notices.some(notice=>/published/i.test(notice)));
});

test('a missing or whitespace caption is explained before uploads or publication jobs',async()=>{
  for(const caption of ['', '   ']) {
    const h=harness({caption});await h.submit();assert.deepEqual(h.calls,[]);assert.deepEqual(h.jobs,[]);
    assert.ok(h.states.some(([index,value])=>index===14&&value==='Add a caption before posting.'));
  }
});
