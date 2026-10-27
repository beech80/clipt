import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';

function render({flag='true',pathname='/clipts',user={id:'invited'},loading=false,query={}}={}) {
  let config;
  const source=readFileSync(new URL('../../src/components/BetaAccessGate.tsx',import.meta.url),'utf8')
    .replaceAll('import.meta.env.VITE_BETA_ACCESS_REQUIRED',JSON.stringify(flag));
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const dependencies={
    'react/jsx-runtime':jsxRuntime,
    'react-router-dom':{useLocation:()=>({pathname}),Link:({to,children,...props})=>React.createElement('a',{href:to,...props},children)},
    '@tanstack/react-query':{useQuery:value=>{config=value;return {isPending:false,isError:false,...query};}},
    '@/contexts/AuthContext':{useAuth:()=>({user,loading,signOut:async()=>{}})},
    '@/lib/supabase':{supabase:{rpc:()=>({abortSignal:async()=>({data:true,error:null})})}},
    '@/components/LegalLinks':{LegalLinks:()=>React.createElement('a',{href:'/privacy'},'Privacy')},
  };
  const module={exports:{}};
  new Function('require','module','exports',code)(name=>dependencies[name],module,module.exports);
  return {html:renderToStaticMarkup(React.createElement(module.exports.BetaAccessGate,null,'PRIVATE CONTENT')),config};
}
test('beta UI denies guests, uninvited accounts and failed checks without mounting content',()=>{
  for(const options of [{user:null},{query:{data:false}},{query:{data:true,isError:true}},{loading:true}]) {
    const {html}=render(options);assert.doesNotMatch(html,/PRIVATE CONTENT/);
  }
});
test('beta UI admits approved users and leaves public legal and account recovery reachable',()=>{
  assert.match(render({query:{data:true}}).html,/PRIVATE CONTENT/);
  for(const pathname of ['/privacy','/terms','/login','/update-password','/delete-account']) {
    const {html,config}=render({pathname,user:null});assert.match(html,/PRIVATE CONTENT/);assert.equal(config.enabled,false);
  }
  assert.doesNotMatch(render({pathname:'/signup',user:null}).html,/PRIVATE CONTENT/);
});
test('staged beta UI is disabled until coordinated activation and keys checks by identity',()=>{
  assert.match(render({flag:'false',user:null}).html,/PRIVATE CONTENT/);
  assert.deepEqual(render().config.queryKey,['beta-access','invited']);
  assert.equal(render().config.retry,false);
});
