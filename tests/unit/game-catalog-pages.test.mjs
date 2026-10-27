import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {searchPattern} from '../../src/lib/search-pattern.ts';

function harness(pages,fail=false) {
  const calls=[];let range;
  const request={select(){return this;},order(field){calls.push(['order',field]);return this;},range(start,end){range=[start,end];calls.push(['range',start,end]);return this;},ilike(field,pattern){calls.push(['ilike',field,pattern]);return this;},abortSignal(signal){calls.push(['signal',signal]);return this;},async retry(){return {data:pages[Math.floor(range[0]/40)]??[],error:fail?new Error('offline'):null};}};
  const output=ts.transpileModule(readFileSync(new URL('../../src/lib/game-catalog.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  const mod={exports:{}};new Function('require','module','exports',output)(name=>name==='@/lib/supabase'?{supabase:{from:()=>request}}:{searchPattern},mod,mod.exports);
  return {api:mod.exports,calls};
}
test('catalog pages use stable ordering, literal search and inclusive ranges',async()=>{
  const h=harness([]),signal=new AbortController().signal;
  await h.api.gameCatalogPage('%_',2,signal);
  assert.deepEqual(h.calls,[['order','name'],['order','id'],['range',80,119],['ilike','name','%\\%\\_%'],['signal',signal]]);
});
test('posting picker reaches games beyond the first forty results',async()=>{
  const first=Array.from({length:40},(_,id)=>({id:String(id),name:'Actual catalog '+id}));
  const last={id:'late',name:'Last actual game'};const h=harness([first,[last]]);
  assert.deepEqual(await h.api.completeGameCatalog(''),[...first,last]);
  assert.deepEqual(h.calls.filter(c=>c[0]==='range'),[['range',0,39],['range',40,79]]);
});
test('catalog failures remain failures rather than empty or fabricated games',async()=>{
  const h=harness([],true);await assert.rejects(h.api.completeGameCatalog(''),/offline/);
});
