import {serve} from 'https://deno.land/std@0.190.0/http/server.ts';
import {authenticatedUser,errorResponse,HttpError,jsonResponse,requestMethod} from '../_shared/request.ts';
import {importNativeSigningKey} from '../native-broadcast-session/crypto.ts';
import {obsReadiness} from './readiness.ts';
const names=['SUPABASE_URL','MUX_TOKEN_ID','MUX_TOKEN_SECRET','MUX_SIGNING_KEY_ID','MUX_SIGNING_PRIVATE_KEY','MUX_OBS_WEBHOOK_SECRET','CLIPT_OBS_BROADCAST_ENABLED'];
let probe:{until:number;status:number}|null=null,flight:Promise<number>|null=null;
async function probeProvider(env:Record<string,string>){
 if(probe&&probe.until>Date.now())return probe.status;if(flight)return flight;
 flight=(async()=>{let status=503;try{const r=await fetch('https://api.mux.com/video/v1/live-streams?limit=1',{headers:{Authorization:'Basic '+btoa(env.MUX_TOKEN_ID+':'+env.MUX_TOKEN_SECRET)},redirect:'error',signal:AbortSignal.timeout(10000)});status=r.status;await r.body?.cancel();}catch{/* Do not log provider data, credentials or resource IDs. */}
  probe={until:Date.now()+60000,status};return status;})().finally(()=>{flight=null;});return flight;
}
serve(async req=>{
 if(req.method==='GET'&&new URL(req.url).pathname.endsWith('/status')){
  const env=Object.fromEntries(names.map(name=>[name,Deno.env.get(name)||'']));
  const result=await obsReadiness(env,{probeProvider:()=>probeProvider(env),checkSigning:async()=>{await importNativeSigningKey(env.MUX_SIGNING_PRIVATE_KEY);return true;}},new URL(req.url).searchParams.get('check')==='provider');
  return jsonResponse(result);
 }
 const method=requestMethod(req);if(method)return method;
 try{await authenticatedUser(req);throw new HttpError(503,'Computer broadcasting is being prepared; no broadcast was created.');}
 catch(error){return errorResponse(error);}
});
