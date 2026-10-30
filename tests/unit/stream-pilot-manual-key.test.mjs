import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
function render(user){
 let observed;const output=ts.transpileModule(readFileSync(new URL('../../src/components/streaming/broadcast/StreamKeyManager.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const mod={exports:{}};const localRequire=name=>{
  if(name==='@tanstack/react-query')return{useQuery:config=>{observed=config;return{refetch:()=>{},isLoading:false};}};
  if(name==='@/contexts/AuthContext')return{useAuth:()=>({user})};
  if(name==='@/services/streamService')return{getStreamCredentials:()=>{throw Error('Unexpected credential request');}};
  if(name==='@/components/ui/card')return{Card:props=>React.createElement('section',props)};
  if(name==='@/components/ui/button')return{Button:props=>React.createElement('button',props)};
  if(name==='@/components/ui/input')return{Input:props=>React.createElement('input',props)};
  if(name==='@/components/ui/label')return{Label:props=>React.createElement('label',props)};
  return require(name);
 };
 new Function('require','module','exports',output)(localRequire,mod,mod.exports);
 const html=renderToStaticMarkup(React.createElement(mod.exports.StreamKeyManager,{streamId:'local',manual:true}));
 return{html,config:observed};
}
test('test OBS credentials stay unrequested until explicit owner action and do not refresh in the background',()=>{
 const{html,config}=render({id:'owner'});assert.equal(config.enabled,false);assert.equal(config.refetchOnWindowFocus,false);assert.equal(config.refetchOnReconnect,false);assert.equal(config.gcTime,0);assert.match(html,/Load OBS test credentials/);assert.doesNotMatch(html,/Stream Key Management|value="/);
});
test('signed-out callers cannot request the OBS test credentials',()=>{
 const{html,config}=render(null);assert.equal(config.enabled,false);assert.match(html,/<button[^>]*disabled/);
});
