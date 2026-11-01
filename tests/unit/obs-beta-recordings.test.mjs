import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import ts from 'typescript';
const mod={exports:{}},core={exports:{}};
new Function('module','exports',ts.transpileModule(readFileSync(new URL('../../supabase/functions/obs-broadcast-session/lifecycle.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(core,core.exports);
new Function('require','module','exports',ts.transpileModule(readFileSync(new URL('../../supabase/functions/obs-broadcast-session/recordings.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(()=>core.exports,mod,mod.exports);
test('recording cleanup deletes only provider-verified recordings and confirms they are gone',async()=>{
 let deleted=false;const calls=[];
 await mod.exports.clearObsRecordings('provider',{recent_asset_ids:['asset']},async(path,method)=>{
  calls.push({path,method});if(path.includes('?'))return deleted?[]:[{id:'asset',live_stream_id:'provider'}];
  if(method==='DELETE'){deleted=true;return null;}return deleted?null:{id:'asset',live_stream_id:'provider'};
 });
 assert.equal(calls.filter(c=>c.method==='DELETE').length,1);
});
test('foreign, incomplete or unconfirmed recording inventories never report successful deletion',async()=>{
 let deletions=0;
 await assert.rejects(mod.exports.clearObsRecordings('provider',{},async(path,method)=>{
  if(method==='DELETE')deletions++;return [{id:'foreign',live_stream_id:'another'}];
 }));assert.equal(deletions,0);
 await assert.rejects(mod.exports.clearObsRecordings('provider',{active_asset_id:'asset'},async(path,method)=>{
  if(path.includes('?'))return [];if(method==='DELETE'){deletions++;return null;}return {id:'asset',live_stream_id:'another'};
 }));assert.equal(deletions,0);
});
