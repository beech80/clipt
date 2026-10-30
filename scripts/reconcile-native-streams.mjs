import {pathToFileURL} from 'node:url';
export async function reconcileNativeStreams({token,request=fetch}){
 if(typeof token!=='string'||token.length<64||token.length>256||/[^A-Za-z0-9_-]/.test(token))throw Error('Native cleanup authorization is not configured.');
 const response=await request('https://akiksrlzdqvipqbbjxpw.supabase.co/functions/v1/native-broadcast-session',{
  method:'POST',redirect:'error',signal:AbortSignal.timeout(45000),
  headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json','Cache-Control':'no-store'},
  body:JSON.stringify({protocolVersion:1,action:'reconcile'}),
 });
 if(!response.ok)throw Error('Native cleanup did not complete. Check server configuration and the development provider.');
 let value;try{value=await response.json();}catch{throw Error('Native cleanup returned an invalid response.');}
 if(!value||typeof value!=='object'||!['checked','stopped','pending'].every(k=>Number.isSafeInteger(value[k])&&value[k]>=0&&value[k]<=100)
  ||value.pending!==0||value.stopped>value.checked)throw Error('Native cleanup has pending or unverified work.');
 return {checked:value.checked,stopped:value.stopped,pending:0};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 reconcileNativeStreams({token:process.env.CLIPT_NATIVE_RECONCILE_TOKEN}).then(
  result=>console.log(JSON.stringify({test:'native-external-reconciliation',...result,ok:true})),
  ()=>{console.error('Native external reconciliation failed. No credentials or provider diagnostics were logged.');process.exitCode=1;});
}
