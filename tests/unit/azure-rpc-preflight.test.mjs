import test from 'node:test';
import assert from 'node:assert/strict';
import {createAzurePhotoHandler} from '../../supabase/functions/_shared/production-photo-handler.mjs';
function fixture(body,{oversized=false,success=false}={}){
 const calls=[],reports=[];
 const env={SUPABASE_URL:'https://slnjliheyiiummxhrgmk.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'private-service-key',AZURE_CONTENT_SAFETY_ENDPOINT:'https://clipt-content-safety-dev.cognitiveservices.azure.com/',AZURE_CONTENT_SAFETY_KEY:'private-azure-key'};
 const handler=createAzurePhotoHandler({reviewedFiles:{},getEnv:k=>env[k],verifyToken:async()=>({run_id:'1',run_attempt:'1'}),attestRunner:async()=>{},reportDiagnostic:record=>reports.push(record),
  analyze:async()=>{calls.push('provider');return 'no_flag_detected';},review:async()=>{throw Error('No user content');},
  fetchImpl:async(url,options)=>{
   const operation=url.slice(url.lastIndexOf('/')+1);calls.push({operation,args:JSON.parse(options.body)});
   if(operation==='azure_photo_worker_status')return Response.json({enabled:false,verifiedFreeTier:true,moderatorReady:true});
   if(operation==='record_azure_photo_worker'&&!success)return new Response(oversized?'secret-provider-key'.repeat(400):JSON.stringify(body),{status:400});
   return Response.json(true);
  },
 });
 return {calls,reports,run:()=>handler(new Request('https://worker.invalid',{method:'POST',headers:{Authorization:'Bearer fixture'},body:JSON.stringify({action:'probe'})}))};
}
test('failed recording preflight consumes no Azure quota or provider calls',async()=>{
 const f=fixture({code:'P0001',message:'private-service-key',hint:'private-azure-key'});
 const response=await f.run();
 assert.equal(response.status,503);
 assert.deepEqual(f.calls.map(x=>x.operation),['azure_photo_worker_status','record_azure_photo_worker']);
 assert.deepEqual(f.calls[1].args,{p_state:'disabled'});
 assert.deepEqual(f.reports,[{event:'azure_photo_rpc_failure',operation:'record_azure_photo_worker',status:400,code:'P0001'}]);
 assert.doesNotMatch(JSON.stringify(f.reports)+await response.text(),/private-service-key|private-azure-key/);
});
test('unknown database codes and details never enter diagnostics',async()=>{
 const f=fixture({code:'private-azure-key',message:'secret-error',details:'secret-details'});
 await f.run();assert.equal(f.reports[0].code,'unclassified');
 assert.doesNotMatch(JSON.stringify(f.reports),/private-azure-key|secret-error|secret-details/);
});
test('oversized error responses are cancelled and not copied into diagnostics',async()=>{
 const f=fixture(null,{oversized:true});await f.run();
 assert.equal(f.reports[0].code,'unclassified');assert.doesNotMatch(JSON.stringify(f.reports),/secret-provider-key/);
});
test('successful preflight still requires both real provider checks before recording verification',async()=>{
 const f=fixture(null,{success:true}),response=await f.run();
 assert.equal(response.status,200);assert.deepEqual(await response.json(),{state:'provider_verified',syntheticOnly:true,userContentSent:false});
 assert.deepEqual(f.calls.map(x=>typeof x==='string'?x:x.operation),['azure_photo_worker_status','record_azure_photo_worker','reserve_azure_photo_probe','provider','provider','record_azure_photo_worker']);
 assert.equal(f.calls.at(-1).args.p_state,'provider_verified');assert.deepEqual(f.reports,[]);
});
