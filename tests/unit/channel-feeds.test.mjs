import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const game='00000000-0000-4000-8000-000000000001';
function fixture({rows=[],development=false,verified=true,rpcError=null}={}){
 const calls=[];const supabase={from(table){const call={table,steps:[]};calls.push(call);const builder={};for(const method of ['select','eq','order','range','abortSignal','limit','gt','in'])builder[method]=(...args)=>{call.steps.push([method,...args]);return builder;};builder.retry=async()=>({data:rows,error:null});return builder;},rpc:async(name,args)=>{calls.push({rpc:name,args});return {data:[{is_live:verified}],error:rpcError};}};
 const deps={'@/lib/supabase':{supabase},'@/integrations/supabase/client':{storageProjectUrl:development?'https://akiksrlzdqvipqbbjxpw.supabase.co':'https://fixture.invalid'},'@/lib/discovery-feeds':{DISCOVERY_PAGE_SIZE:24}};
 const code=ts.transpileModule(readFileSync(new URL('../../src/lib/channel-feeds.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const mod={exports:{}};new Function('require','module','exports',code)(name=>deps[name],mod,mod.exports);
 return {...mod.exports,calls};
}
test('channel media queries constrain the selected game on the server and keep stable pages',async()=>{
 const f=fixture({rows:Array.from({length:25},(_,i)=>({id:String(i)}))});const page=await f.channelMediaPage('posts',game,1);
 assert.equal(f.calls[0].table,'public_channel_posts');assert.ok(f.calls[0].steps.some(step=>step[0]==='eq'&&step[1]==='game_id'&&step[2]===game));assert.ok(f.calls[0].steps.some(step=>step[0]==='range'&&step[1]===24&&step[2]===48));assert.equal(page.items.length,24);assert.equal(page.more,true);
 await f.channelMediaPage('clipts',game,0);assert.equal(f.calls[1].table,'public_clipt_discovery');
 for(const [id,n] of [['bad',0],[game,-1],[game,NaN]])await assert.rejects(f.channelMediaPage('clipts',id,n));assert.equal(f.calls.length,2,'invalid filters never become all-game requests');
});
test('live channels select safe fields, restrict games/follows and retain cursors after verification',async()=>{
 const rows=Array.from({length:24},(_,i)=>({id:'00000000-0000-4000-8000-'+String(i+100).padStart(12,'0'),game_id:game}));const f=fixture({rows,development:true,verified:false});const page=await f.channelLivePage(game,null,['creator']);
 assert.equal(page.items.length,0);assert.equal(page.next,rows.at(-1).id,'cursor follows unfiltered candidates, so stale LIVE rows cannot trap pagination');
 const select=f.calls[0].steps.find(step=>step[0]==='select')[1];assert.doesNotMatch(select,/stream_key|rtmp|ingest|stream_settings/);assert.match(select,/game_id/);
 assert.ok(f.calls[0].steps.some(step=>step[0]==='eq'&&step[1]==='game_id'&&step[2]===game));assert.ok(f.calls[0].steps.some(step=>step[0]==='in'&&step[1]==='user_id'));
 const empty=fixture();assert.deepEqual(await empty.channelLivePage(game,null,[]),{items:[],next:null});assert.equal(empty.calls.length,0);
});
test('verification errors and invalid live filters fail closed',async()=>{
 const f=fixture({rows:[{id:game}],development:true,rpcError:new Error('unavailable')});await assert.rejects(f.channelLivePage(game,null,undefined),/unavailable/);
 const invalid=fixture();await assert.rejects(invalid.channelLivePage('invalid',null,undefined));await assert.rejects(invalid.channelLivePage(game,'invalid',undefined));assert.equal(invalid.calls.length,0);
});
