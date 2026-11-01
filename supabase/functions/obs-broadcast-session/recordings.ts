import {ObsError} from './lifecycle.ts';
// Remove only recordings whose own Mux resource confirms this OBS live-stream ID.
// Collect the full bounded listing before deleting, so pagination cannot skip rows.
export async function clearObsRecordings(providerId:string,snapshot:any,request:(path:string,method?:string)=>Promise<any>){
 if(!/^[A-Za-z0-9]{1,200}$/.test(providerId))throw new ObsError(503,'STOP_PENDING','Recording cleanup identity unavailable');
 const ids=new Set<string>();
 for(const id of [...(Array.isArray(snapshot.recent_asset_ids)?snapshot.recent_asset_ids:[]),snapshot.active_asset_id].filter(Boolean)){
  if(typeof id!=='string'||!/^[A-Za-z0-9]{1,200}$/.test(id))throw new ObsError(503,'STOP_PENDING','Recording cleanup requires review');ids.add(id);
 }
 let complete=false;
 for(let page=1;page<=10;page++){
  const batch=await request('/video/v1/assets?live_stream_id='+providerId+'&limit=100&page='+page);
  if(!Array.isArray(batch))throw new ObsError(503,'STOP_PENDING','Recording inventory unavailable');
  for(const asset of batch){
   if(asset.live_stream_id!==providerId||!/^[A-Za-z0-9]{1,200}$/.test(asset.id||''))throw new ObsError(503,'STOP_PENDING','Recording ownership could not be verified');
   ids.add(asset.id);
  }
  if(batch.length<100){complete=true;break;}
 }
 if(!complete||ids.size>1000)throw new ObsError(503,'STOP_PENDING','Recording inventory is incomplete');
 for(const id of ids){
  const path='/video/v1/assets/'+id,asset=await request(path);
  if(asset===null)continue;
  if(asset.id!==id||asset.live_stream_id!==providerId)throw new ObsError(503,'STOP_PENDING','Recording ownership could not be verified');
  await request(path,'DELETE');
  if(await request(path)!==null)throw new ObsError(503,'STOP_PENDING','Recording removal is not yet confirmed');
 }
 const remaining=await request('/video/v1/assets?live_stream_id='+providerId+'&limit=100&page=1');
 if(!Array.isArray(remaining)||remaining.length)throw new ObsError(503,'STOP_PENDING','Recording cleanup remains pending');
}
