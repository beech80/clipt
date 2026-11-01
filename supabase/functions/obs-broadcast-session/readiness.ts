export const OBS_ORIGINS=['https://slnjliheyiiummxhrgmk.supabase.co','https://akiksrlzdqvipqbbjxpw.supabase.co'] as const;
export type ObsReadinessDependencies={probeProvider:()=>Promise<number>;checkSigning:()=>Promise<boolean>};
const fields=['MUX_TOKEN_ID','MUX_TOKEN_SECRET','MUX_SIGNING_KEY_ID','MUX_SIGNING_PRIVATE_KEY','MUX_OBS_WEBHOOK_SECRET'] as const;
export async function obsReadiness(env:Record<string,string>,deps:ObsReadinessDependencies,checkProvider=false){
 const missing:string[]=fields.filter(name=>!env[name]);
 if(!OBS_ORIGINS.includes(env.SUPABASE_URL as any))missing.push('supported_project');
 if(env.MUX_TOKEN_ID&&env.MUX_TOKEN_SECRET&&(!/^[!-~]{1,500}$/.test(env.MUX_TOKEN_ID)||!/^[!-~]{1,500}$/.test(env.MUX_TOKEN_SECRET)))missing.push('mux_token_format');
 if(env.MUX_SIGNING_KEY_ID&&!/^[A-Za-z0-9]{1,200}$/.test(env.MUX_SIGNING_KEY_ID))missing.push('signing_key_id_format');
 if(env.MUX_OBS_WEBHOOK_SECRET&&env.MUX_OBS_WEBHOOK_SECRET.length<16)missing.push('webhook_secret_format');
 let signingReady=false;
 if(env.MUX_SIGNING_KEY_ID&&env.MUX_SIGNING_PRIVATE_KEY){try{signingReady=await deps.checkSigning();}catch{/* Fixed status only. */}if(!signingReady)missing.push('signing_private_key_format');}
 let providerReadStatus:number|undefined;
 if(checkProvider&&!missing.some(name=>name==='MUX_TOKEN_ID'||name==='MUX_TOKEN_SECRET'||name==='mux_token_format')){
  try{const status=await deps.probeProvider();providerReadStatus=Number.isInteger(status)&&status>=100&&status<=599?status:503;}catch{providerReadStatus=503;}
 }
 return {protocolVersion:1,enabled:env.CLIPT_OBS_BROADCAST_ENABLED==='true',configured:missing.length===0,signingReady,missing,
  ...(providerReadStatus===undefined?{}:{providerReadStatus})};
}
