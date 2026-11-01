// No Mux, Supabase admin or stream credentials are sent to this runner.
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const audience='clipt-obs-beta-operations-v1';
const base=process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
if(!base||!process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN)throw Error('GitHub OIDC unavailable');
const issued=await fetch(base+(base.includes('?')?'&':'?')+'audience='+encodeURIComponent(audience),{
 headers:{Authorization:'Bearer '+process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN},redirect:'error',signal:AbortSignal.timeout(20000)});
if(!issued.ok)throw Error('OIDC authorization failed');
const token=(await issued.json()).value;
if(typeof token!=='string')throw Error('OIDC authorization failed');
async function invoke(operation,body={}){
 const response=await fetch('https://slnjliheyiiummxhrgmk.supabase.co/functions/v1/obs-broadcast-session?operation='+operation,{
  method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body),
  redirect:'error',signal:AbortSignal.timeout(operation==='reconcile'?170000:25000)});
 let result;try{result=await response.json();}catch{throw Error('OBS worker returned an invalid response');}
 if(!response.ok){console.log(JSON.stringify({test:'obs-beta-operations',status:response.status,
  code:typeof result.code==='string'&&/^[A-Z_]{1,50}$/.test(result.code)?result.code:null}));throw Error('OBS maintenance requires review');}
 return result;
}
const result=await invoke('reconcile');
console.log(JSON.stringify({test:'obs-beta-operations',configured:result.configured===true,checked:result.checked,pending:result.pending}));
if(result.pending>0)throw Error('OBS maintenance requires review');
let acceptance=false;
if(process.env.GITHUB_EVENT_NAME==='push'){
 try{const current=JSON.parse(await readFile('.github/obs-beta-operation.json','utf8'));acceptance=current.action==='acceptance'&&current.action==='acceptance'&&typeof current.nonce==='string'&&current.nonce===process.env.GITHUB_SHA;}
 catch{/* Scheduled maintenance never creates a paid acceptance stream. */}
}
if(acceptance){
 const prepared=await invoke('acceptance');
 if(typeof prepared.streamKey!=='string'||prepared.ingestUrl!=='rtmps://global-live.mux.com:443/app'
  ||!(/^[A-Za-z0-9_-]{8,256}$/.test(prepared.streamKey))||!(/^[0-9a-f-]{36}$/i.test(prepared.sessionId)))throw Error('Acceptance setup invalid');
 // Values stay in this ephemeral runner and are never included in diagnostics.
 const ingest=prepared.ingestUrl+'/'+prepared.streamKey;
 let encoder,ok=false;
 const run=(args)=>new Promise((resolve,reject)=>{
  const child=spawn('ffmpeg',args,{stdio:'ignore'});child.once('error',reject);child.once('exit',code=>code===0?resolve(true):reject(Error('Media check failed')));
  const timer=setTimeout(()=>{child.kill('SIGKILL');reject(Error('Media check timed out'));},20000);child.once('exit',()=>clearTimeout(timer));
 });
 try{
  encoder=spawn('ffmpeg',['-nostdin','-hide_banner','-loglevel','error','-re','-f','lavfi','-i','testsrc2=size=640x360:rate=15',
   '-f','lavfi','-i','sine=frequency=440:sample_rate=44100','-t','60','-c:v','libx264','-preset','ultrafast','-tune','zerolatency',
   '-pix_fmt','yuv420p','-b:v','700k','-g','30','-c:a','aac','-b:a','64k','-f','flv',ingest],{stdio:'ignore'});
  let encoderFailed=false;encoder.once('error',()=>{encoderFailed=true;});encoder.once('exit',code=>{if(code!==0)encoderFailed=true;});
  for(let attempt=0;attempt<18;attempt++){
   await new Promise(resolve=>setTimeout(resolve,2500));
   if(encoderFailed)throw Error('Synthetic encoder failed');
   const live=await invoke('acceptance-status',{sessionId:prepared.sessionId});
   if(!live.live||!live.webhookVerified)continue;
   const url=new URL(live.playbackUrl);
   if(url.origin!=='https://stream.mux.com'||!url.searchParams.get('token'))throw Error('Private playback invalid');
   const unsigned=await fetch(url.origin+url.pathname,{redirect:'error',signal:AbortSignal.timeout(10000)});
   if(unsigned.ok)throw Error('Private playback was accessible without a signature');
   await unsigned.body?.cancel();
   await run(['-nostdin','-hide_banner','-loglevel','error','-i',url.href,'-frames:v','3','-an','-f','null','-']);
   ok=true;break;
  }
  if(!ok)throw Error('Live ingest, verified webhook and signed decoding were not all confirmed');
 }finally{
  if(encoder&&encoder.exitCode===null){
   await new Promise(resolve=>{encoder.once('exit',resolve);encoder.kill('SIGTERM');setTimeout(()=>{encoder.kill('SIGKILL');resolve();},3000).unref();});
  }
  const stopped=await invoke('acceptance-stop',{sessionId:prepared.sessionId});
  if(stopped.ended!==true)throw Error('Acceptance provider shutdown unconfirmed');
  console.log(JSON.stringify({test:'obs-production-encoder',passed:ok,signedPlaybackOnly:ok,webhookVerified:ok,providerDisabled:true}));
 }
}
