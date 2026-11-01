import {supabase} from '@/lib/supabase';
import {storageProjectUrl} from '@/integrations/supabase/client';
export type ObsSession={sessionId:string;streamId:string;state:string;isLive:boolean;expiresAt:string;maxDurationSeconds:number};
export type ObsReadiness={enabled:boolean;configured:boolean;operationsReady:boolean;maxDurationSeconds:number;monthlyBroadcastMinutes:number};
const ORIGIN='https://slnjliheyiiummxhrgmk.supabase.co';
const id=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function isObsPlaybackMarker(value:unknown,streamId:string){return id.test(streamId)&&value==='clipt-obs:'+streamId;}
const messages:Record<string,string>={BETA_LIMIT:'The beta broadcast or viewer allowance is full. Please try later.',
 SESSION_FORBIDDEN:'Your sign-in, invitation or broadcast session is no longer available.',
 SESSION_UNAVAILABLE:'OBS setup or independent cleanup is not ready. Please retry later.',
 PROVISION_PENDING:'Setup is pending server recovery. Use Check status before starting another broadcast.',
 STOP_PENDING:'The end request is recorded. Server shutdown is still pending; retry End broadcast.',
 PROVIDER_UNAVAILABLE:'Mux could not be reached. Please retry.',
 PROVIDER_UNVERIFIED:'Mux has not confirmed this broadcast.',
 MUX_PERMISSION_REQUIRED:'The operator must finish Mux token permissions.'};
async function command(body:Record<string,unknown>){
 if(storageProjectUrl!==ORIGIN)throw Error('Production OBS broadcasting is unavailable here.');
 const {data:auth,error:authError}=await supabase.auth.getUser();if(authError||!auth.user)throw Error('Sign in to use the private beta.');
 const {data,error}=await supabase.functions.invoke('obs-broadcast-session',{body:{protocolVersion:1,...body}});
 if(error){let code='';if(error.context instanceof Response){try{code=(await error.context.clone().json())?.code;}catch{/* Fixed messages only. */}}
  throw Error(messages[code]||'The OBS request could not be completed. Check status and retry.');}
 return data;
}
export function readObsSession(value:unknown):ObsSession|null{
 if(value===null)return null;
 const s=value as ObsSession;
 if(!s||!id.test(s.sessionId)||!id.test(s.streamId)||!['provisioning','uncertain','ready','active','stopping','ended'].includes(s.state)
  ||typeof s.isLive!=='boolean'||s.isLive!==(s.state==='active')||!Number.isFinite(Date.parse(s.expiresAt))
  ||!Number.isInteger(s.maxDurationSeconds)||s.maxDurationSeconds<60||s.maxDurationSeconds>1800)throw Error('Broadcast status could not be verified.');
 return s;
}
export async function obsReadiness():Promise<ObsReadiness>{
 if(storageProjectUrl!==ORIGIN)return {enabled:false,configured:false,operationsReady:false,maxDurationSeconds:1800,monthlyBroadcastMinutes:300};
 const response=await fetch(ORIGIN+'/functions/v1/obs-broadcast-session/status',{cache:'no-store',signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error('OBS availability could not be checked.');
 const r=await response.json();
 if(r.protocolVersion!==1||typeof r.enabled!=='boolean'||typeof r.configured!=='boolean'||typeof r.operationsReady!=='boolean'
  ||!Number.isInteger(r.maxDurationSeconds)||r.maxDurationSeconds>1800||r.maxDurationSeconds<60
  ||!Number.isInteger(r.monthlyBroadcastMinutes)||r.monthlyBroadcastMinutes>300)throw Error('OBS availability could not be verified.');
 return r;
}
export const currentObsSession=async()=>readObsSession((await command({action:'current'})).session);
export const createObsSession=async(streamId:string,requestId:string)=>readObsSession((await command({action:'create',streamId,requestId})).session);
export async function endObsSession(sessionId:string){
 const s=readObsSession((await command({action:'stop',sessionId})).session);
 if(s?.sessionId!==sessionId||s.state!=='ended')throw Error('Broadcast shutdown is not confirmed. Retry End broadcast.');return s;
}
export async function obsCredentials(sessionId:string){
 const r=await command({action:'credentials',sessionId});
 if(r.ingestUrl!=='rtmps://global-live.mux.com:443/app'||typeof r.streamKey!=='string'||!(/^[A-Za-z0-9_-]{8,256}$/.test(r.streamKey))
  ||!Number.isFinite(Date.parse(r.expiresAt))||Date.parse(r.expiresAt)<=Date.now())throw Error('OBS credentials could not be verified.');
 return {ingestUrl:r.ingestUrl as string,streamKey:r.streamKey as string,expiresAt:r.expiresAt as string};
}
export async function resolveObsPlayback(streamId:string):Promise<{url:string;expiresAt:number}>{
 const r=await command({action:'playback',streamId});
 const expiry=Date.parse(r?.expiresAt),url=new URL(r?.playbackUrl);
 if(url.origin!=='https://stream.mux.com'||!(/^\/[A-Za-z0-9]+\.m3u8$/).test(url.pathname)||url.username||url.password||url.hash
  ||Array.from(url.searchParams.keys()).join(',')!=='token'||!url.searchParams.get('token')
  ||!Number.isFinite(expiry)||expiry<=Date.now()||expiry>Date.now()+181000)throw Error('Private playback could not be verified.');
 return {url:url.href,expiresAt:expiry};
}
