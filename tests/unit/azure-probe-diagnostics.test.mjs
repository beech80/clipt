import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeAzureReview} from '../../supabase/functions/_shared/azure-review.ts';
import {createAzurePhotoHandler} from '../../supabase/functions/_shared/production-photo-handler.mjs';

const config={endpoint:'https://clipt-content-safety-dev.cognitiveservices.azure.com/',key:'private-azure-key',tier:'F0',verifiedF0:true};
const safeRows={categoriesAnalysis:['Hate','SelfHarm','Sexual','Violence'].map(category=>({category,severity:0}))};
for(const status of [400,401,403,404,429,500,503]){
 test('Azure failure '+status+' retains only a numeric status, never the provider body',async()=>{
  await assert.rejects(analyzeAzureReview(config,{caption:'Synthetic caption'},async()=>new Response('private-azure-key secret-provider-body',{status})),error=>{
   assert.equal(error.providerStatus,status);
   assert.doesNotMatch(error.message,/private-azure-key|secret-provider-body|Synthetic caption/);
   return true;
  });
 });
}
test('network failure becomes a sanitized gateway failure',async()=>{
 await assert.rejects(analyzeAzureReview(config,{caption:'Synthetic caption'},async()=>{throw Error('secret-network-diagnostics');}),error=>{
  assert.equal(error.providerStatus,502);assert.doesNotMatch(error.message,/secret-network-diagnostics/);return true;
 });
});
function fixture(status,{trusted=true}={}){
 const providerCalls=[];
 const env={SUPABASE_URL:'https://slnjliheyiiummxhrgmk.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'private-service-key',AZURE_CONTENT_SAFETY_ENDPOINT:config.endpoint,AZURE_CONTENT_SAFETY_KEY:config.key};
 const handler=createAzurePhotoHandler({
  reviewedFiles:{},getEnv:key=>env[key],
  verifyToken:async()=>{if(!trusted)throw Error('untrusted');return {run_id:'7',run_attempt:'1'};},attestRunner:async()=>{},
  review:async()=>{throw Error('No user content in a probe');},
  analyze:(settings,input)=>analyzeAzureReview(settings,input,async(url,options)=>{
   providerCalls.push({url:String(url),body:JSON.parse(options.body)});
   return status===200?Response.json(safeRows):new Response('private-azure-key private-service-key secret-provider-body',{status});
  }),
  fetchImpl:async url=>{
   if(url.endsWith('/azure_photo_worker_status'))return Response.json({enabled:false,verifiedFreeTier:true,moderatorReady:true});
   if(url.endsWith('/reserve_azure_photo_probe')||url.endsWith('/record_azure_photo_worker'))return Response.json(true);
   throw Error('Unexpected administrative call');
  },
 });
 return {providerCalls,request:()=>handler(new Request('https://worker.invalid',{method:'POST',headers:{Authorization:'Bearer fixture'},body:JSON.stringify({action:'probe'})}))};
}
test('authenticated probe reports a bounded upstream status without returning credentials or content',async()=>{
 for(const status of [400,401,403,404,429,500,503]){
  const f=fixture(status),response=await f.request();
  assert.equal(response.status,status);
  const text=await response.text();
  assert.deepEqual(JSON.parse(text),{state:status===429||status>=500?'held':'configuration_required',reason:'provider_probe_failed'});
  assert.doesNotMatch(text,/private-azure-key|private-service-key|secret-provider-body|CLIPT moderation|imageBase64/);
  assert.equal(f.providerCalls.length,1);
 }
});
test('unauthorized requests cannot obtain provider diagnostics or call Azure',async()=>{
 const f=fixture(401,{trusted:false}),response=await f.request();
 assert.equal(response.status,401);assert.deepEqual(await response.json(),{error:'Not authorized'});
 assert.equal(f.providerCalls.length,0);
});
test('successful synthetic probe checks image and caption and still records verification',async()=>{
 const f=fixture(200),response=await f.request();
 assert.equal(response.status,200);
 assert.deepEqual(await response.json(),{state:'provider_verified',syntheticOnly:true,userContentSent:false});
 assert.equal(f.providerCalls.length,2);
 assert.ok(f.providerCalls[0].body.image.content);
 assert.equal(f.providerCalls[1].body.text,'CLIPT moderation connection check.');
});
