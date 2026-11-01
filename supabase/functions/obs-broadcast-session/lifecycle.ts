// OBS lifecycle: pure orchestration with injected provider/storage for executable tests.
export type ObsSession={sessionId:string;streamId:string|null;state:string;providerId?:string;playbackId?:string;
 expiresAt:string;maxDurationSeconds:number;needsProvision?:boolean;tokenExpiresAt?:string;acceptance?:boolean;webhookVerified?:boolean};
export class ObsError extends Error {constructor(public status:number,public code:string,message:string){super(message);}}
export const OBS_INGEST='rtmps://global-live.mux.com:443/app';
export function uuid(value:unknown):string{
 if(typeof value!=='string'||!/^[-0-9a-f]{36}$/i.test(value)||!(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)))
  throw new ObsError(400,'INVALID_REQUEST','A valid broadcast identifier is required');return value;
}
export function obsProvider(value:any,s:ObsSession){
 if(!value||!(/^[A-Za-z0-9]{1,200}$/.test(value.id||''))||(s.providerId&&value.id!==s.providerId)
  ||value.passthrough!=='clipt-obs:'+s.sessionId||value.test!==false
  ||!['active','idle','disabled'].includes(value.status)||!Number.isInteger(value.max_continuous_duration)
  ||value.max_continuous_duration<60||value.max_continuous_duration>s.maxDurationSeconds
  ||!Array.isArray(value.playback_ids)||value.playback_ids.length!==1
  ||value.playback_ids[0].policy!=='signed'||!(/^[A-Za-z0-9]{1,200}$/.test(value.playback_ids[0].id||''))
  ||(s.playbackId&&s.playbackId!==value.playback_ids[0].id))
  throw new ObsError(502,'PROVIDER_UNVERIFIED','The live provider response could not be verified');
 return value;
}
export type ObsDependencies={
 now():number; db(action:string,args?:Record<string,unknown>):Promise<any>;
 provider:{create(s:ObsSession):Promise<unknown>;read(id:string):Promise<unknown>;disable(id:string):Promise<void>;list():Promise<{resources:any[];complete:boolean}>};
 sign(id:string,expires:number):Promise<string>;
};
function status(s:ObsSession|null){return s?{sessionId:s.sessionId,streamId:s.streamId,state:s.state,expiresAt:s.expiresAt,
 maxDurationSeconds:s.maxDurationSeconds,isLive:s.state==='active'}:null;}
