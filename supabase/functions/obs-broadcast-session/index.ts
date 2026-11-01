import {serve} from 'https://deno.land/std@0.190.0/http/server.ts';
import {authenticatedUser,HttpError,serviceClient,requestBody,requestMethod,jsonResponse,errorResponse} from '../_shared/request.ts';
import {verifyMuxSignature} from '../_shared/mux-webhook-signature.ts';
import {verifyObsOidc,attestObsRunner} from '../_shared/obs-beta-oidc.mjs';
import {importNativeSigningKey,nativePlaybackUrl} from '../native-broadcast-session/crypto.ts';
import {obsCommand,observeObs,reconcileObs,ObsError,uuid,type ObsDependencies} from './lifecycle.ts';
import {obsAcceptance,acceptanceRequestId} from './acceptance.ts';
import {clearObsRecordings} from './recordings.ts';
import {muxRejectionCode,obsProviderShape} from './diagnostics.ts';
import {bootstrapObs} from './bootstrap.ts';
const ORIGIN='https://slnjliheyiiummxhrgmk.supabase.co';
const REVIEWED_RUNNER={".github/workflows/obs-beta-operations.yml":"cef7a8335a00726f43d9d69ee2b6a809f1f8e735f209c3c60758e4b5df978a81","scripts/obs-beta-operations.mjs":"a7239e306dfad1b295356d0718b1fc76f62fd74c2870eaa7220de513c451163b"};
const env=(name:string)=>Deno.env.get(name)||'';
async function db(action:string,args:Record<string,unknown>={}){
 const result=await serviceClient().rpc('obs_beta_admin',{p_action:action,p_args:args});
 if(result.error){
  const code=result.error.code;
  throw new ObsError(code==='42501'?403:code==='22023'||code==='22P02'?400:code==='P0001'||code==='23505'?409:503,
   code==='42501'?'SESSION_FORBIDDEN':code==='P0001'?'BETA_LIMIT':'SESSION_UNAVAILABLE',
   code==='P0001'?'Beta broadcast or viewer capacity reached. Try later.':'Broadcast authorization, setup or session is unavailable.');
 }return result.data;
}
async function providerRequest(path:string,method='GET',body?:unknown){
 if(!(/^\/(?:video\/v1\/(?:live-streams(?:\/[A-Za-z0-9]+(?:\/disable)?)?(?:\?limit=100&page=\d{1,2})?|assets(?:\/[A-Za-z0-9]+|\?live_stream_id=[A-Za-z0-9]+&limit=100&page=\d{1,2}))|system\/v1\/(?:signing-keys|webhooks|whoami)(?:\/[A-Za-z0-9]+)?)$/).test(path))
  throw new ObsError(503,'PROVIDER_UNAVAILABLE','Provider request unavailable');
 const id=env('MUX_TOKEN_ID'),secret=env('MUX_TOKEN_SECRET');
 if(!/^[!-~]{1,500}$/.test(id)||!/^[!-~]{1,500}$/.test(secret))throw new ObsError(503,'PROVIDER_UNAVAILABLE','Mux token is not configured');
 let response:Response;
 try{response=await fetch('https://api.mux.com'+path,{method,
  headers:{Authorization:'Basic '+btoa(id+':'+secret),'Content-Type':'application/json','Cache-Control':'no-cache'},
  ...(body===undefined?{}:{body:JSON.stringify(body)}),redirect:'error',signal:AbortSignal.timeout(12000)});
 }catch{throw new ObsError(502,'PROVIDER_UNAVAILABLE','Mux could not be reached');}
 if(response.status===404&&/^\/video\/v1\/assets\/[A-Za-z0-9]+$/.test(path)){await response.body?.cancel();return null;}
 if(!response.ok)throw new ObsError(502,await muxRejectionCode(response),'Mux could not confirm this operation');
 if(response.status===204)return null;
 const reader=response.body?.getReader();if(!reader)throw new ObsError(502,'PROVIDER_UNVERIFIED','Mux returned no response');
 const parts:Uint8Array[]=[];let count=0;
 for(;;){const p=await reader.read();if(p.done)break;count+=p.value.length;if(count>1500000){await reader.cancel();throw new ObsError(502,'PROVIDER_UNVERIFIED','Mux response exceeds allowed size');}parts.push(p.value);}
 const all=new Uint8Array(count);let offset=0;for(const p of parts){all.set(p,offset);offset+=p.length;}
 try{return JSON.parse(new TextDecoder().decode(all)).data;}catch{throw new ObsError(502,'PROVIDER_UNVERIFIED','Mux response was invalid');}
}
async function dependencies():Promise<ObsDependencies>{
 const config=await db('configuration');
 return {now:()=>Date.now(),db,provider:{
  create:s=>providerRequest('/video/v1/live-streams','POST',{test:false,max_continuous_duration:s.maxDurationSeconds,
   playback_policies:['signed'],new_asset_settings:{playback_policies:['signed'],max_resolution_tier:'1080p',video_quality:'plus'},
   reconnect_window:60,latency_mode:'standard',passthrough:'clipt-obs:'+s.sessionId}),
  read:id=>providerRequest('/video/v1/live-streams/'+id),
  clearRecordings:(id,snapshot)=>clearObsRecordings(id,snapshot,providerRequest),
  disable:async id=>{await providerRequest('/video/v1/live-streams/'+id+'/disable','PUT');},
  list:async()=>{
   const resources:any[]=[];
   for(let page=1;page<=10;page++){
    const batch=await providerRequest('/video/v1/live-streams?limit=100&page='+page);
    if(!Array.isArray(batch))throw new ObsError(502,'PROVIDER_UNVERIFIED','Provider listing unavailable');
    resources.push(...batch);if(batch.length<100)return {resources,complete:true};
   }return {resources,complete:false};
  }
 },sign:async(id,expires)=>{
  if(!/^[A-Za-z0-9]{1,200}$/.test(config.signingId||''))throw new ObsError(503,'SIGNING_UNAVAILABLE','Private playback signing unavailable');
  return nativePlaybackUrl(id,expires,config.signingId,await importNativeSigningKey(config.privateKey));
 }};
}
async function identity(req:Request,allowRevoked=false){
 const user=await authenticatedUser(req,{accountManagement:allowRevoked});
 try{
  const payload=req.headers.get('Authorization')!.slice(7).split('.')[1].replaceAll('-','+').replaceAll('_','/');
  const claims=JSON.parse(atob(payload));return {ownerId:user.id,authSessionId:uuid(claims.session_id),aal:claims.aal==='aal2'?'aal2':'aal1'};
 }catch{throw new ObsError(401,'AUTHENTICATION_REQUIRED','A current signed-in session is required');}
}
async function webhook(req:Request){
 const reader=req.body?.getReader();if(!reader)throw new ObsError(400,'INVALID_WEBHOOK','Webhook body required');
 const parts:Uint8Array[]=[];let count=0;
 for(;;){const p=await reader.read();if(p.done)break;count+=p.value.length;if(count>65536){await reader.cancel();throw new ObsError(413,'INVALID_WEBHOOK','Webhook too large');}parts.push(p.value);}
 const raw=new Uint8Array(count);let offset=0;for(const p of parts){raw.set(p,offset);offset+=p.length;}
 const c=await db('configuration');
 if(!await verifyMuxSignature(raw,req.headers.get('mux-signature'),c.webhookSecret||''))throw new ObsError(401,'INVALID_WEBHOOK','Invalid webhook signature');
 let event:any;try{event=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));}catch{throw new ObsError(400,'INVALID_WEBHOOK','Invalid webhook body');}
 if(!['video.live_stream.active','video.live_stream.idle','video.live_stream.disabled'].includes(event?.type))return jsonResponse({ignored:true});
 if(!/^[A-Za-z0-9]{1,200}$/.test(event.data?.id||''))throw new ObsError(400,'INVALID_WEBHOOK','Invalid webhook identity');
 const s=await db('lookup',{providerId:event.data.id});
 if(s)await observeObs(await dependencies(),s,true); // Provider re-read defeats replay and stale ordering.
 return jsonResponse({received:true});
}
serve(async req=>{
 const url=new URL(req.url),method=requestMethod(req);
 try{
  if(env('SUPABASE_URL')!==ORIGIN)throw new ObsError(503,'WRONG_ENVIRONMENT','Production OBS service unavailable');
  if(req.method==='GET'&&url.pathname.endsWith('/status')){
   if(url.searchParams.get('check')==='provider'){
    const account=await providerRequest('/system/v1/whoami'),resources=await providerRequest('/video/v1/live-streams?limit=100&page=1');
    return jsonResponse({videoWrite:Array.isArray(account?.permissions)&&account.permissions.includes('video:write'),
     systemWrite:Array.isArray(account?.permissions)&&account.permissions.includes('system:write'),
     obsResources:Array.isArray(resources)?resources.filter(p=>typeof p.passthrough==='string'&&p.passthrough.startsWith('clipt-obs:')).slice(0,5).map(p=>obsProviderShape(p)):[]});
   }
   try{const c=await db('configuration');
    return jsonResponse({protocolVersion:1,enabled:c.enabled===true,configured:c.bootstrapState==='ready',
     operationsReady:typeof c.workerAt==='string'&&Date.parse(c.workerAt)>Date.now()-600000,
     maxDurationSeconds:c.sessionSeconds,monthlyBroadcastMinutes:c.monthlyMinutes,
     concurrentBroadcasts:1,authorizedViewerSessions:5,phoneBroadcasting:false});
   }catch{return jsonResponse({protocolVersion:1,enabled:false,configured:false,operationsReady:false,phoneBroadcasting:false});}
  }
  if(method)return method;
  if(url.searchParams.get('hook')==='mux')return await webhook(req);
  // No credentials are sent through pg_net. This endpoint can only claim
  // rate-limited teardown work derived from the database's own expiry checks.
  if(url.searchParams.get('operation')==='expire'){
   const result=await reconcileObs(await dependencies(),true);
   return jsonResponse(result,result.pending?503:200);
  }
  if(['reconcile','acceptance','acceptance-status','acceptance-stop'].includes(url.searchParams.get('operation')||'')){
   let claims;
   try{const token=req.headers.get('Authorization')?.match(/^Bearer ([^\s,]+)$/i)?.[1];
    claims=await verifyObsOidc(token);await attestObsRunner(claims,REVIEWED_RUNNER);
   }catch{throw new ObsError(401,'WORKER_FORBIDDEN','Reviewed scheduled worker authorization required');}
   const operation=url.searchParams.get('operation')!;
   if(operation!=='reconcile'){
    const body=await requestBody(req),requestId=await acceptanceRequestId(claims.run_id,claims.run_attempt);
    if(operation!=='acceptance')uuid(body.sessionId);
    return jsonResponse(await obsAcceptance(operation,body,requestId,await dependencies()));
   }
   const configured=await bootstrapObs({db,request:providerRequest,checkKey:async key=>{await importNativeSigningKey(key);}});
   const result=await reconcileObs(await dependencies());
   return jsonResponse({...configured,...result},result.pending?503:200);
  }
  const body=await requestBody(req),who=await identity(req,body.action==='stop'||body.action==='erase');
  return jsonResponse(await obsCommand(body,who,await dependencies()));
 }catch(error){
  if(error instanceof ObsError)return jsonResponse({error:error.message,code:error.code},error.status);
  if(error instanceof HttpError)return errorResponse(error);
  return jsonResponse({error:'The OBS operation could not be completed',code:'OBS_UNAVAILABLE'},503);
 }
});
