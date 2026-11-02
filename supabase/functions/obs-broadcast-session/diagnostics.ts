// Fixed diagnostic codes only; never echo Mux bodies, credentials or resource IDs.
export async function muxRejectionCode(response:Response):Promise<string>{
 let text='';try{
  const reader=response.body?.getReader();if(reader){
   const chunks:Uint8Array[]=[];let size=0;
   for(;;){const p=await reader.read();if(p.done)break;size+=p.value.length;if(size>32768){await reader.cancel();break;}chunks.push(p.value);}
   if(size<=32768){const all=new Uint8Array(size);let offset=0;for(const p of chunks){all.set(p,offset);offset+=p.length;}text=new TextDecoder().decode(all).toLowerCase();}
  }
 }catch{/* Status alone remains safe. */}
 if(response.status===402||/free plan|pay.as.you.go|billing|credit card|payment method|upgrade your|paid plan/.test(text))return 'MUX_BILLING_REQUIRED';
 if(response.status===401||response.status===403)return 'MUX_PERMISSION_REQUIRED';
 if(response.status===429)return 'MUX_RATE_LIMITED';
 if(/video_quality|encoding_tier/.test(text))return 'MUX_QUALITY_REJECTED';
 if(/max_continuous_duration/.test(text))return 'MUX_DURATION_REJECTED';
 if(response.status===400||response.status===422)return 'MUX_REQUEST_REJECTED';
 return 'PROVIDER_UNAVAILABLE';
}
export function obsProviderShape(value:any,sessionId?:string){
 return {identityValid:typeof value?.id==='string'&&/^[A-Za-z0-9]{1,200}$/.test(value.id),
 passthroughMatches:typeof value?.passthrough==='string'&&(sessionId?value.passthrough==='clipt-obs:'+sessionId:value.passthrough.startsWith('clipt-obs:')),
 testField:value?.test===undefined?'omitted':value.test===null?'null':value.test===false?'false':value.test===true?'true':'invalid',
 duration:Number.isInteger(value?.max_continuous_duration)?value.max_continuous_duration:null,
 status:['active','idle','disabled'].includes(value?.status)?value.status:'invalid',
 playbackCount:Array.isArray(value?.playback_ids)?value.playback_ids.length:0,
 signedOnly:Array.isArray(value?.playback_ids)&&value.playback_ids.length===1&&value.playback_ids[0]?.policy==='signed'};
}

/** Safe account correlation: no account names, token names, identifiers or keys. */
export function muxAccountShape(value:any){
 return {
  knownDashboardOrganization:value?.organization_id==='t0gc3o',
  knownDashboardEnvironment:value?.environment_id==='a7g7mn',
  environmentType:['development','production'].includes(value?.environment_type)?value.environment_type:'unknown'
 };
}
