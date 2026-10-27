import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';

function harness(){
  let resolveInitial;const initial=new Promise(done=>{resolveInitial=done;});
  let listener;const effects=[];const users=[];const resends=[];let stateIndex=0;let clears=0;let invalidations=0;
  const require=createRequire(import.meta.url);
  const dependencies={
    react:{...React,useState:initial=>{const index=stateIndex++;return [initial,value=>{if(index===0)users.push(value);}];},useEffect:fn=>effects.push(fn),useMemo:fn=>fn(),useCallback:fn=>fn},
    '@/lib/supabase':{supabase:{auth:{resend:async input=>{resends.push(input);return {error:null};},getSession:()=>initial,onAuthStateChange:fn=>{listener=fn;return {data:{subscription:{unsubscribe:()=>{}}}};}}}},
    sonner:{toast:{success:()=>{}}},
    '@tanstack/react-query':{useQueryClient:()=>({clear:()=>{clears++;},invalidateQueries:async()=>{invalidations++;}})},
  };
  const output=ts.transpileModule(readFileSync(new URL('../../src/contexts/AuthContext.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const mod={exports:{}};new Function('require','module','exports','window',output)(name=>dependencies[name]??require(name),mod,mod.exports,{location:{origin:'http://127.0.0.1:5180'}});
  const provider=mod.exports.AuthProvider({children:null});effects[0]();
  return {value:provider.props.value,resends,emit:(event,id)=>listener(event,id?{user:{id}}:null),resolveInitial,users,clears:()=>clears,invalidations:()=>invalidations};
}
test('a delayed initial session cannot overwrite a newer sign-in event',async()=>{
  const h=harness();h.emit('SIGNED_IN','newer');h.resolveInitial({data:{session:{user:{id:'older'}}}});
  await Promise.resolve();await Promise.resolve();
  assert.deepEqual(h.users.map(user=>user?.id),['newer']);assert.equal(h.clears(),1);
});
test('confirmation resend keeps the current origin callback without bypassing verification',async()=>{
  const h=harness();await h.value.resendVerificationEmail(' Test@Example.com ');
  assert.deepEqual(h.resends,[{type:'signup',email:'test@example.com',options:{emailRedirectTo:'http://127.0.0.1:5180/login'}}]);
});
test('MFA completion refreshes caller-scoped data without changing identity',()=>{
  const h=harness();h.emit('SIGNED_IN','same-user');h.emit('MFA_CHALLENGE_VERIFIED','same-user');
  assert.equal(h.clears(),1);assert.equal(h.invalidations(),1);
  h.emit('TOKEN_REFRESHED','same-user');assert.equal(h.invalidations(),1);
  h.emit('SIGNED_OUT',null);assert.equal(h.clears(),2);
});
