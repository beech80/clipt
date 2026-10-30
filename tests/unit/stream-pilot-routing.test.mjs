import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {isMuxTestProject} from '../../src/lib/live-test-environment.ts';
function fixture({project='https://akiksrlzdqvipqbbjxpw.supabase.co',signedIn=true,result,error=null}={}){
 const calls=[];const supabase={auth:{getUser:async()=>({data:{user:signedIn?{id:'owner'}:null},error:null})},functions:{invoke:async(name,input)=>{calls.push({name,body:input.body});return{data:result,error};}}};
 const raw=readFileSync(new URL('../../src/services/streamService.ts',import.meta.url),'utf8').replace(/^import .*\r?\n/gm,'').replace(/^export /gm,'');
 const compiled=stripTypeScriptTypes(raw);
 const service=new Function('supabase','storageProjectUrl','isMuxTestProject',compiled+';return {getMuxTestLiveStatus,getStreamCredentials,startStream,endStream};')(supabase,project,isMuxTestProject);
 return{service,calls};
}
const credentials={id:'local',test:true,rtmp_url:'rtmps://global-live.mux.com:443/app',stream_key:'fixture-private-key'};
test('pilot routing is exact-project scoped independently of the Vite build mode',()=>{
 for(const input of ['https://akiksrlzdqvipqbbjxpw.supabase.co'])assert.equal(isMuxTestProject(input),true);
 for(const input of [undefined,null,'','http://127.0.0.1:54321','https://slnjliheyiiummxhrgmk.supabase.co','https://akiksrlzdqvipqbbjxpw.supabase.co.evil.invalid','https://evil.invalid/?project=akiksrlzdqvipqbbjxpw'])assert.equal(isMuxTestProject(input),false);
});
test('development preview credentials use the existing authenticated test endpoint, not missing legacy oauth',async()=>{
 const f=fixture({result:credentials});assert.equal(f.calls.length,0);const r=await f.service.getStreamCredentials('local');assert.equal(r.error,null);assert.deepEqual(r.data,{id:'local',rtmp_url:credentials.rtmp_url,stream_key:credentials.stream_key});
 assert.deepEqual(f.calls,[{name:'mux-test-live',body:{action:'credentials',streamId:'local'}}]);
});
test('test credential response must retain test identity, exact TLS ingest host and bounded printable key',async()=>{
 for(const override of [{id:'foreign'},{test:false},{test:undefined},{rtmp_url:'rtmps://evil.invalid/app'},{stream_key:'short'},{stream_key:'bad\nprivate'},{stream_key:'x'.repeat(257)}]){
  const f=fixture({result:{...credentials,...override}});const r=await f.service.getStreamCredentials('local');assert.equal(r.data,null);assert.ok(r.error);
 }
});
test('production credentials retain the established owner-authenticated endpoint and behavior',async()=>{
 const f=fixture({project:'https://slnjliheyiiummxhrgmk.supabase.co',result:{...credentials,test:undefined,rtmp_url:'rtmps://approved-provider.invalid/app'}});assert.equal((await f.service.getStreamCredentials('local')).error,null);
 assert.deepEqual(f.calls,[{name:'oauth',body:{action:'get_stream_credentials',streamId:'local'}}]);
});
test('no signed-in user means no provider credential request',async()=>{
 const f=fixture({signedIn:false,result:credentials});assert.ok((await f.service.getStreamCredentials('local')).error);assert.deepEqual(f.calls,[]);
});
test('development lifecycle cannot call the undeployed legacy endpoint or claim that OBS has started',async()=>{
 const f=fixture({result:credentials});for(const action of ['startStream','endStream'])assert.ok((await f.service[action]('local')).error);assert.deepEqual(f.calls,[]);
});
test('built development preview can check a validated provider status without emitting credentials',async()=>{
 const status={id:'local',test:true,is_live:false,provider_status:'idle',playback_url:'https://stream.mux.com/public123.m3u8'};
 const f=fixture({result:status});assert.deepEqual(await f.service.getMuxTestLiveStatus('local'),{data:status,error:null});assert.deepEqual(f.calls,[{name:'mux-test-live',body:{action:'status',streamId:'local'}}]);
 for(const override of [{id:'foreign'},{test:false},{is_live:true},{provider_status:'unknown'},{playback_url:'https://evil.invalid/video.m3u8'}]){
  const bad=fixture({result:{...status,...override}});assert.ok((await bad.service.getMuxTestLiveStatus('local')).error);
 }
});
test('production cannot route to the development pilot or read its provider state',async()=>{
 const f=fixture({project:'https://slnjliheyiiummxhrgmk.supabase.co'});assert.ok((await f.service.getMuxTestLiveStatus('local')).error);assert.deepEqual(f.calls,[]);
});
