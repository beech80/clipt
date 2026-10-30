import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

// Render the actual player component. Child chrome is replaced only in this
// isolated unit test; these assertions do not verify ingest or provider playback.
const require=createRequire(import.meta.url);
const output=ts.transpileModule(readFileSync(new URL('../../src/components/streaming/StreamPlayer.tsx',import.meta.url),'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}
}).outputText;
const mod={exports:{}};
const localRequire=name=>{
  if(name==='@/contexts/AuthContext')return {useAuth:()=>({user:null})};
  if(name==='@tanstack/react-query')return {useQuery:()=>({data:undefined,isError:false})};
  if(name==='@/native/broadcast/session')return {isNativePlaybackMarker:()=>false,resolveNativePlayback:()=>{throw Error('Unexpected native lookup in OBS unit fixture');}};
  if(name==='@/lib/streamPlaybackError')return require('../../src/lib/streamPlaybackError.ts');
  if(name==='@/components/ui/card')return {Card:props=>React.createElement('section',props)};
  if(name==='@/components/ui/button')return {Button:props=>React.createElement('button',props)};
  if(name==='./health/StreamHealthIndicator')return {StreamHealthIndicator:()=>null};
  if(name==='./chat/StreamChat')return {StreamChat:()=>null};
  return require(name);
};
new Function('require','module','exports',output)(localRequire,mod,mod.exports);
const {StreamPlayer}=mod.exports;
test('offline stream without playback is truthfully offline',()=>{
  const html=renderToStaticMarkup(React.createElement(StreamPlayer,{streamId:'test',isLive:false}));
  assert.match(html,/role="status"/);
  assert.match(html,/Stream is offline/);
  assert.doesNotMatch(html,/<video/);
});
test('backend-confirmed live stream without playback is not falsely called offline',()=>{
  const html=renderToStaticMarkup(React.createElement(StreamPlayer,{streamId:'test',isLive:true}));
  assert.match(html,/playback is not available yet/);
  assert.doesNotMatch(html,/Stream is offline|<video/);
});
