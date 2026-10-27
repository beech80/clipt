import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
const require=createRequire(import.meta.url);
function find(node,predicate){if(!node||typeof node!=='object')return null;if(predicate(node))return node;for(const child of React.Children.toArray(node.props?.children)){const result=find(child,predicate);if(result)return result;}return null;}
function fixture(){
  const states=['test@example.com','unchanged-password',false,null],refs=[],calls=[],navigation=[];let stateIndex=0,refIndex=0,resolve,reject;
  const pending=new Promise((done,fail)=>{resolve=done;reject=fail;});
  const mockedReact={...React,useState(initial){const index=stateIndex++;if(!(index in states))states[index]=initial;return [states[index],value=>{states[index]=value;}];},useRef(initial){const index=refIndex++;return refs[index]??(refs[index]={current:initial});}};
  const deps={react:mockedReact,'@/contexts/AuthContext':{useAuth:()=>({signIn:(...args)=>{calls.push(args);return pending;}})},'react-router-dom':{Link:'a',useNavigate:()=> (...args)=>navigation.push(args)}};
  const source=readFileSync(new URL('../../src/pages/Login.tsx',import.meta.url),'utf8');
  const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const mod={exports:{}};new Function('require','module','exports',output)(name=>deps[name]??(name.startsWith('@/components/ui/')?new Proxy({},{get:(_,key)=>key}):require(name)),mod,mod.exports);
  return {states,calls,navigation,resolve,reject,render(){stateIndex=0;refIndex=0;return mod.exports.default();}};
}
test('login serializes rapid submits and navigates only after authentication confirms',async()=>{
  const f=fixture();const form=find(f.render(),node=>node.type==='form');const first=form.props.onSubmit({preventDefault(){}});await form.props.onSubmit({preventDefault(){}});
  assert.equal(f.calls.length,1);assert.deepEqual(f.calls[0],['test@example.com','unchanged-password']);assert.equal(f.navigation.length,0);
  const pendingTree=f.render();assert.equal(find(pendingTree,node=>node.type==='form').props['aria-busy'],true);
  assert.equal(find(pendingTree,node=>node.props?.type==='submit').props.disabled,true);
  f.resolve();await first;assert.deepEqual(f.navigation,[['/clipts',{replace:true}]]);assert.equal(f.states[2],false);
});
for(const [reason,expected] of [['Invalid login credentials','Invalid email or password'],['Email not confirmed','Please verify your email']])test(`login failure remains on login with actionable error: ${reason}`,async()=>{
  const f=fixture();const result=find(f.render(),node=>node.type==='form').props.onSubmit({preventDefault(){}});
  f.reject(new Error(reason));await result;assert.equal(f.navigation.length,0);assert.ok(f.states[3].includes(expected));assert.equal(f.states[2],false);assert.equal(f.states[1],'unchanged-password');
});
