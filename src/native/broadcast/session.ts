import {supabase} from '@/lib/supabase';
import {storageProjectUrl} from '@/integrations/supabase/client';
import type {NativeBroadcastSelection} from './types';
export const NATIVE_PROJECT='https://akiksrlzdqvipqbbjxpw.supabase.co';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const states=['provisioning','ready','starting','active','stopping','uncertain','ended','failed'];
export type NativeSessionStatus={sessionId:string;streamId:string;state:string;isLive:boolean;expiresAt:string;maxDurationSeconds:number;selection:NativeBroadcastSelection};
export type PreparedNativeSession={sessionId:string;streamId:string;grant:string;expiresAt:string;maxDurationSeconds:number;selection:NativeBroadcastSelection};
function object(value:unknown):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Broadcast response could not be verified');
 return value as Record<string,unknown>;
}
function readSessionSelection(value:unknown):NativeBroadcastSelection {
 const s=object(value);
 if(!['camera','screen'].includes(s.mode as string)||!['360p15','480p30','720p30','1080p30'].includes(s.quality as string)
  ||!['portrait','landscape'].includes(s.orientation as string)||!['front','back'].includes(s.cameraPosition as string)
  ||typeof s.microphone!=='boolean'||typeof s.systemAudio!=='boolean'||(s.systemAudio&&s.mode!=='screen'))
  throw Error('Broadcast settings could not be verified');
 return {mode:s.mode,quality:s.quality,orientation:s.orientation,microphone:s.microphone,systemAudio:s.systemAudio,cameraPosition:s.cameraPosition} as NativeBroadcastSelection;
}
export function readNativeSessionStatus(value:unknown):NativeSessionStatus {
 const v=object(value);
 if(v.protocolVersion!==1||typeof v.sessionId!=='string'||!uuid.test(v.sessionId)
  ||typeof v.streamId!=='string'||!uuid.test(v.streamId)||!states.includes(v.state as string)
  ||typeof v.isLive!=='boolean'||(v.isLive&&v.state!=='active')
  ||typeof v.expiresAt!=='string'||!Number.isFinite(Date.parse(v.expiresAt))
  ||!Number.isSafeInteger(v.maxDurationSeconds)||Number(v.maxDurationSeconds)<60||Number(v.maxDurationSeconds)>7200)
  throw Error('Broadcast response could not be verified');
 return {sessionId:v.sessionId,streamId:v.streamId,state:v.state as string,isLive:v.isLive,
  expiresAt:v.expiresAt,maxDurationSeconds:Number(v.maxDurationSeconds),selection:readSessionSelection(v.selection)};
}
export function readPreparedNativeSession(value:unknown,streamId:string,selection:NativeBroadcastSelection,now=Date.now()):PreparedNativeSession {
 const v=object(value),returned=readSessionSelection(v.selection);
 if(v.protocolVersion!==1||typeof v.sessionId!=='string'||!uuid.test(v.sessionId)||v.streamId!==streamId
  ||typeof v.grant!=='string'||!/^[A-Za-z0-9_-]{64,2048}$/.test(v.grant)
  ||typeof v.expiresAt!=='string'||Date.parse(v.expiresAt)<=now||Date.parse(v.expiresAt)>now+120000
  ||!Number.isFinite(Date.parse(v.expiresAt))||!Number.isSafeInteger(v.maxDurationSeconds)
  ||Number(v.maxDurationSeconds)<60||Number(v.maxDurationSeconds)>7200
  ||Object.keys(selection).some(k=>returned[k as keyof NativeBroadcastSelection]!==selection[k as keyof NativeBroadcastSelection]))
  throw Error('Broadcast authorization could not be verified');
 return {sessionId:v.sessionId,streamId,grant:v.grant,expiresAt:v.expiresAt,
  maxDurationSeconds:Number(v.maxDurationSeconds),selection:{...selection}};
}
const safeErrors:Record<string,string>={
 TEST_OWNER_REQUIRED:'Sign in with the designated phone-test account.',
 AUTHENTICATION_REQUIRED:'Sign in and complete your authenticator challenge if enabled.',
 SESSION_FORBIDDEN:'Broadcast access expired. Check your sign-in and beta invitation.',
 SESSION_CONFLICT:'A broadcast already exists, or the broadcast limit has been reached.',
 SESSION_EXISTS:'A broadcast session is already starting or active.',
 NATIVE_DISABLED:'Phone broadcasting is unavailable in this environment.',
 PROVISION_PENDING:'Broadcast setup is pending server recovery. Check its status before retrying.',
 STOP_PENDING:'The phone has stopped capture. Server cleanup is still pending; retry End broadcast.',
 STREAM_OFFLINE:'This broadcast is currently offline.',
 PLAYBACK_UNAVAILABLE:'Private live playback is temporarily unavailable.',
};
async function command(body:Record<string,unknown>) {
 if(storageProjectUrl!==NATIVE_PROJECT)throw Error('Phone broadcasting is unavailable in this environment.');
 const {data:user,error:authError}=await supabase.auth.getUser();
 if(authError||!user.user)throw Error('Sign in to manage your broadcast.');
 const {data,error}=await supabase.functions.invoke('native-broadcast-session',{body:{protocolVersion:1,...body}});
 if(error){
  let code='';
  if(error.context instanceof Response){try{code=String((await error.context.clone().json())?.code||'');}catch{/* Never echo server/provider diagnostics. */}}
  throw Error(safeErrors[code]||'Broadcast request failed. Check your connection and retry.');
 }
 return data;
}
export const prepareNativeSession=async(streamId:string,requestId:string,selection:NativeBroadcastSelection)=>
 readPreparedNativeSession(await command({action:'create',streamId,requestId,selection}),streamId,selection);
export async function nativeCurrentSession():Promise<NativeSessionStatus|null>{
 const v=object(await command({action:'current'}));
 if(v.protocolVersion!==1)throw Error('Broadcast response could not be verified');
 return v.session===null?null:readNativeSessionStatus(v.session);
}
export const nativeSessionStatus=async(sessionId:string)=>readNativeSessionStatus(await command({action:'status',sessionId}));
export async function endNativeSession(sessionId:string){
 const v=object(await command({action:'stop',sessionId}));
 if(v.protocolVersion!==1||v.sessionId!==sessionId||v.state!=='ended')throw Error('Broadcast end is not confirmed. Retry End broadcast.');
}
export function isNativePlaybackMarker(value:unknown,streamId:string):boolean {
 return typeof value==='string'&&uuid.test(streamId)&&value==='clipt-native:'+streamId;
}
export function readNativePlayback(value:unknown,now=Date.now()):{url:string;expiresAt:number}{
 const v=object(value);
 if(v.protocolVersion!==1||typeof v.playbackUrl!=='string'||typeof v.expiresAt!=='string')throw Error('Private playback could not be verified.');
 const url=new URL(v.playbackUrl),expiry=Date.parse(v.expiresAt);
 if(url.origin!=='https://stream.mux.com'||!/^\/[A-Za-z0-9]+\.m3u8$/.test(url.pathname)
  ||url.username||url.password||url.hash||Array.from(url.searchParams.keys()).join(',')!=='token'
  ||!url.searchParams.get('token')||!Number.isFinite(expiry)||expiry<=now||expiry>now+16*60000)
  throw Error('Private playback could not be verified.');
 return {url:url.href,expiresAt:expiry};
}
export const resolveNativePlayback=async(streamId:string)=>readNativePlayback(await command({action:'playback',streamId}));
