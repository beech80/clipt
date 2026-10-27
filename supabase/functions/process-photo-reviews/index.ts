import {serve} from 'https://deno.land/std@0.190.0/http/server.ts'
import {serverEnv,serviceClient,HttpError,errorResponse,jsonResponse} from '../_shared/request.ts'
import {photoWorkerAuthorized} from '../_shared/photo-worker-auth.ts'
import {runPhotoReview} from '../_shared/photo-review-workflow.ts'
import {analyzeAzureReview} from '../_shared/azure-review.ts'

serve(async req=>{
 if(req.method!=='POST')return jsonResponse({error:'Use POST'},405)
 try {
  if(!photoWorkerAuthorized(req.headers.get('x-clipt-worker-key'),Deno.env.get('CLIPT_AZURE_WORKER_SECRET')))
   throw new HttpError(401,'Worker authentication required')
  const enabled=serverEnv('SUPABASE_URL')==='https://akiksrlzdqvipqbbjxpw.supabase.co'
   &&['CLIPT_AZURE_WORKER_ENABLED','CLIPT_AZURE_REVIEW_ENABLED','CLIPT_AZURE_AUTO_QUARANTINE_ENABLED','CLIPT_AZURE_F0_VERIFIED'].every(key=>Deno.env.get(key)==='true')
  // Authenticated transport probes must never claim jobs, download or scan,
  // even if an operator changes flags during the verification request.
  if(req.headers.get('x-clipt-worker-probe')==='disabled-only'&&enabled)
   throw new HttpError(409,'Worker enablement requires review')
  const fixturePhase=req.headers.get('x-clipt-worker-probe')?.match(/^bounded-(prepare|run|cleanup)$/)?.[1]
  if(fixturePhase&&(enabled||serverEnv('SUPABASE_URL')!=='https://akiksrlzdqvipqbbjxpw.supabase.co'))
   throw new HttpError(409,'Bounded fixture requires disabled development dispatch')
  if(fixturePhase==='run'&&Deno.env.get('CLIPT_AZURE_F0_VERIFIED')!=='true')
   throw new HttpError(503,'Verified free-tier moderation required')
  if(!enabled&&!fixturePhase)
   throw new HttpError(503,'Automatic photo review is disabled')
  // No caller content, URLs or targets. Process at most one server-queued post.
  const client=serviceClient()
  const rpc=async(name:string,args:Record<string,unknown>={})=>{const {data,error}=await client.rpc(name,args);if(error)throw Error('Review state unavailable');return data}
  if(fixturePhase==='prepare'||fixturePhase==='cleanup') {
   const rows=await rpc('claim_photo_worker_fixture',{p_phase:fixturePhase})
   if(!Array.isArray(rows)||rows.length>1)throw Error('Invalid fixture state')
   if(!rows.length)return jsonResponse({state:'idle'})
   const row=rows[0]
   if(row.reserved!==true||typeof row.user_id!=='string'||typeof row.post_id!=='string'
    ||row.object_path!==row.user_id+'/worker-verification-'+row.post_id+'.png')throw Error('Invalid fixture binding')
   const storage=client.storage.from('media')
   if(fixturePhase==='prepare') {
    const png=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAeklEQVR4nO3PUQkAIBTAwBfHOIY1oCH8OITBAtxm7fN1wwUNaEEDWtCAFjSgBQ1oQQNa0IAWNKAFDWhBA1rQgBY0oAUNaEEDWtCAFjSgBQ1oQQNa0IAWNKAFDWhBA1rQgBY0oAUNaEEDWtCAFjSgBQ1oQQNa0IAWPHYB8mfBD+BOTa4AAAAASUVORK5CYII='),c=>c.charCodeAt(0))
    const {error}=await storage.upload(row.object_path,png,{contentType:'image/png',upsert:false})
    if(error){await rpc('finish_photo_worker_fixture',{p_phase:'prepare',p_success:false});throw Error('Fixture upload unconfirmed')}
   }else {
    const {error}=await storage.remove([row.object_path]);if(error)throw Error('Fixture cleanup unconfirmed')
   }
   if(await rpc('finish_photo_worker_fixture',{p_phase:fixturePhase,p_success:true})!==true)throw Error('Fixture completion unconfirmed')
   return jsonResponse({state:fixturePhase==='prepare'?'prepared':'cleaned'})
  }
  const jobs=await rpc(fixturePhase==='run'?'claim_photo_worker_fixture':'claim_public_photo_review',fixturePhase==='run'?{p_phase:'run'}:{})
  if(!Array.isArray(jobs)||jobs.length>1)throw Error('Invalid review queue')
  if(!jobs.length)return jsonResponse({state:'idle'})
  const job=jobs[0],uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if(job.reserved!==true||![job.request_id,job.post_id,job.user_id].every(value=>typeof value==='string'&&uuid.test(value)))throw Error('Invalid review queue')
  try {
   const result=await runPhotoReview(job.user_id,serverEnv('SUPABASE_URL'),{
    reserve:async()=>true, // Claim RPC atomically reserved this exact version.
    read:async()=>{const {data,error}=await client.from('posts').select('user_id,is_published,is_premium,is_subscriber_only,required_tier_id,moderation_hidden,post_type,image_url,video_url,content').eq('id',job.post_id).eq('user_id',job.user_id).single();if(error||!data)throw Error('Photo unavailable');return data},
    download:async(bucket,path)=>{const {data,error}=await client.storage.from(bucket).download(path);if(error||!data||data.size>4*1024*1024)throw Error('Photo unavailable');return new Uint8Array(await data.arrayBuffer())},
    analyze:input=>analyzeAzureReview({endpoint:serverEnv('AZURE_CONTENT_SAFETY_ENDPOINT'),key:serverEnv('AZURE_CONTENT_SAFETY_KEY'),tier:'F0',verifiedF0:true},input),
    finish:async state=>{if(await rpc('finish_azure_review_with_quarantine',{p_user:job.user_id,p_request:job.request_id,p_state:state})!==true)throw Error('Review completion unconfirmed')},
    log:event=>console.info(event),
   })
   // A duplicate reservation is not evidence of a completed scan. Keep held.
   const success=result.state==='no_flag_detected'||result.state==='needs_review'
   if(await rpc('finish_public_photo_dispatch',{p_request:job.request_id,p_success:success})!==true)throw Error('Dispatch completion unconfirmed')
   if(fixturePhase==='run'&&await rpc('finish_photo_worker_fixture',{p_phase:'run',p_success:success})!==true)throw Error('Fixture completion unconfirmed')
   return jsonResponse({state:success?'processed':'held'})
  } catch {
   try {await rpc('finish_public_photo_dispatch',{p_request:job.request_id,p_success:false})} catch {console.info('photo_dispatch_reconciliation_required')}
   if(fixturePhase==='run')try {await rpc('finish_photo_worker_fixture',{p_phase:'run',p_success:false})} catch {console.info('photo_fixture_reconciliation_required')}
   throw new HttpError(503,'Photo review completion unconfirmed; check current review status')
  }
 }catch(error){return errorResponse(error)}
})
