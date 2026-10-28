import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';

test('late Profile requests cannot replace a newly selected profile',async()=>{
  const require=createRequire(import.meta.url);
  const effects=[];const updates=[];const revision={current:0};
  let target='first';let stateIndex=0;
  const pending=new Map();
  for(const id of ['first','second']){
    let resolve;const promise=new Promise(done=>{resolve=done;});pending.set(id,{promise,resolve});
  }
  const dependencies={
    react:{...React,useState:initial=>{const index=stateIndex++;return [initial,value=>updates.push({index,value})];},useRef:()=>revision,useCallback:fn=>fn,useEffect:fn=>effects.push(fn)},
    'react-router-dom':{useParams:()=>({id:target}),useNavigate:()=>()=>{}},
    'styled-components':{__esModule:true,default:{div:()=>()=>null}},
    '@/contexts/AuthContext':{useAuth:()=>({user:{id:'viewer'},loading:false})},
    '@/lib/supabase':{supabase:{from:table=>{
      assert.equal(table,'profiles');const request=pending.get(target);
      const query={select:()=>query,eq:()=>query,maybeSingle:()=>request.promise};return query;
    }}},
    '@/components/ui/button':{},'@/components/ui/toggle':{},'@/components/ui/card':{},
    '@/components/achievements/AchievementList':{},'@/components/user/UserLink':{},
    '@/components/profile/ProfilePostTile':{},'@/components/ui/avatar':{},
    '@/components/profile/ProfileConnectionsDialog':{},'@/components/profile/ProfileWebsite':{},
  };
  const output=ts.transpileModule(readFileSync(new URL('../../src/pages/Profile.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const mod={exports:{}};new Function('require','module','exports',output)(name=>dependencies[name]??require(name),mod,mod.exports);
  mod.exports.default();const cleanup=effects[0]();
  cleanup();target='second';stateIndex=0;mod.exports.default();effects[1]();
  pending.get('first').resolve({data:{id:'first',username:'Older profile'},error:null});
  await Promise.resolve();await Promise.resolve();await Promise.resolve();
  assert.equal(updates.some(update=>update.index===1&&update.value?.id==='first'),false);
  pending.get('second').resolve({data:null,error:null});
  await Promise.resolve();await Promise.resolve();await Promise.resolve();
  assert.ok(updates.some(update=>update.index===3&&update.value==='Profile not found'));
});
