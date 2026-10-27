import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {muxTestSnapshot} from '../../supabase/functions/_shared/mux-test-live.ts';
// Execute checked-in guards/handler; only Auth, DB and provider boundaries are mocked.
function fixture(options={}) {
 const calls=[];const admissionCalls=[];let handler;
 const env={SUPABASE_URL:'https://akiksrlzdqvipqbbjxpw.supabase.co',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'service',
  CLIPT_MUX_TEST_LIVE_ENABLED:'true',CLIPT_MUX_TEST_LIVE_USER_ID:'owner',CLIPT_MUX_TEST_LIVE_STREAM_ID:'local',
  CLIPT_MUX_TEST_LIVE_PROVIDER_ID:'provider',MUX_TOKEN_ID:'mock',MUX_TOKEN_SECRET:'mock',...options.env};
 const Deno={env:{get:key=>env[key]}};
 const createClient=()=>({auth:{getUser:async token=>({data:token==='valid'?{user:{id:options.user??'owner',factors:options.factors??[]}}:{},error:null})},
  rpc:async(name,args)=>{if(name==='clipt_beta_access'){admissionCalls.push(name);return {data:options.betaApproved!==false,error:null};}calls.push({rpc:name,args});return {error:options.syncError??null,data:options.syncApplied??true};},
  from:()=>{const q={select:()=>q,eq:(field,value)=>{calls.push({filter:field,value});return q;},
    maybeSingle:async()=>({data:options.missing?null:{id:'local',user_id:'owner'},error:null})};return q;}});
 const compile=source=>stripTypeScriptTypes(source.replace(/^import .*\r?\n/gm,'').replace(/\bexport /g,''));
 const shared=compile(readFileSync(new URL('../../supabase/functions/_shared/request.ts',import.meta.url),'utf8'));
 const guards=new Function('createClient','Deno',shared+';return {authenticatedUser,assertOwnUser,errorResponse,HttpError,jsonResponse,requestBody,requestMethod,serverEnv,serviceClient}')(createClient,Deno);
 const source=compile(readFileSync(new URL('../../supabase/functions/mux-test-live/index.ts',import.meta.url),'utf8'));
 const fetch=async()=>{calls.push({providerRead:true});if(options.transport)throw options.transport;return {status:options.providerStatus,ok:options.providerFailure!==true,json:async()=>({data:{id:'provider',test:options.paid!==true,status:'active',max_continuous_duration:300,playback_ids:[{policy:'public',id:'public123'}],stream_key:'mock-private-ingest'}})};};
 new Function(...Object.keys(guards),'serve','Deno','fetch','muxTestSnapshot',source)(...Object.values(guards),fn=>{handler=fn;},Deno,fetch,muxTestSnapshot);
 const request=(body={action:'status',streamId:'local'},token='valid')=>new Request('https://example.invalid',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
 return {handler,calls,request,admissionCalls};
}
test('uninvited live-adapter callers stop before provider or synchronization work',async()=>{
 const f=fixture({betaApproved:false});assert.equal((await f.handler(f.request())).status,403);
 assert.deepEqual(f.admissionCalls,['clipt_beta_access']);assert.equal(f.calls.length,0);
});
test('runtime live adapter denies missing/invalid identity before provider requests',async()=>{
 for(const token of [null,'invalid']){const f=fixture();assert.equal((await f.handler(f.request(undefined,token))).status,401);assert.equal(f.calls.length,0);}
});
test('owner synchronization uses only verified provider fields and refuses DB failure',async()=>{
 const env={CLIPT_MUX_TEST_LIVE_SYNC_ENABLED:'true'};
 const f=fixture({env});assert.equal((await f.handler(f.request())).status,200);
 const sync=f.calls.find(call=>call.rpc==='apply_live_provider_snapshot');
 assert.equal(sync.args.p_status,'active');assert.equal(sync.args.p_owner_id,'owner');
 assert.equal(sync.args.p_playback_url,'https://stream.mux.com/public123.m3u8');
 assert.ok(!JSON.stringify(sync).includes('mock-private-ingest'));
 const denied=fixture({env,syncError:{message:'private-db-detail'}});
 const response=await denied.handler(denied.request());assert.equal(response.status,503);
 assert.ok(!JSON.stringify(await response.json()).includes('private-db-detail'));
 const superseded=fixture({env,syncApplied:false});assert.equal((await superseded.handler(superseded.request())).status,503);
});
test('runtime live adapter denies AAL1 MFA sessions before provider requests',async()=>{
 const f=fixture({factors:[{status:'verified'}]});assert.equal((await f.handler(f.request())).status,403);assert.equal(f.calls.length,0);
});
test('runtime live adapter gates production and disabled development',async()=>{
 for(const env of [{SUPABASE_URL:'https://production.invalid'},{CLIPT_MUX_TEST_LIVE_ENABLED:'false'}]){
  const f=fixture({env});assert.equal((await f.handler(f.request())).status,503);assert.equal(f.calls.length,0);
 }
});
test('runtime foreign owner, foreign stream and foreign user payload cannot call provider',async()=>{
 for(const [options,body] of [[{user:'foreign'},{action:'status',streamId:'local'}],[{}, {action:'status',streamId:'foreign'}],[{}, {action:'status',streamId:'local',userId:'foreign'}]]){
  const f=fixture(options);assert.equal((await f.handler(f.request(body))).status,403);assert.equal(f.calls.length,0);
 }
});
test('runtime deleted/missing stream stops before provider and paid resource never produces playback',async()=>{
 const f=fixture({missing:true});assert.equal((await f.handler(f.request())).status,404);assert.equal(f.calls.some(x=>x.providerRead),false);
 const paid=fixture({paid:true});const denied=await paid.handler(paid.request());assert.equal(denied.status,502);
 assert.match((await denied.json()).error,/not a verified test stream/);
});
test('runtime provider outage cannot report live; successful status contains no credentials',async()=>{
 const fail=fixture({providerFailure:true});assert.equal((await fail.handler(fail.request())).status,502);
 const f=fixture();const response=await f.handler(f.request());assert.equal(response.status,200);
 const body=await response.json();assert.equal(body.is_live,true);assert.equal(body.test,true);
 assert.ok(!JSON.stringify(body).includes('mock-private-ingest'));assert.ok(!Object.hasOwn(body,'stream_key'));
 assert.ok(f.calls.some(x=>x.filter==='user_id'&&x.value==='owner'));
});
test('runtime provider diagnostic categories are safe and never include raw secrets',async()=>{
 for(const [providerStatus,expected] of [[401,'Mux credentials were rejected'],[403,'Mux token lacks permission'],[404,'configured token environment'],[429,'request limit reached']]){
  const f=fixture({providerFailure:true,providerStatus});const response=await f.handler(f.request());
  assert.equal(response.status,502);const text=JSON.stringify(await response.json());
  assert.ok(text.includes(expected));assert.ok(!text.includes('mock-private-ingest'));
 }
});
test('credential encoding and provider transport failures return safe explicit errors',async()=>{
 const bad=fixture({env:{MUX_TOKEN_SECRET:'invalid\nsecret'}});assert.equal((await bad.handler(bad.request())).status,503);assert.equal(bad.calls.some(x=>x.providerRead),false);
 for(const transport of [new TypeError('mock-secret-network-detail'),new DOMException('mock-secret-timeout','TimeoutError')]){
  const f=fixture({transport});const response=await f.handler(f.request());assert.equal(response.status,502);
  assert.ok(!JSON.stringify(await response.json()).includes('mock-secret'));
 }
});
