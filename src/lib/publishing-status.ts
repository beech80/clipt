export type PublishingStatus = {id:string; owner:string; destination:'clipts'|'squad'; stage:'uploading'|'publishing'|'reward'|'complete'|'error'; message?:string; postId?:string; uncertain?:boolean};
let current: PublishingStatus|null=null;
const listeners=new Set<()=>void>();
const uncertainOwners=new Set<string>();
export const publishingSnapshot=()=>current;
export const subscribePublishing=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};};
export const publishingActive=()=>Boolean(current && !['complete','error'].includes(current.stage));
export const publishingUncertain=(owner?:string)=>Boolean(owner && uncertainOwners.has(owner));
export const publishingBlocked=(owner?:string)=>publishingActive() || publishingUncertain(owner);
const beforeUnload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
export function beginPublishing(owner:string,destination:'clipts'|'squad') {
  if(publishingBlocked(owner))return null;
  const id=crypto.randomUUID();current={id,owner,destination,stage:'uploading'};
  if(typeof window!=='undefined')window.addEventListener('beforeunload',beforeUnload);
  listeners.forEach(fn=>fn());return id;
}
export function updatePublishing(id:string,patch:Partial<Pick<PublishingStatus,'stage'|'message'|'postId'|'uncertain'>>) {
  if(current?.id!==id)return;
  current={...current,...patch};
  if(patch.uncertain===true)uncertainOwners.add(current.owner);
  if(patch.uncertain===false)uncertainOwners.delete(current.owner);
  if(!publishingActive() && typeof window!=='undefined')window.removeEventListener('beforeunload',beforeUnload);
  listeners.forEach(fn=>fn());
}
