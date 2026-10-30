import {NativeSessionError,providerSnapshot,type NativeDependencies,type NativeSession} from './protocol.ts';
export type NativeResourceListing={resources:unknown[];complete:boolean};
// Used by an authenticated external scheduler, never by an owner WebView timer.
export async function reconcileNativeBroadcasts(d:NativeDependencies,list:()=>Promise<NativeResourceListing>) {
 const raw=await d.db('reconcile_list',{});
 if(!Array.isArray(raw)||raw.length>100)throw new NativeSessionError(503,'RECONCILE_UNAVAILABLE','Native cleanup is unavailable');
 const sessions=raw as NativeSession[];
 let listing:NativeResourceListing|undefined;
 if(sessions.some(s=>!s.providerId))listing=await list();
 let checked=0,stopped=0,pending=0;
 for(let offset=0;offset<sessions.length;offset+=4) {
  await Promise.all(sessions.slice(offset,offset+4).map(async(s)=>{
   try {
    if(!s.providerId) {
     if(!['uncertain','stopping'].includes(s.state)){pending++;return;}
     const matches=(listing?.resources??[]).filter((x:any)=>x?.passthrough===s.sessionId) as any[];
     if(!matches.length) {
      if(!listing?.complete){pending++;return;}
      // No retrying POST after an ambiguous create. A completed provider listing
      // is needed before releasing the one-publisher reservation.
      await d.db('finish_stop',{sessionId:s.sessionId});stopped++;checked++;return;
     }
     for(const resource of matches) {
      if(typeof resource.id!=='string'||!/^[A-Za-z0-9]{1,200}$/.test(resource.id))throw Error();
      await d.provider.disable(resource.id);
      const confirm:any=await d.provider.read(resource.id);
      if(confirm?.id!==resource.id||confirm.passthrough!==s.sessionId||confirm.status!=='disabled')throw Error();
     }
     const first=matches[0];
     await d.db('adopt_cleanup',{sessionId:s.sessionId,providerId:first.id,
      playbackId:Array.isArray(first.playback_ids)&&/^[A-Za-z0-9]{1,200}$/.test(first.playback_ids[0]?.id??'')?first.playback_ids[0].id:null});
     await d.db('finish_stop',{sessionId:s.sessionId,providerId:first.id,observedAt:new Date(d.now()).toISOString()});
     stopped++;checked++;return;
    }
    if(['uncertain','stopping'].includes(s.state)) {
     await d.provider.disable(s.providerId);
     const confirm:any=await d.provider.read(s.providerId);
     if(confirm?.id!==s.providerId||confirm.passthrough!==s.sessionId||confirm.status!=='disabled')throw Error();
     await d.db('finish_stop',{sessionId:s.sessionId,providerId:s.providerId,observedAt:new Date(d.now()).toISOString()});stopped++;
    } else {
     const observedAt=new Date(d.now()).toISOString();
     const resource=providerSnapshot(await d.provider.read(s.providerId),s);
     await d.db('snapshot',{sessionId:s.sessionId,providerId:s.providerId,status:resource.status,
      playbackId:resource.playback_ids[0].id,observedAt});
    }
    checked++;
   }catch {pending++;}
  }));
 }
 return {checked,stopped,pending};
}
