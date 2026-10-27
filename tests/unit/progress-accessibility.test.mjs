import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const require=createRequire(import.meta.url);
function loadTsx(file){
 const output=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}
 }).outputText;
 const mod={exports:{}};
 const localRequire=name=>name==='@/lib/utils'?loadTsx('../../src/lib/utils.ts'):require(name);
 new Function('require','module','exports',output)(localRequire,mod,mod.exports);
 return mod.exports;
}
const {Progress}=loadTsx('../../src/components/ui/progress.tsx');
for(const value of [0,25,100]){
 test(`progress exposes its rendered value ${value} to assistive technology`,()=>{
  const html=renderToStaticMarkup(React.createElement(Progress,{value,'aria-label':'Achievement progress'}));
  assert.match(html,/role="progressbar"/);
  assert.match(html,new RegExp(`aria-valuenow="${value}"`));
  assert.match(html,/aria-label="Achievement progress"/);
  assert.match(html,new RegExp(`translateX\\(-${100-value}%\\)`));
 });
}
test('unspecified progress remains accessible as indeterminate',()=>{
 const html=renderToStaticMarkup(React.createElement(Progress,{'aria-label':'Loading'}));
 assert.doesNotMatch(html,/aria-valuenow=/);
 assert.match(html,/data-state="indeterminate"/);
});
