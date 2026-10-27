import {publicReviewEligible} from './azure-review.ts'
export function reviewStorageTarget(reference: unknown, owner: string, project: string) {
 if(typeof reference!=='string'||reference.includes('%')||reference.includes('\\')||reference.split('/').some(x=>x==='.'||x==='..'))throw Error('Unsupported photo reference')
 const url=new URL(reference)
 if(url.origin!==project||url.search||url.hash||url.username||url.password)throw Error('Unsupported photo reference')
 const match=/^\/storage\/v1\/object\/(?:public|authenticated)\/(media|posts)\/([a-zA-Z0-9_./-]+)$/.exec(url.pathname)
 if(!match||!match[2].startsWith(owner+'/')||match[2].split('/').some(x=>!x||x==='.'||x==='..'))throw Error('Unsupported photo reference')
 return {bucket:match[1],path:match[2]}
}
export function reviewImageBytes(bytes:Uint8Array) {
 if(bytes.length<12||bytes.length>4*1024*1024)throw Error('Unsupported photo size')
 const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255
 const png=[137,80,78,71,13,10,26,10].every((value,index)=>bytes[index]===value)
 if(!jpeg&&!png)throw Error('Unsupported photo type')
 let encoded='';for(let offset=0;offset<bytes.length;offset+=8192)encoded+=String.fromCharCode(...bytes.subarray(offset,offset+8192))
 return btoa(encoded)
}
interface Dependencies {
 reserve:()=>Promise<boolean>;read:()=>Promise<Record<string,unknown>>;
 download:(bucket:string,path:string)=>Promise<Uint8Array>;
 analyze:(input:{caption?:string;imageBase64?:string})=>Promise<string>;
 finish:(state:string)=>Promise<void>;log:(event:string)=>void;
}
export async function runPhotoReview(owner:string,project:string,deps:Dependencies) {
 if(!await deps.reserve())return {state:'already_reserved'}
 try {
  const post=await deps.read()
  if(!publicReviewEligible(post,owner))throw Error('Photo is no longer eligible')
  const target=reviewStorageTarget(post.image_url,owner,project)
  if(post.content!==null&&post.content!==undefined&&typeof post.content!=='string')throw Error('Invalid caption')
  const caption=typeof post.content==='string'?post.content:''
  if(caption.length>500)throw Error('Caption too long')
  const imageBase64=reviewImageBytes(await deps.download(target.bucket,target.path))
  let state=await deps.analyze({imageBase64})
  if(!['needs_review','no_flag_detected'].includes(state))throw Error('Unknown review result')
  if(caption.trim()) {
   const captionState=await deps.analyze({caption})
   if(!['needs_review','no_flag_detected'].includes(captionState))throw Error('Unknown caption review result')
   if(captionState==='needs_review')state='needs_review'
  }
  await deps.finish(state);deps.log('photo_review_completed');return {state}
 } catch {
  try {await deps.finish('failed')} catch {deps.log('photo_review_reconciliation_required')}
  deps.log('photo_review_failed');throw Error('Photo review unavailable; no safety approval was issued')
 }
}
