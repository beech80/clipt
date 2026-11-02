import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createAzurePhotoHandler} from '../../supabase/functions/_shared/production-photo-handler.mjs';
import {REVIEWED_PHOTO_FILES} from '../../supabase/functions/azure-photo-worker/reviewed-runner.mjs';

function fixture(failStage,message='state-unavailable'){
 let scan=0;
 const env={SUPABASE_URL:'https://slnjliheyiiummxhrgmk.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'private-service-key',AZURE_CONTENT_SAFETY_ENDPOINT:'https://clipt-content-safety-dev.cognitiveservices.azure.com/',AZURE_CONTENT_SAFETY_KEY:'private-azure-key'};
 const handler=createAzurePhotoHandler({reviewedFiles:{},getEnv:k=>env[k],verifyToken:async()=>({run_id:'1',run_attempt:'1'}),attestRunner:async()=>{},
  analyze:async()=>{scan++;if(failStage===(scan===1?'provider_image':'provider_caption'))throw Error(message);return 'no_flag_detected';},
  review:async()=>{throw Error('No user content');},
  fetchImpl:async url=>{
   const stage=url.endsWith('/azure_photo_worker_status')?'worker_status':url.endsWith('/reserve_azure_photo_probe')?'probe_budget':'probe_record';
   if(stage===failStage)return new Response('secret-database-error',{status:500});
   return Response.json(stage==='worker_status'?{enabled:false,verifiedFreeTier:true,moderatorReady:true}:true);
  },
 });
 return ()=>handler(new Request('https://worker.invalid',{method:'POST',headers:{Authorization:'Bearer fixture'},body:JSON.stringify({action:'probe'})}));
}
for(const stage of ['worker_status','probe_budget','probe_record']){
 test('probe identifies '+stage+' failure without exposing database errors',async()=>{
  const response=await fixture(stage)();assert.equal(response.status,503);
  const body=await response.text();assert.deepEqual(JSON.parse(body).diagnostic,{stage,kind:'database_rpc'});
  assert.doesNotMatch(body,/secret-database-error|private-service-key|private-azure-key/);
 });
}
for(const [stage,message,kind]of [
 ['provider_image','Invalid moderation input','invalid_input'],
 ['provider_caption','Moderation response unavailable','invalid_provider_response'],
 ['provider_image','secret-exception-value','internal_error'],
]){
 test('probe classifies '+stage+' as '+kind+' without returning the error text',async()=>{
  const response=await fixture(stage,message)();const body=await response.text();
  assert.deepEqual(JSON.parse(body).diagnostic,{stage,kind});assert.doesNotMatch(body,/secret-exception-value|private-azure-key/);
 });
}
test('runner prints only allowlisted diagnostic stage/kind values',async()=>{
 const source=await readFile(new URL('../../scripts/run-azure-photo-worker.mjs',import.meta.url),'utf8');
 for(const diagnostic of [{stage:'provider_caption',kind:'invalid_provider_response'},{stage:'secret-diagnostic',kind:'invalid_input'},{stage:'provider_image',kind:'private-azure-key'}]){
  const lines=[];let calls=0;
  const context={URL,AbortSignal,console:{log:x=>lines.push(x),error:()=>{}},process:{env:{GITHUB_REPOSITORY:'beech80/clipt',GITHUB_REF:'refs/heads/main',GITHUB_EVENT_NAME:'push',CLIPT_PHOTO_ACTION:'probe',ACTIONS_ID_TOKEN_REQUEST_URL:'https://example.actions.githubusercontent.com/token',ACTIONS_ID_TOKEN_REQUEST_TOKEN:'private-request-token'}},fetch:async()=>{
   calls++;return calls===1?Response.json({value:'private-oidc-token'}):Response.json({state:'held',reason:'probe_failed',diagnostic},{status:503});
  }};
  await vm.runInNewContext(source,context);
  const printed=JSON.parse(lines[0]);
  if(diagnostic.stage==='provider_caption')assert.deepEqual(printed.diagnostic,diagnostic);else assert.equal(printed.diagnostic,undefined);
  assert.doesNotMatch(lines.join(''),/secret-diagnostic|private-azure-key|private-request-token|private-oidc-token/);
 }
});
test('worker attestation pins the exact reviewed workflow and runner bytes',async()=>{
 for(const [path,digest]of Object.entries(REVIEWED_PHOTO_FILES)){
  const content=await readFile(new URL('../../'+path,import.meta.url));
  assert.equal(createHash('sha256').update(content).digest('hex'),digest,path);
 }
});
