import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {profileWebsite} from '../../src/lib/profile-website.ts';
import {avatarUploadTarget,prepareAvatar} from '../../src/lib/avatar-upload.ts';
import * as hashtags from '../../src/utils/hashtagUtils.ts';

const require=createRequire(import.meta.url);
const Link=({to,children,...props})=>React.createElement('a',{href:to,...props},children);
function load(path,deps={}) {
  const code=ts.transpileModule(readFileSync(new URL('../../src/'+path,import.meta.url),'utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}
  }).outputText;
  const mod={exports:{}};
  new Function('require','module','exports',code)(name=>deps[name]??require(name),mod,mod.exports);
  return mod.exports;
}
test('profile websites normalize bare domains and reject active or credential-bearing links',()=>{
  assert.equal(profileWebsite(' cliptgaming.com '),'https://cliptgaming.com/');
  assert.equal(profileWebsite('https://example.com/player?q=1'),'https://example.com/player?q=1');
  for(const value of ['',null,'javascript:alert(1)','data:text/html,test','https://user:pass@example.com','not a URL','https://example.com/\nattack'])assert.equal(profileWebsite(value),null);
  const Website=load('components/profile/ProfileWebsite.tsx',{'@/lib/profile-website':{profileWebsite}}).default;
  const html=renderToStaticMarkup(React.createElement(Website,{value:'cliptgaming.com'}));
  assert.match(html,/href="https:\/\/cliptgaming.com\/"/);
  assert.match(html,/rel="noopener noreferrer"/);
  assert.equal(renderToStaticMarkup(React.createElement(Website,{value:'javascript:alert(1)'})),'');
});
test('Safari raster fallback uses the matching existing private bucket, MIME and extension',async()=>{
  const saved={document:globalThis.document,createImageBitmap:globalThis.createImageBitmap};
  const png=new Blob([new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0])],{type:'image/png'});
  let closed=0;
  try {
    globalThis.createImageBitmap=async()=>({width:2048,height:1024,close(){closed++;}});
    globalThis.document={createElement:()=>({getContext:()=>({drawImage(){}}),toBlob(callback,mime){assert.equal(mime,'image/webp');callback(png);}})};
    const prepared=await prepareAvatar(new File([png],'phone.png',{type:'image/png'}));
    assert.equal(prepared.type,'image/png');
    assert.deepEqual(avatarUploadTarget(prepared),{bucket:'avatars',extension:'png',contentType:'image/png'});
    assert.deepEqual(avatarUploadTarget(new Blob([],{type:'image/webp'})),{bucket:'clipt-avatars',extension:'webp',contentType:'image/webp'});
    assert.throws(()=>avatarUploadTarget(new Blob([],{type:'image/svg+xml'})));
    globalThis.document.createElement=()=>({getContext:()=>({drawImage(){}}),toBlob(callback){callback(new Blob(['not PNG'],{type:'image/png'}));}});
    await assert.rejects(()=>prepareAvatar(new File([png],'phone.png',{type:'image/png'})),/valid PNG/);
    assert.equal(closed,2);
  } finally {Object.assign(globalThis,saved);}
});
test('hashtags preserve Unicode text and exact token boundaries without injecting HTML',()=>{
  const text='Great #Gaming #gaming #café #ゲーム and word#ignored https://example.com/#fragment';
  assert.deepEqual(hashtags.extractHashtags(text),['gaming','café','ゲーム']);
  assert.equal(hashtags.hashtagParts(text).map(p=>p.text).join(''),text);
  assert.equal(hashtags.normalizeHashtag('a'.repeat(41)),null);
  assert.throws(()=>hashtags.hashtagSearchExpression('gaming|.*'));
  assert.throws(()=>hashtags.hashtagSearchExpression('gaming,content.eq.secret'));
  assert.ok(hashtags.hashtagSearchExpression('Gaming').includes('#gaming('));
  const Hashtag=load('components/post/HashtagText.tsx',{'react-router-dom':{Link},'@/utils/hashtagUtils':hashtags}).HashtagText;
  const html=renderToStaticMarkup(React.createElement(Hashtag,{text:'<img src=x onerror=alert(1)> #Gaming'}));
  assert.match(html,/href="\/hashtag\/gaming"/);
  assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img/);
});
test('game and hashtag discovery paginate caller-visible videos beyond the first thirty',async()=>{
  const rows=Array.from({length:51},(_,i)=>({id:String(i),content:'#gaming'}));
  const calls=[];let range;
  const builder={select(){return this;},eq(key,value){calls.push(['eq',key,value]);return this;},filter(key,operator,value){calls.push(['filter',key,operator,value]);return this;},order(){return this;},range(from,to){range=[from,to];return this;},abortSignal(){return this;},async retry(){return {data:rows.slice(range[0],range[1]+1),error:null};}};
  const feeds=load('lib/discovery-feeds.ts',{'@/lib/supabase':{supabase:{from:table=>{assert.equal(table,'public_clipt_discovery');return builder;}}},'@/utils/hashtagUtils':hashtags});
  const gameId='00000000-0000-4000-8000-000000000078';
  const first=await feeds.gameVideoFeed(gameId,0);const second=await feeds.gameVideoFeed(gameId,1);const last=await feeds.gameVideoFeed(gameId,2);
  assert.equal(first.more,true);assert.equal(second.more,true);assert.equal(last.more,false);
  assert.equal(new Set([...first.items,...second.items,...last.items].map(p=>p.id)).size,51);
  await feeds.hashtagFeed('Gaming',0);
  assert.ok(calls.some(c=>c[0]==='eq'&&c[1]==='game_id'&&c[2]===gameId));
  assert.ok(calls.some(c=>c[0]==='filter'&&c[2]==='imatch'&&c[3].includes('#gaming')));
  await assert.rejects(()=>feeds.gameVideoFeed('invalid',0));
  await assert.rejects(()=>feeds.hashtagFeed('gaming',-1));
});
test('profile game action is a sibling link and does not nest interactive anchors',()=>{
  const Tile=load('components/profile/ProfilePostTile.tsx',{'react-router-dom':{Link},'@/hooks/usePrivateMedia':{usePrivateMediaUrl:()=>({})},'@/lib/post-image-references':{postImageReferences:()=>[]}}).default;
  const html=renderToStaticMarkup(React.createElement(Tile,{post:{id:'post',content:'Caption',games:{id:'game',name:'Recorded game'}},likes:0,comments:0}));
  assert.match(html,/href="\/game\/game"[^>]*>Playing Recorded game/);
  assert.equal((html.match(/<a /g)||[]).length,2);
  assert.doesNotMatch(html,/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<a\b/);
});
