import {serve} from 'https://deno.land/std@0.190.0/http/server.ts';
import {authenticatedUser,HttpError,serviceClient} from '../_shared/request.ts';
import {verifyMuxSignature} from '../_shared/mux-webhook-signature.ts';
import {nativeCommand,nativeError,nativeHeaders,nativeRequestBody,nativeResponse,NativeSessionError,
 NATIVE_DEVELOPMENT_ORIGIN,providerSnapshot,validUuid,type NativeDependencies,type NativeSession} from './protocol.ts';
import {nativeRandomToken,nativeTokenHash,equalNativeSecret,importNativeSigningKey,nativePlaybackUrl} from './crypto.ts';
import {reconcileNativeBroadcasts} from './reconcile.ts';

function env(name:string){return Deno.env.get(name)??'';}
function providerCredentials() {
 const id=env('MUX_TOKEN_ID'),secret=env('MUX_TOKEN_SECRET');
 if(!/^[\x21-\x7e]{1,500}$/.test(id)||!/^[\x21-\x7e]{1,500}$/.test(secret))
  throw new NativeSessionError(503,'PROVIDER_UNAVAILABLE','Broadcast provider is unavailable');
 return 'Basic '+btoa(id+':'+secret);
}
async function providerRequest(path:string,method='GET',body?:unknown) {
 if(!/^\/video\/v1\/live-streams(?:\/[A-Za-z0-9]+(?:\/disable)?)?(?:\?limit=100&page=\d{1,2})?$/.test(path))
  throw new NativeSessionError(503,'PROVIDER_UNAVAILABLE','Broadcast provider is unavailable');
 let response:Response;
 try { response=await fetch('https://api.mux.com'+path,{
  method,headers:{Authorization:providerCredentials(),'Content-Type':'application/json','Cache-Control':'no-cache'},
  ...(body===undefined?{}:{body:JSON.stringify(body)}),redirect:'error',signal:AbortSignal.timeout(10000),
 }); } catch {throw new NativeSessionError(502,'PROVIDER_UNAVAILABLE','Broadcast provider is temporarily unavailable');}
 if(!response.ok)throw new NativeSessionError(502,'PROVIDER_UNAVAILABLE','Broadcast provider is temporarily unavailable');
 if(response.status===204)return null;
 try {return (await response.json()).data;}
 catch {throw new NativeSessionError(502,'PROVIDER_UNVERIFIED','Broadcast provider returned an invalid response');}
}
function verifiedSessionClaims(req:Request) {
 try {
  const raw=req.headers.get('Authorization')!.slice(7).split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
  const claims=JSON.parse(atob(raw));
  return {sessionId:validUuid(claims.session_id),aal:claims.aal==='aal2'?'aal2' as const:'aal1' as const};
 }catch {throw new NativeSessionError(401,'AUTHENTICATION_REQUIRED','A current signed-in session is required');}
}
function databaseError(error:any) {
 if(error?.code==='42501')return new NativeSessionError(403,'SESSION_FORBIDDEN','Broadcast authorization is invalid or expired');
 if(error?.code==='22023'||error?.code==='22P02')return new NativeSessionError(400,'INVALID_REQUEST','Broadcast settings or request identity are invalid');
 if(error?.code==='P0001'||error?.code==='23505')return new NativeSessionError(409,'SESSION_CONFLICT','A broadcast already exists or the creation limit has been reached');
 return new NativeSessionError(503,'SESSION_UNAVAILABLE','Broadcast session storage is unavailable');
}
async function dependencies(needsSigning:boolean):Promise<NativeDependencies> {
 const admin=serviceClient();
 const keyId=env('MUX_SIGNING_KEY_ID'),privateKey=env('MUX_SIGNING_PRIVATE_KEY');
 let signingKey:CryptoKey|undefined;
 if(needsSigning)signingKey=await importNativeSigningKey(privateKey);
 const mode=env('CLIPT_NATIVE_MUX_MODE')==='paid'?'paid':'test';
 const seconds=Number(env('CLIPT_NATIVE_MAX_DURATION_SECONDS')||(mode==='test'?'300':'3600'));
 return {
  now:()=>Date.now(),randomToken:nativeRandomToken,hashToken:nativeTokenHash,
  authenticate:async(req,options)=>{
   let user;
   try {user=await authenticatedUser(req,{accountManagement:options?.allowRevoked===true});}
   catch(error){if(error instanceof HttpError)throw new NativeSessionError(error.status,'AUTHENTICATION_REQUIRED',error.message);throw error;}
   const claims=verifiedSessionClaims(req);
   return {id:user.id,authSessionId:claims.sessionId,aal:claims.aal};
  },
  db:async(action,args)=>{
   const {data,error}=await admin.rpc('native_broadcast_admin',{p_action:action,p_args:args});
   if(error)throw databaseError(error);return data;
  },
  provider:{
   create:s=>providerRequest('/video/v1/live-streams','POST',{
    test:s.providerMode==='test',max_continuous_duration:s.maxDurationSeconds,
    playback_policies:['signed'],new_asset_settings:{playback_policies:['signed']},
    reconnect_window:60,latency_mode:'standard',passthrough:s.sessionId,
   }),
   read:id=>providerRequest('/video/v1/live-streams/'+id),
   disable:async id=>{await providerRequest('/video/v1/live-streams/'+id+'/disable','PUT');},
  },
  signPlayback:async(id,expiresAt)=>{
   const key=signingKey??await importNativeSigningKey(privateKey);
   return nativePlaybackUrl(id,expiresAt,keyId,key);
  },
  config:{origin:env('SUPABASE_URL'),enabled:env('CLIPT_NATIVE_BROADCAST_ENABLED')==='true',
   provisioningEnabled:env('CLIPT_NATIVE_MUX_CREATE_ENABLED')==='true',mode,
   paidApproved:env('CLIPT_NATIVE_MUX_PAID_APPROVED')==='true',
   maxDurationSeconds:seconds,testOwnerId:env('CLIPT_NATIVE_TEST_OWNER_ID'),signingReady:!!keyId&&!!privateKey&&/^[A-Za-z0-9]{1,200}$/.test(keyId)},
 };
}
async function readWebhook(req:Request) {
 const reader=req.body?.getReader();if(!reader)throw new NativeSessionError(400,'INVALID_WEBHOOK','Webhook body required');
 const parts:Uint8Array[]=[];let count=0;
 while(true){const part=await reader.read();if(part.done)break;count+=part.value.length;
  if(count>65536){await reader.cancel();throw new NativeSessionError(413,'INVALID_WEBHOOK','Webhook body too large');}parts.push(part.value);}
 const raw=new Uint8Array(count);let off=0;for(const p of parts){raw.set(p,off);off+=p.length;}
 if(!await verifyMuxSignature(raw,req.headers.get('mux-signature'),env('MUX_NATIVE_WEBHOOK_SECRET')))
  throw new NativeSessionError(401,'INVALID_WEBHOOK','Invalid webhook signature');
 let event:any;
 try {event=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));}
 catch {throw new NativeSessionError(400,'INVALID_WEBHOOK','Invalid webhook body');}
 return event;
}
async function webhook(req:Request) {
 const event=await readWebhook(req);
 if(!['video.live_stream.active','video.live_stream.idle','video.live_stream.disabled'].includes(event?.type))
  return nativeResponse({ignored:true});
 if(typeof event.id!=='string'||!/^[A-Za-z0-9_-]{1,200}$/.test(event.id)
   ||typeof event?.data?.id!=='string'||!/^[A-Za-z0-9]{1,200}$/.test(event.data.id))
  throw new NativeSessionError(400,'INVALID_WEBHOOK','Invalid webhook identity');
 const d=await dependencies(false);
 const s=await d.db('lookup_provider',{providerId:event.data.id}) as NativeSession|null;
 if(!s)return nativeResponse({ignored:true});
 const observedAt=new Date(d.now()).toISOString();
 // Signed event is a notification only. Re-read Mux to defeat stale/replayed events.
 const resource=providerSnapshot(await d.provider.read(s.providerId!),s);
 await d.db('snapshot',{sessionId:s.sessionId,providerId:resource.id,status:resource.status,
  playbackId:resource.playback_ids[0].id,observedAt,eventId:event.id});
 return nativeResponse({received:true});
}
async function reconcile(req:Request) {
 const header=req.headers.get('Authorization')?.match(/^Bearer ([A-Za-z0-9_-]{64,256})$/);
 if(!header||!await equalNativeSecret(header[1],env('CLIPT_NATIVE_RECONCILE_TOKEN')))
  throw new NativeSessionError(401,'RECONCILE_FORBIDDEN','Scheduled worker authorization required');
 const d=await dependencies(false);
 const result=await reconcileNativeBroadcasts(d,async()=>{
  const resources:unknown[]=[];
  for(let page=1;page<=10;page++){
   const data=await providerRequest('/video/v1/live-streams?limit=100&page='+page);
   if(!Array.isArray(data))throw new NativeSessionError(502,'PROVIDER_UNVERIFIED','Provider listing could not be verified');
   resources.push(...data);
   if(data.length<100)return {resources,complete:true};
  }
  return {resources,complete:false};
 });
 return nativeResponse(result,result.pending?503:200);
}
serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:nativeHeaders});
 if(req.method!=='POST')return nativeResponse({error:'Use POST for this endpoint',code:'INVALID_METHOD'},405);
 try {
  // Hard development project boundary. Disabling creation does not disable stop,
  // webhooks or scheduled cleanup of existing resources.
  if(env('SUPABASE_URL')!==NATIVE_DEVELOPMENT_ORIGIN)
   throw new NativeSessionError(503,'NATIVE_DISABLED','Native broadcasting is not enabled for this environment');
  if(new URL(req.url).searchParams.get('hook')==='mux')return await webhook(req);
  const body=await nativeRequestBody(req);
  if(body.action==='reconcile'){
   if(body.protocolVersion!==1)throw new NativeSessionError(400,'INVALID_PROTOCOL','Unsupported broadcasting protocol');
   return await reconcile(req);
  }
  const d=await dependencies(body.action==='create'||body.action==='playback');
  return nativeResponse(await nativeCommand(req,body,d));
 }catch(error){return nativeError(error);}
});
