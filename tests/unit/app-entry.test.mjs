import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const m={exports:{}};
new Function('module','exports',ts.transpileModule(readFileSync(new URL('../../src/lib/app-entry.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m,m.exports);
const {needsAppWelcome,isDirectEntry,readAppEntry,rememberAppEntry,APP_ENTRY_KEY}=m.exports;
const route=(pathname='/',search='',hash='')=>({pathname,search,hash});
test('new opens welcome guests and returning accounts on every ordinary destination',()=>{
 for(const path of ['/','/start','/home','/login','/signup','/clipts','/discovery','/post/fixture','/settings'])
 for(const priorEntry of [false,true])assert.equal(needsAppWelcome(route(path),'navigate',priorEntry),true,path);
});
test('only a reload after Enter skips the welcome; unentered reloads still welcome',()=>{
 assert.equal(needsAppWelcome(route('/clipts'),'reload',true),false);
 assert.equal(needsAppWelcome(route('/clipts'),'reload',false),true);
 assert.equal(needsAppWelcome(route('/clipts'),'back_forward',true),true);
});
test('legal, deletion and recovery destinations remain directly accessible',()=>{
 for(const path of ['/privacy','/terms','/delete-account','/reset-password','/forgot-password','/update-password','/resend-verification','/docs/privacy-policy','/docs/terms-of-service','/payment-success']){
  assert.equal(isDirectEntry(route(path)),true,path);
  assert.equal(needsAppWelcome(route(path),'navigate',false),false,path);
 }
 assert.equal(isDirectEntry(route('/privacy/')),true);
 assert.equal(isDirectEntry(route('/privacy-imitation')),false);
});
test('email authentication parameters bypass welcome without being read, removed or rewritten',()=>{
 for(const key of ['code','token','token_hash','access_token','refresh_token','error','error_code','error_description']){
  for(const url of [route('/login','?'+key+'=fixture'),route('/login','','#'+key+'=fixture')]){
   const before=JSON.stringify(url);assert.equal(needsAppWelcome(url,'navigate',false),false);assert.equal(JSON.stringify(url),before);
  }
 }
 assert.equal(isDirectEntry(route('/clipts','?game=fixture','#comments')),false);
});
test('session marker is isolated from authentication, tutorial and user preferences',()=>{
 const data=new Map([['clipt-home-controls-v1:fixture','completed'],['clipt-mobile-controls-v1','left']]);
 const original=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');
 Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}});
 try{assert.equal(readAppEntry(),false);rememberAppEntry(true);assert.equal(data.get(APP_ENTRY_KEY),'entered');assert.equal(readAppEntry(),true);rememberAppEntry(false);assert.equal(readAppEntry(),false);assert.equal(data.get('clipt-home-controls-v1:fixture'),'completed');assert.equal(data.get('clipt-mobile-controls-v1'),'left');}
 finally{if(original)Object.defineProperty(globalThis,'sessionStorage',original);else delete globalThis.sessionStorage;}
});
test('unavailable browser storage never throws or prevents entry',()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');
 Object.defineProperty(globalThis,'sessionStorage',{configurable:true,get(){throw Error('Blocked');}});
 try{assert.equal(readAppEntry(),false);assert.doesNotThrow(()=>rememberAppEntry(true));assert.doesNotThrow(()=>rememberAppEntry(false));}
 finally{if(original)Object.defineProperty(globalThis,'sessionStorage',original);else delete globalThis.sessionStorage;}
});
