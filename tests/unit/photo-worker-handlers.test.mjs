import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {randomUUID} from 'node:crypto';
import {photoWorkerAuthorized} from '../../supabase/functions/_shared/photo-worker-auth.ts';
import {runPhotoReview,reviewStorageTarget} from '../../supabase/functions/_shared/photo-review-workflow.ts';
const compile=text=>stripTypeScriptTypes(text.replace(/^import .*\r?\n/gm,'').replace(/\bexport /g,''));
const project='https://akiksrlzdqvipqbbjxpw.supabase.co',owner=randomUUID(),post=randomUUID(),job=randomUUID(),key='a1'.repeat(32);
function fixture(name,options={}){
 let handler;const calls=[];
 const env={SUPABASE_URL:project,SUPABASE_ANON_KEY:'fixture-anon',SUPABASE_SERVICE_ROLE_KEY:'fixture-service',
  CLIPT_AZURE_WORKER_SECRET:key,CLIPT_AZURE_WORKER_ENABLED:'true',CLIPT_AZURE_REVIEW_ENABLED:'true',
  CLIPT_AZURE_AUTO_QUARANTINE_ENABLED:'true',CLIPT_AZURE_F0_VERIFIED:'true',AZURE_CONTENT_SAFETY_ENDPOINT:'https://fixture.invalid',AZURE_CONTENT_SAFETY_KEY:'fixture-provider-secret',...options.env};
 const Deno={env:{get:name=>env[name]}};
 const createClient=()=>({
  auth:{getUser:async token=>({data:token==='valid'?{user:{id:owner,factors:options.factors??[]}}:{},error:null})},
  rpc:async(name,args)=>{if(name==='clipt_beta_access')return {data:true,error:null};calls.push({name,args});
   if(name==='claim_public_photo_review'||name==='claim_photo_worker_fixture')return {data:options.idle?[]:[{request_id:job,post_id:post,user_id:owner,object_path:owner+'/worker-verification-'+post+'.png',reserved:options.reserve!==false}],error:null};
   if(name==='reserve_azure_review')return {data:options.reserve!==false,error:null};
   if(name==='quarantined_photo_preview')return options.staff===false?{data:null,error:{message:'private-sql-detail'}}:{data:[{post_id:post,user_id:owner,image_url:project+'/storage/v1/object/public/media/'+owner+'/photo.jpg',caption:'Great game'}],error:null};
   return {data:true,error:options.dbError??null};},
  from:()=>{const q={select:()=>q,eq:()=>q,single:async()=>({data:{user_id:owner,is_published:options.private!==true,is_premium:false,is_subscriber_only:false,required_tier_id:null,moderation_hidden:false,post_type:'clipt',video_url:null,image_url:project+'/storage/v1/object/public/media/'+owner+'/photo.jpg',content:'Great game'},error:null})};return q;},
  storage:{from:bucket=>({upload:async(path,bytes,args)=>{calls.push({upload:true,path,size:bytes.length,args});return {error:null};},remove:async paths=>{calls.push({remove:paths});return {error:null};},download:async path=>{calls.push({download:true,bucket,path});return {data:new Blob([Uint8Array.from([255,216,255,224,0,0,0,0,0,0,0,0])]),error:null};},
   createSignedUrl:async(path,seconds)=>{calls.push({sign:true,bucket,path,seconds});return {data:{signedUrl:project+'/storage/v1/object/sign/media/'+path+'?token=fixture-short-lived'},error:null};}})},
 });
 const guards=new Function('createClient','Deno',compile(readFileSync(new URL('../../supabase/functions/_shared/request.ts',import.meta.url),'utf8'))+';return {authenticatedUser,requestMethod,requestBody,serverEnv,serviceClient,HttpError,errorResponse,jsonResponse}')(createClient,Deno);
 const analyzeAzureReview=async()=>{calls.push({provider:true});if(options.providerError)throw Error('fixture-provider-secret');return options.flag?'needs_review':'no_flag_detected';};
 const source=compile(readFileSync(new URL(`../../supabase/functions/${name}/index.ts`,import.meta.url),'utf8'));
 new Function(...Object.keys(guards),'serve','Deno','createClient','photoWorkerAuthorized','runPhotoReview','reviewStorageTarget','analyzeAzureReview','console',source)(...Object.values(guards),fn=>handler=fn,Deno,createClient,photoWorkerAuthorized,runPhotoReview,reviewStorageTarget,analyzeAzureReview,{info:event=>calls.push({log:event})});
 const request=(body={jobId:job},headers={})=>new Request('https://fixture.invalid',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
 return {handler,calls,request};
}
test('worker missing/wrong secret, disabled flags and production gate have no outbound side effects',async()=>{
 for(const header of ['',key+'x']){const f=fixture('process-photo-reviews');assert.equal((await f.handler(f.request({}, {'x-clipt-worker-key':header}))).status,401);assert.equal(f.calls.length,0);}
 for(const env of [{CLIPT_AZURE_WORKER_ENABLED:'false'},{CLIPT_AZURE_REVIEW_ENABLED:'false'},{CLIPT_AZURE_AUTO_QUARANTINE_ENABLED:'false'},{CLIPT_AZURE_F0_VERIFIED:'false'},{SUPABASE_URL:'https://production.invalid'}]){
  const f=fixture('process-photo-reviews',{env});assert.equal((await f.handler(f.request({}, {'x-clipt-worker-key':key}))).status,503);assert.equal(f.calls.length,0);
 }
});
test('worker processes server-selected jobs, ignores caller targets, and completes flagged result atomically',async()=>{
 const f=fixture('process-photo-reviews',{flag:true});assert.equal((await f.handler(f.request({postId:'foreign'}, {'x-clipt-worker-key':key}))).status,200);
 assert.equal(f.calls.find(x=>x.download).path,owner+'/photo.jpg');
 assert.equal(f.calls.find(x=>x.name==='finish_azure_review_with_quarantine').args.p_state,'needs_review');
 assert.equal(f.calls.filter(x=>x.provider).length,2);
 assert.equal(f.calls.find(x=>x.name==='finish_public_photo_dispatch').args.p_success,true);
});

test('authenticated disabled-only probes never touch the queue or provider under either flag state',async()=>{
 for(const [env,status] of [[{},409],[{CLIPT_AZURE_WORKER_ENABLED:'false'},503]]){
  const f=fixture('process-photo-reviews',{env});
  const response=await f.handler(f.request({}, {'x-clipt-worker-key':key,'x-clipt-worker-probe':'disabled-only'}));
  assert.equal(response.status,status); assert.equal(f.calls.length,0);
 }
 const f=fixture('process-photo-reviews');
 assert.equal((await f.handler(f.request({}, {'x-clipt-worker-probe':'disabled-only'}))).status,401);
 assert.equal(f.calls.length,0);
});
test('private snapshots and ambiguous duplicate reservations never contact Azure or release holds',async()=>{
 for(const options of [{private:true},{reserve:false}]){
  const f=fixture('process-photo-reviews',options);const response=await f.handler(f.request({}, {'x-clipt-worker-key':key}));
  assert.ok([500,503].includes(response.status));assert.equal(f.calls.some(x=>x.provider),false);
  assert.ok(!f.calls.some(x=>x.name==='finish_public_photo_dispatch'&&x.args.p_success===true));
 }
});
test('provider failure returns no secrets and records held failure, not safety approval',async()=>{
 const f=fixture('process-photo-reviews',{providerError:true});const response=await f.handler(f.request({}, {'x-clipt-worker-key':key}));
 assert.equal(response.status,503);assert.ok(!JSON.stringify(await response.json()).includes('fixture-provider-secret'));
 assert.equal(f.calls.find(x=>x.name==='finish_public_photo_dispatch').args.p_success,false);
});
test('quarantine preview denies invalid identity, MFA failure, non-staff and caller URLs before signing',async()=>{
 for(const [options,headers,body,status] of [[{}, {},{jobId:job},401],[{factors:[{status:'verified'}]},{Authorization:'Bearer valid'},{jobId:job},403],[{staff:false},{Authorization:'Bearer valid'},{jobId:job},403],[{},{Authorization:'Bearer valid'},{jobId:job,url:'https://foreign.invalid'},400]]){
  const f=fixture('review-quarantine',options);assert.equal((await f.handler(f.request(body,headers))).status,status);assert.equal(f.calls.some(x=>x.sign),false);
 }
});
test('authorized quarantine preview signs only server-selected owned media for sixty seconds',async()=>{
 const f=fixture('review-quarantine');assert.equal((await f.handler(f.request(undefined,{Authorization:'Bearer valid'}))).status,200);
 const sign=f.calls.find(x=>x.sign);assert.equal(sign.path,owner+'/photo.jpg');assert.equal(sign.seconds,60);
 assert.equal(f.calls.some(x=>x.provider),false);
});

test('bounded prepare and cleanup use only server-registered neutral fixture and never call Azure',async()=>{
 for(const phase of ['prepare','cleanup']){
  const f=fixture('process-photo-reviews',{env:{CLIPT_AZURE_WORKER_ENABLED:'false'}});
  assert.equal((await f.handler(f.request({postId:'foreign',url:'https://foreign.invalid'},{'x-clipt-worker-key':key,'x-clipt-worker-probe':'bounded-'+phase}))).status,200);
  assert.equal(f.calls.some(c=>c.provider),false);
  assert.equal(f.calls.some(c=>c.name==='claim_public_photo_review'),false);
  if(phase==='prepare'){const upload=f.calls.find(c=>c.upload);assert.equal(upload.size,179);assert.equal(upload.args.upsert,false);}
  else assert.deepEqual(f.calls.find(c=>c.remove).remove,[owner+'/worker-verification-'+post+'.png']);
 }
});
test('bounded real-run gate refuses wrong project, general enabled or unverified free tier',async()=>{
 for(const env of [{},{CLIPT_AZURE_WORKER_ENABLED:'false',SUPABASE_URL:'https://production.invalid'},
  {CLIPT_AZURE_WORKER_ENABLED:'false',CLIPT_AZURE_F0_VERIFIED:'false'}]){
  const f=fixture('process-photo-reviews',{env});
  const r=await f.handler(f.request({}, {'x-clipt-worker-key':key,'x-clipt-worker-probe':'bounded-run'}));
  assert.ok([409,503].includes(r.status));assert.equal(f.calls.length,0);
 }
 const f=fixture('process-photo-reviews',{env:{CLIPT_AZURE_WORKER_ENABLED:'false'}});
 assert.equal((await f.handler(f.request({}, {'x-clipt-worker-key':key,'x-clipt-worker-probe':'bounded-run'}))).status,200);
 assert.equal(f.calls.filter(c=>c.provider).length,2);
 assert.equal(f.calls.some(c=>c.name==='claim_public_photo_review'),false);
 assert.ok(f.calls.some(c=>c.name==='finish_photo_worker_fixture'&&c.args.p_phase==='run'&&c.args.p_success));
});
