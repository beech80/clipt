import {serve} from 'https://deno.land/std@0.190.0/http/server.ts'
import {authenticatedUser,assertOwnUser,errorResponse,HttpError,jsonResponse,requestBody,requestMethod,serverEnv,serviceClient} from '../_shared/request.ts'
import {muxTestSnapshot} from '../_shared/mux-test-live.ts'

serve(async req=>{
 const method=requestMethod(req);if(method)return method
 let phase='authentication'
 try {
  const user=await authenticatedUser(req);const body=await requestBody(req);assertOwnUser(body.userId,user.id)
  phase='configuration'
  if(Deno.env.get('SUPABASE_URL')!=='https://akiksrlzdqvipqbbjxpw.supabase.co'
   ||Deno.env.get('CLIPT_MUX_TEST_LIVE_ENABLED')!=='true')throw new HttpError(503,'Development live pilot is disabled')
  const owner=serverEnv('CLIPT_MUX_TEST_LIVE_USER_ID');const localId=serverEnv('CLIPT_MUX_TEST_LIVE_STREAM_ID')
  const providerId=serverEnv('CLIPT_MUX_TEST_LIVE_PROVIDER_ID')
  if(user.id!==owner||body.streamId!==localId)throw new HttpError(403,'Designated stream owner required')
  if(body.action!=='status'&&body.action!=='credentials')throw new HttpError(400,'Invalid live action')
  if(!/^[A-Za-z0-9]+$/.test(providerId))throw new HttpError(503,'Live pilot configuration invalid')
  phase='ownership';const admin=serviceClient()
  const owned=await admin.from('streams').select('id,user_id').eq('id',localId).eq('user_id',user.id).maybeSingle()
  if(owned.error||!owned.data)throw new HttpError(404,'Owned stream unavailable')
  // Fixed HTTPS host, no redirects, bounded timeout, keys used only server-side.
  phase='credentials'
  const tokenId=serverEnv('MUX_TOKEN_ID').trim();const tokenSecret=serverEnv('MUX_TOKEN_SECRET').trim()
  if(!/^[\x21-\x7E]+$/.test(tokenId)||!/^[\x21-\x7E]+$/.test(tokenSecret))
   throw new HttpError(503,'Mux credential format is invalid; copy the API token pair without quotes or extra text')
  const observed=new Date().toISOString()
  phase='provider connection';let response
  try {response=await fetch('https://api.mux.com/video/v1/live-streams/'+providerId,{
   headers:{Authorization:'Basic '+btoa(tokenId+':'+tokenSecret)},
   redirect:'error',signal:AbortSignal.timeout(10000),
  })}catch(error){throw new HttpError(502,error instanceof Error&&['TimeoutError','AbortError'].includes(error.name)
   ?'Mux connection timed out; no live status assumed':'Mux connection failed before an HTTP response; no live status assumed')}
  if(!response.ok){
   const reason=response.status===401?'Mux credentials were rejected'
    :response.status===403?'Mux token lacks permission to read this stream'
    :response.status===404?'Mux test stream was not found in the configured token environment'
    :response.status===429?'Mux request limit reached; retry later'
    :'Provider status unavailable; no live status assumed'
   throw new HttpError(502,reason)
  }
  phase='provider validation';let envelope;let snapshot;
  try {envelope=await response.json();snapshot=muxTestSnapshot(envelope.data,providerId)}
  catch(error){
   const safe=['Mux stream identity could not be verified','Mux resource is not a verified test stream; paid streaming remains blocked',
    'Mux test duration could not be verified within the approved limit','Mux returned an unsupported live status',
    'Mux public test playback could not be verified']
   throw new HttpError(502,error instanceof Error&&safe.includes(error.message)?error.message:'Mux response could not be verified')
  }
  if(body.action==='credentials'){
   const key=envelope.data.stream_key
   if(typeof key!=='string'||key.length<8||key.length>256)throw new HttpError(502,'Provider credentials unavailable')
   return jsonResponse({id:localId,rtmp_url:'rtmps://global-live.mux.com:443/app',stream_key:key,test:true})
  }
  // Do not mint viewer counts, infer live from button presses, or return provider secrets.
  if(Deno.env.get('CLIPT_MUX_TEST_LIVE_SYNC_ENABLED')==='true'){
   const {data:applied,error}=await admin.rpc('apply_live_provider_snapshot',{
    p_stream_id:localId,p_owner_id:owner,p_provider_id:providerId,p_status:snapshot.provider_status,
    p_playback_url:snapshot.playback_url,p_observed_at:observed})
   if(error||applied!==true)throw new HttpError(503,'Verified stream synchronization unavailable')
  }
  return jsonResponse({id:localId,...snapshot,provider_stream_id:providerId,checked_at:new Date().toISOString(),test:true})
 }catch(error){
  if(!(error instanceof HttpError)){
   // Phase is a fixed code literal. Never log the error object, request, or keys.
   console.warn('mux_test_live_failure_phase',phase)
   return jsonResponse({error:'Live pilot failed during '+phase+'; no live status assumed'},500)
  }
  return errorResponse(error)
 }
})