export async function observeObs(d:ObsDependencies,s:ObsSession,webhook=false){
 if(!s.providerId||s.state==='ended')return s;
 const observedAt=new Date(d.now()).toISOString(),p=obsProvider(await d.provider.read(s.providerId),s);
 const next=await d.db('snapshot',{sessionId:s.sessionId,providerId:p.id,playbackId:p.playback_ids[0].id,status:p.status,observedAt,webhook});
 if(next.state==='stopping')await stopObs(d,next);
 return next;
}
export async function stopObs(d:ObsDependencies,s:ObsSession){
 if(s.state==='ended')return;
 if(!s.providerId)throw new ObsError(503,'STOP_PENDING','Broadcast setup is still being reconciled');
 await d.provider.disable(s.providerId);
 const p=obsProvider(await d.provider.read(s.providerId),s);
 if(p.status!=='disabled')throw new ObsError(503,'STOP_PENDING','Provider shutdown is not yet confirmed');
 await d.db('finish',{sessionId:s.sessionId,providerId:p.id});
}
export async function obsCommand(body:Record<string,unknown>,identity:Record<string,unknown>,d:ObsDependencies){
 if(body.protocolVersion!==1)throw new ObsError(400,'INVALID_PROTOCOL','Unsupported OBS protocol');
 if(body.action==='create'){
  const s:ObsSession=await d.db('reserve',{...identity,streamId:uuid(body.streamId),requestId:uuid(body.requestId)});
  if(s.needsProvision){
   let p:any;
   try{
    p=obsProvider(await d.provider.create(s),s);
    if(p.status!=='idle')throw new Error('Provider not idle');
    const attached=await d.db('attach',{sessionId:s.sessionId,providerId:p.id,playbackId:p.playback_ids[0].id});
    return {session:status(attached)};
   }catch{
    await d.db('uncertain',{sessionId:s.sessionId,...(p?.id?{providerId:p.id}:{})}).catch(()=>undefined);
    if(p?.id)await d.provider.disable(p.id).catch(()=>undefined);
    throw new ObsError(503,'PROVISION_PENDING','Setup is pending reconciliation. Keep this request; do not create another broadcast.');
   }
  }
  return {session:status(s)};
 }
 if(body.action==='erase'){
  const sessions=await d.db('owner_cleanup',identity);
  for(const s of sessions)await stopObs(d,s);
  return {state:'ended'};
 }
 if(body.action==='current'){
  const s=await d.db('current',identity);
  return {session:status(s?await observeObs(d,s):null)};
 }
 if(body.action==='stop'){
  const s=await d.db('stop',{...identity,sessionId:uuid(body.sessionId)});
  await stopObs(d,s);return {session:{...status(s),state:'ended',isLive:false}};
 }
 if(body.action==='credentials'){
  const s=await d.db('credentials',{...identity,sessionId:uuid(body.sessionId)});
  const p=obsProvider(await d.provider.read(s.providerId),s);
  if(!['idle','active'].includes(p.status)||typeof p.stream_key!=='string'||!(/^[A-Za-z0-9_-]{8,256}$/.test(p.stream_key)))
   throw new ObsError(409,'CREDENTIALS_UNAVAILABLE','Broadcast credentials are not available');
  return {ingestUrl:OBS_INGEST,streamKey:p.stream_key,expiresAt:s.expiresAt};
 }
 if(body.action==='playback'){
  // Lookup and re-read before leasing a short, capacity-counted playback token.
  const found=await d.db('viewer_candidate',{...identity,streamId:uuid(body.streamId)});
  await observeObs(d,found);
  const s:ObsSession=await d.db('playback',{...identity,streamId:uuid(body.streamId)});
  const expiry=Date.parse(s.tokenExpiresAt!);
  if(!Number.isFinite(expiry)||expiry<=d.now()||expiry>d.now()+181000)throw new ObsError(503,'PLAYBACK_UNAVAILABLE','Playback authorization unavailable');
  return {playbackUrl:await d.sign(s.playbackId!,expiry),expiresAt:new Date(expiry).toISOString()};
 }
 throw new ObsError(400,'INVALID_ACTION','Choose a valid OBS action');
}
export async function reconcileObs(d:ObsDependencies){
 const sessions:ObsSession[]=await d.db('list');let pending=0,ended=0;
 let listing:{resources:any[];complete:boolean}|undefined;
 for(let s of sessions){
  try{
   if(!s.providerId&&['provisioning','uncertain','stopping'].includes(s.state)){
    if(!listing)listing=await d.provider.list();
    const matching=listing.resources.filter(p=>p?.passthrough==='clipt-obs:'+s.sessionId);
    if(matching.length>1||!listing.complete)throw new Error('Ambiguous provider listing');
    if(matching.length===1){
     const p=obsProvider(matching[0],s);
     s=await d.db('adopt',{sessionId:s.sessionId,providerId:p.id,playbackId:p.playback_ids[0].id});
    }else if(Date.parse(s.expiresAt)<=d.now()||s.state==='stopping'){
     await d.db('finish',{sessionId:s.sessionId});ended++;continue;
    }else{pending++;continue;}
   }
   if(s.state==='stopping'){await stopObs(d,s);ended++;}
   else await observeObs(d,s);
  }catch{pending++;}
 }
 if(!pending)await d.db('worker_complete');
 return {checked:sessions.length,ended,pending};
}
