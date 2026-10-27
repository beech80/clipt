import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {needsMfaChallenge,validateAuthenticatorCode} from '../../src/lib/mfa.ts';

test('rapid MFA submits cannot create parallel verification challenges',async()=>{
  const require=createRequire(import.meta.url);let resolve;let calls=0;let cursor=0;
  const promise=new Promise(done=>{resolve=done;});const submitting={current:false};
  const states=[0,'viewer','factor','','123456',false];
  const dependencies={
    react:{...React,useState:()=>[states[cursor++],()=>{}],useEffect:()=>{},useRef:()=>submitting},
    '@/contexts/AuthContext':{useAuth:()=>({user:{id:'viewer'},loading:false,signOut:async()=>{}})},
    '@/lib/supabase':{supabase:{auth:{mfa:{challengeAndVerify:()=>{calls++;return promise;}}}}},
    '@/lib/mfa':{needsMfaChallenge,validateAuthenticatorCode},
    '@/components/ui/button':{Button:props=>React.createElement('button',props)},
    '@/components/ui/input':{Input:props=>React.createElement('input',props)},
  };
  const output=ts.transpileModule(readFileSync(new URL('../../src/components/MfaGate.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const mod={exports:{}};new Function('require','module','exports',output)(name=>dependencies[name]??require(name),mod,mod.exports);
  const tree=mod.exports.MfaGate({children:null});const form=tree.props.children.find(child=>child?.type==='form');
  const event={preventDefault:()=>{}};const first=form.props.onSubmit(event);await form.props.onSubmit(event);
  assert.equal(calls,1);assert.equal(submitting.current,true);
  resolve({error:null});await first;assert.equal(submitting.current,false);
  await form.props.onSubmit(event);assert.equal(calls,2);
});
