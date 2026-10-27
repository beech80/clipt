import {serve} from 'https://deno.land/std@0.190.0/http/server.ts'
import {HttpError,errorResponse,jsonResponse,serverEnv,serviceClient} from '../_shared/request.ts'
import {verifyMuxSignature} from '../_shared/mux-webhook-signature.ts'
import {muxTestSnapshot} from '../_shared/mux-test-live.ts'

serve(async req=>{
 try {
  if(req.method!=='POST')throw new HttpError(405,'Use POST for this endpoint')
  if(Deno.env.get('SUPABASE_URL')!=='https://akiksrlzdqvipqbbjxpw.supabase.co'
   ||Deno.env.get('CLIPT_MUX_TEST_LIVE_ENABLED')!=='true'
   ||Deno.env.get('CLIPT_MUX_TEST_LIVE_SYNC_ENABLED')!=='true')throw new HttpError(503,'Development live synchronization is disabled')
  const reader=req.body?.getReader();if(!reader)throw new HttpError(400,'Webhook body required')
  const chunks:Uint8Array[]=[];let size=0
  while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;
   if(size>65536){await reader.cancel();throw new HttpError(413,'Webhook body too large')}chunks.push(part.value)}
  const raw=new Uint8Array(size);let offset=0;for(const chunk of chunks){raw.set(chunk,offset);offset+=chunk.length}
  if(!await verifyMuxSignature(raw,req.headers.get('mux-signature'),serverEnv('MUX_TEST_WEBHOOK_SECRET')))
   throw new HttpError(401,'Invalid webhook signature')
  let event;try{event=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw))}catch{throw new HttpError(400,'Invalid webhook body')}
  const provider=serverEnv('CLIPT_MUX_TEST_LIVE_PROVIDER_ID')
  if(!/^[A-Za-z0-9]+$/.test(provider))throw new HttpError(503,'Invalid stream configuration')
  if(!['video.live_stream.active','video.live_stream.idle','video.live_stream.disabled'].includes(event?.type)
   ||event?.data?.id!==provider)return jsonResponse({ignored:true})
  if(typeof event.id!=='string'||!/^[A-Za-z0-9_-]{1,200}$/.test(event.id))throw new HttpError(400,'Invalid webhook identity')
  // Never trust event data to set live state. Re-read the fixed test resource.
  const observed=new Date().toISOString()
  const tokenId=serverEnv('MUX_TOKEN_ID').trim(),tokenSecret=serverEnv('MUX_TOKEN_SECRET').trim()
  if(!/^[\x21-\x7E]+$/.test(tokenId)||!/^[\x21-\x7E]+$/.test(tokenSecret))throw new HttpError(503,'Invalid provider credentials')
  const response=await fetch('https://api.mux.com/video/v1/live-streams/'+provider,{
   headers:{Authorization:'Basic '+btoa(tokenId+':'+tokenSecret)},redirect:'error',signal:AbortSignal.timeout(10000)})
  if(!response.ok)throw new HttpError(502,'Provider state unavailable')
  const envelope=await response.json();const snapshot=muxTestSnapshot(envelope.data,provider)
  const {error}=await serviceClient().rpc('apply_live_webhook_snapshot',{
   p_event_id:event.id,
   p_stream_id:serverEnv('CLIPT_MUX_TEST_LIVE_STREAM_ID'),p_owner_id:serverEnv('CLIPT_MUX_TEST_LIVE_USER_ID'),
   p_provider_id:provider,p_status:snapshot.provider_status,p_playback_url:snapshot.playback_url,p_observed_at:observed})
  if(error)throw new HttpError(503,'Verified stream synchronization unavailable')
  return jsonResponse({received:true})
 }catch(error){return errorResponse(error)}
})
