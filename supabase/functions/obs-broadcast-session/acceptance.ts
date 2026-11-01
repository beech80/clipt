import {obsProvider,ObsError,stopObs,type ObsDependencies,type ObsSession} from './lifecycle.ts';
export async function acceptanceRequestId(runId:string,attempt:string){
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('clipt-obs:'+runId+':'+attempt)));
 const hex=Array.from(bytes.slice(0,16),b=>b.toString(16).padStart(2,'0'));
 hex[6]='4'+hex[6][1];hex[8]='8'+hex[8][1];
 const x=hex.join('');return x.slice(0,8)+'-'+x.slice(8,12)+'-'+x.slice(12,16)+'-'+x.slice(16,20)+'-'+x.slice(20);
}
export async function obsAcceptance(action:string,args:Record<string,unknown>,requestId:string,d:ObsDependencies){
 if(action==='acceptance'){
  const s:ObsSession=await d.db('acceptance_reserve',{requestId});
  let p:any;
  if(s.needsProvision){
   try{
    p=obsProvider(await d.provider.create(s),s);
    if(p.status!=='idle')throw Error();
    await d.db('attach',{sessionId:s.sessionId,providerId:p.id,playbackId:p.playback_ids[0].id});
   }catch{
    await d.db('uncertain',{sessionId:s.sessionId,...(p?.id?{providerId:p.id}:{})}).catch(()=>undefined);
    if(p?.id)await d.provider.disable(p.id).catch(()=>undefined);
    throw new ObsError(503,'ACCEPTANCE_PENDING','Acceptance setup requires reconciliation');
   }
  }else if(s.providerId&&s.state==='ready')p=obsProvider(await d.provider.read(s.providerId),s);
  else throw new ObsError(409,'ACCEPTANCE_UNAVAILABLE','This acceptance request cannot be started again');
  if(typeof p.stream_key!=='string'||!/^[A-Za-z0-9_-]{8,256}$/.test(p.stream_key))throw new ObsError(502,'PROVIDER_UNVERIFIED','Acceptance credentials unavailable');
  return {sessionId:s.sessionId,ingestUrl:'rtmps://global-live.mux.com:443/app',streamKey:p.stream_key};
 }
 const s:ObsSession=await d.db('acceptance_current',{requestId,sessionId:args.sessionId});
 if(action==='acceptance-stop'){
  await d.db('stop_internal',{sessionId:s.sessionId});await stopObs(d,{...s,state:'stopping'});
  return {ended:true};
 }
 if(s.state==='ended'||s.state==='stopping'||Date.parse(s.expiresAt)<=d.now())return {live:false};
 const p=obsProvider(await d.provider.read(s.providerId!),s);
 if(p.status!=='active')return {live:false};
 const expires=Math.min(d.now()+60000,Date.parse(s.expiresAt));
 return {live:true,playbackUrl:await d.sign(p.playback_ids[0].id,expires)};
}
