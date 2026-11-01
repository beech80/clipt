// No Mux, Supabase admin or stream credentials are sent to this runner.
const audience='clipt-obs-beta-operations-v1';
const base=process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
if(!base||!process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN)throw Error('GitHub OIDC unavailable');
const issued=await fetch(base+(base.includes('?')?'&':'?')+'audience='+encodeURIComponent(audience),{
 headers:{Authorization:'Bearer '+process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN},redirect:'error',signal:AbortSignal.timeout(20000)});
if(!issued.ok)throw Error('OIDC authorization failed');
const token=(await issued.json()).value;
if(typeof token!=='string')throw Error('OIDC authorization failed');
const response=await fetch('https://slnjliheyiiummxhrgmk.supabase.co/functions/v1/obs-broadcast-session?operation=reconcile',{
 method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'{}',
 redirect:'error',signal:AbortSignal.timeout(170000)});
let result;try{result=await response.json();}catch{throw Error('OBS worker returned an invalid response');}
console.log(JSON.stringify({test:'obs-beta-operations',status:response.status,configured:result.configured===true,
 checked:Number.isInteger(result.checked)?result.checked:null,pending:Number.isInteger(result.pending)?result.pending:null,
 code:typeof result.code==='string'&&/^[A-Z_]{1,50}$/.test(result.code)?result.code:null}));
if(!response.ok||result.pending>0)throw Error('OBS maintenance requires review; new sessions remain fail-closed');
