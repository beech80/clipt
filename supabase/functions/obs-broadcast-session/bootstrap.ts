import {ObsError} from './lifecycle.ts';
export type ObsBootstrapDeps={
 db(action:string,args?:Record<string,unknown>):Promise<any>;
 request(path:string,method?:string,body?:unknown):Promise<any>;
 checkKey(encoded:string):Promise<void>;
};
const ORIGIN='https://slnjliheyiiummxhrgmk.supabase.co';
export const OBS_WEBHOOK_ADDRESS=ORIGIN+'/functions/v1/obs-broadcast-session?hook=mux';
export async function bootstrapObs(d:ObsBootstrapDeps){
 const config=await d.db('configuration');
 if(config.bootstrapState==='ready')return {configured:true};
 const claim=await d.db('bootstrap_claim');
 if(!claim.claimed)throw new ObsError(503,'SETUP_REVIEW','OBS provider setup requires operator review; creation was not repeated');
 let key:any,hook:any;
 try{
  // No live stream is created here. These response secrets go directly to Vault.
  key=await d.request('/system/v1/signing-keys','POST',{});
  if(!key||!/^[A-Za-z0-9]{1,200}$/.test(key.id||'')||typeof key.private_key!=='string')throw Error();
  await d.checkKey(key.private_key);
  hook=await d.request('/system/v1/webhooks','POST',{address:OBS_WEBHOOK_ADDRESS});
  if(!hook||!/^[A-Za-z0-9]{1,200}$/.test(hook.id||'')||hook.address!==OBS_WEBHOOK_ADDRESS||hook.enabled!==true
   ||typeof hook.signing_secret!=='string'||hook.signing_secret.length<16)throw Error();
  const stored=await d.db('bootstrap_save',{signingId:key.id,privateKey:key.private_key,webhookId:hook.id,webhookSecret:hook.signing_secret});
  if(stored?.saved!==true)throw Error();
  return {configured:true};
 }catch{
  // Delete only resources whose creation returned verified IDs in this request.
  // An ambiguous create outcome is never retried automatically.
  if(hook?.id&&/^[A-Za-z0-9]{1,200}$/.test(hook.id))await d.request('/system/v1/webhooks/'+hook.id,'DELETE').catch(()=>undefined);
  if(key?.id&&/^[A-Za-z0-9]{1,200}$/.test(key.id))await d.request('/system/v1/signing-keys/'+key.id,'DELETE').catch(()=>undefined);
  throw new ObsError(503,'SETUP_REVIEW','Mux setup could not be confirmed. An operator must review token permissions and any partial provider resources.');
 }
}
