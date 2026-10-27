import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {runPhotoReview} from '../../supabase/functions/_shared/photo-review-workflow.ts';
const owner='1b0ea76e-a629-4f54-8ec5-1e4ae0e7a251',post='0b28e432-16c4-4fc1-adc7-bec6ce263cd8';
const project='https://akiksrlzdqvipqbbjxpw.supabase.co';
const compile=text=>stripTypeScriptTypes(text.replace(/^import .*\r?\n/gm,'').replace(/\bexport /g,''));
function fixture(options={}) {
 let handler;const calls=[];
 const env={SUPABASE_URL:project,SUPABASE_ANON_KEY:'fixture',SUPABASE_SERVICE_ROLE_KEY:'fixture',CLIPT_AZURE_F0_VERIFIED:'true',AZURE_CONTENT_SAFETY_ENDPOINT:'https://clipt-content-safety-dev.cognitiveservices.azure.com/',AZURE_CONTENT_SAFETY_KEY:'secret',...options.env};
 const Deno={env:{get:key=>env[key]}};
 const createClient=()=>({auth:{getUser:async token=>({data:{user:token==='valid'?{id:owner,email_confirmed_at:'2026-10-15',...options.user}:null},error:null})},
  rpc:async(name,args)=>{if(name==='clipt_beta_access')return {data:true,error:null};calls.push({name,args});return {data:name==='reserve_azure_review'?options.reserve!==false:true,error:null};},
  from:()=>{const q={select:()=>q,eq:()=>q,single:async()=>({data:{user_id:owner,is_published:true,is_premium:false,is_subscriber_only:false,required_tier_id:null,moderation_hidden:false,post_type:'clipt',video_url:null,image_url:project+'/storage/v1/object/public/media/'+owner+'/test.png',content:'CLIPT Azure test',...options.photo},error:null})};return q;},
  storage:{from:()=>({download:async()=>{calls.push({download:true});return {data:new Blob([Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0])]),error:null};}})},
 });
 const guards=new Function('createClient','Deno',compile(readFileSync(new URL('../../supabase/functions/_shared/request.ts',import.meta.url),'utf8'))+';return {authenticatedUser,requestMethod,requestBody,serverEnv,serviceClient,HttpError,errorResponse,jsonResponse}')(createClient,Deno);
 new Function(...Object.keys(guards),'serve','Deno','runPhotoReview','analyzeAzureReview','console',compile(readFileSync(new URL('../../supabase/functions/verify-photo-quarantine/index.ts',import.meta.url),'utf8')))(...Object.values(guards),fn=>handler=fn,Deno,runPhotoReview,async()=>{calls.push({provider:true});if(options.failure)throw Error('secret');return options.state??'needs_review';},{info:event=>calls.push({log:event})});
 return {calls,handler,request:(body={},token='valid')=>new Request('https://fixture.invalid',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)})};
}
test('fixed fixture uses authenticated owner, two reserved operations and real quarantine completion',async()=>{
 const f=fixture();const response=await f.handler(f.request());assert.equal(response.status,200);
 assert.equal((await response.json()).state,'needs_review');
 assert.deepEqual(f.calls.find(x=>x.name==='reserve_azure_review').args,{p_user:owner,p_post:post,p_request:'c26f0d68-19f7-4f99-9c5a-52fe945caa10',p_operations:2});
 assert.equal(f.calls.filter(x=>x.provider).length,2);
 assert.equal(f.calls.find(x=>x.name==='finish_azure_review_with_quarantine').args.p_state,'needs_review');
});
test('foreign, anonymous, unconfirmed and MFA password-only users cannot run fixture',async()=>{
 for(const user of [{id:'foreign'},{is_anonymous:true},{email_confirmed_at:null},{factors:[{status:'verified'}]}]){
  const f=fixture({user});assert.equal((await f.handler(f.request())).status,403);assert.equal(f.calls.length,0);
 }
 const f=fixture();assert.equal((await f.handler(f.request({},'invalid'))).status,401);assert.equal(f.calls.length,0);
});
test('alternate targets, production, wrong resource and unverified tier fail before reservation',async()=>{
 const target=fixture();assert.equal((await target.handler(target.request({postId:'foreign'}))).status,400);assert.equal(target.calls.length,0);
 for(const env of [{SUPABASE_URL:'https://production.invalid'},{CLIPT_AZURE_F0_VERIFIED:'false'},{AZURE_CONTENT_SAFETY_ENDPOINT:'https://other.cognitiveservices.azure.com/'}]){
  const f=fixture({env});assert.equal((await f.handler(f.request())).status,503);assert.equal(f.calls.length,0);
 }
});
test('private, video, changed caption and foreign snapshots never reach Azure',async()=>{
 for(const photo of [{is_published:false},{video_url:'https://video.invalid'},{content:'Changed'},{user_id:'other'}]){
  const f=fixture({photo});assert.equal((await f.handler(f.request())).status,500);assert.equal(f.calls.some(x=>x.provider),false);
  assert.equal(f.calls.find(x=>x.name==='finish_azure_review_with_quarantine').args.p_state,'failed');
 }
});
test('duplicate reservation spends no provider quota and never fabricates a result',async()=>{
 const f=fixture({reserve:false});assert.equal((await (await f.handler(f.request())).json()).state,'already_reserved');assert.equal(f.calls.length,1);
});
test('clean provider result remains clean; provider failure is failed and redacted',async()=>{
 const clean=fixture({state:'no_flag_detected'});assert.equal((await (await clean.handler(clean.request())).json()).state,'no_flag_detected');
 const failed=fixture({failure:true});const response=await failed.handler(failed.request());assert.equal(response.status,500);assert.ok(!(await response.text()).includes('secret'));assert.equal(failed.calls.find(x=>x.name==='finish_azure_review_with_quarantine').args.p_state,'failed');
});
