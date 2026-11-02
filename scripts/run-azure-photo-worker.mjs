const endpoint='https://slnjliheyiiummxhrgmk.supabase.co/functions/v1/azure-photo-worker';
async function main(){
 if(process.env.GITHUB_REPOSITORY!=='beech80/clipt'||process.env.GITHUB_REF!=='refs/heads/main'||!['schedule','workflow_dispatch','push'].includes(process.env.GITHUB_EVENT_NAME))throw Error('runner-context');
 let action=process.env.CLIPT_PHOTO_ACTION||'tick';if(!['probe','tick'].includes(action))throw Error('runner-action');
 const origin=process.env.ACTIONS_ID_TOKEN_REQUEST_URL,auth=process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
 const url=new URL(origin);if(url.protocol!=='https:'||!url.hostname.endsWith('.actions.githubusercontent.com'))throw Error('runner-oidc');
 url.searchParams.set('audience','clipt-azure-photo-worker-v1');
 const r=await fetch(url,{redirect:'error',headers:{Authorization:'Bearer '+auth},signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw Error('runner-oidc');const data=await r.json();if(typeof data.value!=='string'||data.value.length>16000)throw Error('runner-oidc');
 const result=await fetch(endpoint,{method:'POST',redirect:'error',headers:{Authorization:'Bearer '+data.value,'Content-Type':'application/json'},body:JSON.stringify({action}),signal:AbortSignal.timeout(150000)});
 const text=await result.text();if(text.length>4000)throw Error('worker-response');
 let value;try{value=JSON.parse(text);}catch{throw Error('worker-response');}
 // Print only enumerated status and missing setting NAMES, never private results.
 const states=['provider_verified','disabled','processed','idle','held','configuration_required','moderator_setup_required'];
 if(value.state&&!states.includes(value.state))throw Error('worker-response');
 console.log(JSON.stringify({action,status:result.status,state:value.state??'unavailable',...(value.reason?{attentionRequired:true}:{}),...(value.missing?{missing:value.missing.filter(x=>['verified_F0_resource','AZURE_CONTENT_SAFETY_ENDPOINT','AZURE_CONTENT_SAFETY_KEY'].includes(x))}:{})}));
 if(!result.ok)throw Error('worker-not-ready');
}
main().catch(()=>{console.error('Photo review worker did not confirm readiness. Check configuration and the protected moderation queue.');process.exitCode=1;});
