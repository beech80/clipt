import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {createHmac} from 'node:crypto';
import {verifyMuxSignature} from '../../supabase/functions/_shared/mux-webhook-signature.ts';
import {muxTestSnapshot} from '../../supabase/functions/_shared/mux-test-live.ts';
const compile=text=>stripTypeScriptTypes(text.replace(/^import .*\r?\n/gm,'').replace(/\bexport /g,''));
function fixture(options={}) {
 let handler;const calls=[];
 const env={SUPABASE_URL:'https://akiksrlzdqvipqbbjxpw.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'fixture',
  CLIPT_MUX_TEST_LIVE_ENABLED:'true',CLIPT_MUX_TEST_LIVE_SYNC_ENABLED:'true',MUX_TEST_WEBHOOK_SECRET:'local-fixture',
  CLIPT_MUX_TEST_LIVE_PROVIDER_ID:'provider',CLIPT_MUX_TEST_LIVE_STREAM_ID:'local',CLIPT_MUX_TEST_LIVE_USER_ID:'owner',
  MUX_TOKEN_ID:'fixture',MUX_TOKEN_SECRET:'fixture',...options.env};
 const Deno={env:{get:name=>env[name]}};
 const createClient=()=>({rpc:async(name,args)=>{calls.push({name,args});return {error:options.dbError??null};}});
 const shared=compile(readFileSync(new URL('../../supabase/functions/_shared/request.ts',import.meta.url),'utf8'));
 const guards=new Function('createClient','Deno',shared+';return {HttpError,errorResponse,jsonResponse,serverEnv,serviceClient}')(createClient,Deno);
 const fetch=async()=>{calls.push({provider:true});return {ok:!options.providerError,json:async()=>({data:{id:'provider',test:!options.paid,status:options.status??'idle',max_continuous_duration:300,playback_ids:[{policy:'public',id:'public123'}],stream_key:'never-return-fixture'}})};};
 const source=compile(readFileSync(new URL('../../supabase/functions/mux-live-webhook/index.ts',import.meta.url),'utf8'));
 new Function(...Object.keys(guards),'serve','Deno','fetch','verifyMuxSignature','muxTestSnapshot',source)(...Object.values(guards),fn=>handler=fn,Deno,fetch,verifyMuxSignature,muxTestSnapshot);
 const request=(event={id:'event1',type:'video.live_stream.active',data:{id:'provider'}},valid=true)=>{
  const body=JSON.stringify(event),stamp=Math.floor(Date.now()/1000);
  const signature=createHmac('sha256','local-fixture').update(stamp+'.'+body).digest('hex');
  return new Request('https://example.invalid',{method:'POST',headers:{'mux-signature':valid?`t=${stamp},v1=${signature}`:'bad'},body});
 };
 return {handler,request,calls};
}
test('invalid signatures and disabled/production gates cannot contact Mux or mutate DB',async()=>{
 const f=fixture();assert.equal((await f.handler(f.request(undefined,false))).status,401);assert.equal(f.calls.length,0);
 for(const env of [{CLIPT_MUX_TEST_LIVE_SYNC_ENABLED:'false'},{SUPABASE_URL:'https://production.invalid'}]){
  const f=fixture({env});assert.equal((await f.handler(f.request())).status,503);assert.equal(f.calls.length,0);
 }
});
test('signed event status is not trusted: current provider idle overrides an active event',async()=>{
 const f=fixture();const response=await f.handler(f.request());assert.equal(response.status,200);
 const mutation=f.calls.find(call=>call.name==='apply_live_webhook_snapshot');
 assert.equal(mutation.args.p_status,'idle');assert.equal(mutation.args.p_event_id,'event1');
 assert.ok(!JSON.stringify(await response.json()).includes('never-return-fixture'));
});
test('foreign streams and unsupported event types are ignored without provider reads',async()=>{
 for(const event of [{id:'event1',type:'video.live_stream.active',data:{id:'foreign'}},{id:'event1',type:'unknown',data:{id:'provider'}}]){
  const f=fixture();assert.deepEqual(await (await f.handler(f.request(event))).json(),{ignored:true});assert.equal(f.calls.length,0);
 }
});
test('paid resources and provider/DB failures cannot return success',async()=>{
 for(const options of [{paid:true},{providerError:true},{dbError:{message:'private-detail'}}]){
  const f=fixture(options);const response=await f.handler(f.request());assert.ok(response.status>=500);
  assert.ok(!JSON.stringify(await response.json()).includes('private-detail'));
 }
});
