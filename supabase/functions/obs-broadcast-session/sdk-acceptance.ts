import {ObsError,obsOwnedProvider,type ObsSession} from './lifecycle.ts';
import {obsProviderShape} from './diagnostics.ts';
// Alternate operator check only. The normal authenticated tester create path is unchanged.
export async function createSdkAcceptance(s:ObsSession,tokenId:string,tokenSecret:string,
 read:(id:string)=>Promise<any>,loadClient:()=>Promise<any>=()=>import('npm:@mux/ts@16.0.0')){
 if(s.acceptance!==true||s.maxDurationSeconds!==90||!s.needsProvision)
  throw new ObsError(403,'SDK_CHECK_FORBIDDEN','This client is reserved for a bounded operator check');
 if(!/^[!-~]{1,500}$/.test(tokenId)||!/^[!-~]{1,500}$/.test(tokenSecret))
  throw new ObsError(503,'SDK_CHECK_UNAVAILABLE','Provider credentials unavailable');
 let created:any;
 try{
  const {default:Mux}=await loadClient();
  const mux=new Mux({tokenId,tokenSecret,authorizationToken:null,baseURL:'https://api.mux.com',
   maxRetries:0,timeout:12000,logLevel:'off',logger:{error(){},warn(){},info(){},debug(){}},
   defaultHeaders:{Authorization:'Basic '+btoa(tokenId+':'+tokenSecret)},fetchOptions:{redirect:'error'}});
  // Match the official SDK production example: optional test is omitted, never true.
  created=await mux.video.liveStreams.create({max_continuous_duration:90,playback_policies:['signed'],
   new_asset_settings:{playback_policies:['signed'],max_resolution_tier:'1080p',video_quality:'plus'},
   reconnect_window:60,latency_mode:'standard',passthrough:'clipt-obs:'+s.sessionId});
 }catch(error){
  const status=typeof (error as any)?.status==='number'?(error as any).status:0;
  throw new ObsError(503,status===402?'MUX_BILLING_REQUIRED':status===401||status===403?'MUX_PERMISSION_REQUIRED':
   status===429?'MUX_RATE_LIMITED':'SDK_CHECK_UNAVAILABLE','The independent SDK check could not create a verified resource');
 }
 obsOwnedProvider(created,s);
 // Independent original HTTP client confirms the exact SDK-created identity.
 const observed=obsOwnedProvider(await read(created.id),{...s,providerId:created.id});
 const a=obsProviderShape(created,s.sessionId),b=obsProviderShape(observed,s.sessionId);
 console.log(JSON.stringify({test:'obs-independent-sdk-readback',created:a,retrieved:b}));
 if((created.test===true)!==(observed.test===true)||created.max_continuous_duration!==observed.max_continuous_duration
  ||created.playback_ids?.[0]?.id!==observed.playback_ids?.[0]?.id)
  throw new ObsError(502,'PROVIDER_UNVERIFIED','Independent provider observations disagree');
 return observed; // Existing paid-mode/signed-playback validator remains authoritative.
}
