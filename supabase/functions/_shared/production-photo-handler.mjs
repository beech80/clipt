import {verifyPhotoOidc,attestPhotoRunner} from './photo-review-oidc.mjs';
const SOURCE='https://slnjliheyiiummxhrgmk.supabase.co';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const SYNTHETIC_PNG='iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAeklEQVR4nO3PUQkAIBTAwBfHOIY1oCH8OITBAtxm7fN1wwUNaEEDWtCAFjSgBQ1oQQNa0IAWNKAFDWhBA1rQgBY0oAUNaEEDWtCAFjSgBQ1oQQNa0IAWNKAFDWhBA1rQgBY0oAUNaEEDWtCAFjSgBQ1oQQNa0IAWPHYB8mfBD+BOTa4AAAAASUVORK5CYII=';
export function createAzurePhotoHandler({reviewedFiles,getEnv,analyze,review,fetchImpl=fetch,verifyToken=verifyPhotoOidc,attestRunner=attestPhotoRunner}){
 return async req=>{
  if(req.method!=='POST')return json({error:'Use POST'},405);
  let claims;
  try{
   const token=req.headers.get('Authorization')?.match(/^Bearer ([A-Za-z0-9_.-]+)$/)?.[1];
   claims=await verifyToken(token,{fetchImpl});
   await attestRunner(claims,reviewedFiles,{fetchImpl});
  }catch{return json({error:'Not authorized'},401);}
  let action;
  try{const value=await req.text();if(value.length>1000)throw Error();const body=JSON.parse(value);
   if(Object.keys(body).length!==1||!['probe','tick'].includes(body.action))throw Error();action=body.action;
  }catch{return json({error:'Invalid request'},400);}
  const key=getEnv('SUPABASE_SERVICE_ROLE_KEY');
  if(getEnv('SUPABASE_URL')!==SOURCE||!key)return json({error:'Wrong worker environment'},503);
  async function rpc(name,body={}){
   const r=await fetchImpl(SOURCE+'/rest/v1/rpc/'+name,{method:'POST',redirect:'error',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
   if(!r.ok){await r.body?.cancel();throw Error('state-unavailable');}const text=await r.text();if(text.length>50000)throw Error();return JSON.parse(text);
  }
  let probeStage='worker_status';
  try{
   const status=await rpc('azure_photo_worker_status');
   if(action==='tick'&&status?.enabled!==true)return json({state:'disabled'});
   if(status?.verifiedFreeTier!==true)return json({state:'configuration_required',missing:['verified_F0_resource']},503);
   const endpoint=getEnv('AZURE_CONTENT_SAFETY_ENDPOINT'),azureKey=getEnv('AZURE_CONTENT_SAFETY_KEY');
   if(!endpoint||!azureKey)return json({state:'configuration_required',missing:[...(!endpoint?['AZURE_CONTENT_SAFETY_ENDPOINT']:[]),...(!azureKey?['AZURE_CONTENT_SAFETY_KEY']:[])]},503);
   if(endpoint!=='https://clipt-content-safety-dev.cognitiveservices.azure.com/')return json({state:'configuration_required',missing:['approved_Azure_endpoint']},503);
   const scan=input=>analyze({endpoint,key:azureKey,tier:'F0',verifiedF0:true},input);
   if(action==='probe'){
    probeStage='probe_budget';
    if(await rpc('reserve_azure_photo_probe',{p_run:claims.run_id,p_attempt:claims.run_attempt})!==true)return json({state:'held',reason:'probe_limit_or_replay'},409);
    for(const input of [{imageBase64:SYNTHETIC_PNG},{caption:'CLIPT moderation connection check.'}]){
     probeStage=input.imageBase64?'provider_image':'provider_caption';
     if(!['no_flag_detected','needs_review'].includes(await scan(input)))throw Error('provider-unconfirmed');
    }
    probeStage='probe_record';
    if(await rpc('record_azure_photo_worker',{p_state:'provider_verified'})!==true)throw Error('state-unavailable');
    return json({state:'provider_verified',syntheticOnly:true,userContentSent:false});
   }
   if(status.enabled!==true){await rpc('record_azure_photo_worker',{p_state:'disabled'});return json({state:'disabled'});}
   if(status.moderatorReady!==true)return json({state:'moderator_setup_required'},503);
   await rpc('reconcile_stale_photo_reviews');
   let rows;
   try{rows=await rpc('claim_public_photo_review');}catch{
    // No budget reservation is refunded or fabricated. Human queue stays available.
    await rpc('record_azure_photo_worker',{p_state:'held'});return json({state:'held',reason:'review_queue_or_quota_requires_attention'});
   }
   if(!Array.isArray(rows)||rows.length>1)throw Error('invalid-queue');
   if(!rows.length){await rpc('record_azure_photo_worker',{p_state:'idle'});return json({state:'idle'});}
   const job=rows[0],uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
   if(job.reserved!==true||![job.user_id,job.post_id,job.request_id].every(x=>typeof x==='string'&&uuid.test(x)))throw Error('invalid-queue');
   try{
    const result=await review(job.user_id,SOURCE,{
     reserve:async()=>true,
     read:async()=>{
      const url=SOURCE+'/rest/v1/posts?select=user_id,is_published,is_premium,is_subscriber_only,required_tier_id,moderation_hidden,post_type,image_url,video_url,content&id=eq.'+job.post_id+'&user_id=eq.'+job.user_id;
      const r=await fetchImpl(url,{redirect:'error',headers:{apikey:key,Authorization:'Bearer '+key},signal:AbortSignal.timeout(15000)});
      if(!r.ok)throw Error('source-unavailable');const rows=await r.json();if(!Array.isArray(rows)||rows.length!==1)throw Error('source-unavailable');return rows[0];
     },
     download:async(bucket,path)=>{
      if(!['media','posts'].includes(bucket)||typeof path!=='string'||!path.startsWith(job.user_id+'/')||path.split('/').some(s=>!s||s==='.'||s==='..'))throw Error('invalid-source');
      const r=await fetchImpl(SOURCE+'/storage/v1/object/authenticated/'+bucket+'/'+path.split('/').map(encodeURIComponent).join('/'),{redirect:'error',headers:{apikey:key,Authorization:'Bearer '+key},signal:AbortSignal.timeout(20000)});
      if(!r.ok)throw Error('source-unavailable');
      const reader=r.body?.getReader();if(!reader)throw Error('source-unavailable');const chunks=[];let size=0;
      for(;;){const n=await reader.read();if(n.done)break;size+=n.value.length;if(size>4*1024*1024){await reader.cancel();throw Error('photo-too-large');}chunks.push(n.value);}
      const bytes=new Uint8Array(size);let offset=0;for(const b of chunks){bytes.set(b,offset);offset+=b.length;}return bytes;
     },
     analyze:scan,
     finish:async state=>{if(await rpc('finish_azure_review_with_quarantine',{p_user:job.user_id,p_request:job.request_id,p_state:state})!==true)throw Error('completion-unconfirmed');},
     log:()=>{},
    });
    const success=['no_flag_detected','needs_review'].includes(result.state);
    if(await rpc('finish_public_photo_dispatch',{p_request:job.request_id,p_success:success})!==true)throw Error('completion-unconfirmed');
    await rpc('record_azure_photo_worker',{p_state:success?'processed':'held'});return json({state:success?'processed':'held'});
   }catch{
    try{await rpc('finish_azure_review_with_quarantine',{p_user:job.user_id,p_request:job.request_id,p_state:'failed'});}catch{}
    try{await rpc('finish_public_photo_dispatch',{p_request:job.request_id,p_success:false});}catch{}
    await rpc('record_azure_photo_worker',{p_state:'failed'});
    return json({state:'held',reason:'scan_unconfirmed_human_review_required'});
   }
  }catch(cause){
   // Surface only a bounded status for an authenticated synthetic probe.
   // Never return the provider body, request, endpoint value, key or content.
   if(action==='probe'&&[400,401,403,404,408,409,413,415,422,429,500,502,503,504].includes(cause?.providerStatus)){
    const status=cause.providerStatus;
    return json({state:status===429||status>=500?'held':'configuration_required',reason:'provider_probe_failed'},status);
   }
   if(action==='probe'){
    const messages={
     'Verified free-tier moderation configuration required':'invalid_provider_configuration',
     'Invalid moderation input':'invalid_input',
     'One moderation input required':'invalid_input',
     'Moderation response unavailable':'invalid_provider_response',
     'Moderation temporarily unavailable':'provider_transport',
     'Moderation quota reached; review remains pending':'provider_quota',
     'state-unavailable':'database_rpc',
     'provider-unconfirmed':'invalid_provider_result',
    };
    const kind=Object.hasOwn(messages,cause?.message)?messages[cause.message]:'internal_error';
    return json({state:'held',reason:'probe_failed',diagnostic:{stage:probeStage,kind}},503);
   }
   return json({error:'Photo review unavailable; no approval was issued'},503);
  }
 };
}
