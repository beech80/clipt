import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import * as urls from '../../src/lib/public-app-url.ts';
const output=ts.transpileModule(readFileSync(new URL('../../src/native/app/share.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
test('native sharing uses the native sheet and public post URL; web keeps Share and clipboard fallback',async()=>{
 const oldWindow=globalThis.window,oldNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator');
 try {
  for(const native of [true,false])for(const browserShare of [true,false]){
   const calls=[];globalThis.window={location:{origin:native?'capacitor://localhost':'https://web.example'}};
   Object.defineProperty(globalThis,'navigator',{configurable:true,value:{share:browserShare?async x=>calls.push(['web',x]):undefined,clipboard:{writeText:async x=>calls.push(['copy',x])}}});
   const deps={'@capacitor/share':{Share:{share:async x=>calls.push(['native',x])}},'./runtime':{isNativeApp:()=>native},'@/lib/public-app-url':urls};
   const mod={exports:{}};new Function('require','module','exports',output)(key=>deps[key],mod,mod.exports);
   const result=await mod.exports.shareClipt({title:'Clipt',url:'/post/recorded-id'});
   assert.equal(calls.length,1);assert.equal(calls[0][0],native?'native':browserShare?'web':'copy');
   const url=native?urls.PUBLIC_CLIPT_ORIGIN+'/post/recorded-id':'https://web.example/post/recorded-id';
   assert.equal(typeof calls[0][1]==='string'?calls[0][1]:calls[0][1].url,url);
   assert.equal(result,native||browserShare?'shared':'copied');
  }
 } finally {
  if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;
  if(oldNavigator)Object.defineProperty(globalThis,'navigator',oldNavigator);else delete globalThis.navigator;
 }
});
