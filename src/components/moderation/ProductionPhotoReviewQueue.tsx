import {useEffect,useRef,useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {z} from 'zod';
import {Link} from 'react-router-dom';
import {supabase,storageProjectUrl} from '@/integrations/supabase/client';
import {useAuth} from '@/contexts/AuthContext';
import {Button} from '@/components/ui/button';

const schema=z.array(z.object({job_id:z.string().uuid(),post_id:z.string().uuid(),state:z.string(),created_at:z.string()})).max(100);
export function ProductionPhotoReviewQueue(){
 const {user}=useAuth(),client=useQueryClient(),actor=useRef(user?.id);actor.current=user?.id;
 const [preview,setPreview]=useState<{id:string;urls:string[];caption:string}|null>(null),[loaded,setLoaded]=useState<Set<number>>(()=>new Set()),[decision,setDecision]=useState<'restore'|'keep'|null>(null);
 const production=storageProjectUrl==='https://slnjliheyiiummxhrgmk.supabase.co';
 useEffect(()=>{setPreview(null);setLoaded(new Set());setDecision(null);},[user?.id]);
 const queue=useQuery({queryKey:['production-photo-review',user?.id],enabled:production&&!!user,retry:false,refetchInterval:60000,queryFn:async()=>{
  const {data,error}=await supabase.rpc('production_photo_review_queue' as never);if(error)throw error;return schema.parse(data);
 }});
 const open=useMutation({mutationFn:async(id:string)=>{
  const {data,error}=await supabase.functions.invoke('production-photo-preview',{body:{jobId:id}});if(error)throw error;
  const value=z.object({postId:z.string().uuid(),urls:z.array(z.string().url()).min(1).max(10),caption:z.string()}).parse(data);
  if(value.urls.some(value=>{const url=new URL(value);return url.origin!==storageProjectUrl||!url.pathname.startsWith('/storage/v1/object/sign/');}))throw Error('Invalid protected preview');
  return {id,urls:value.urls,caption:value.caption,actor:user?.id};
 },onSuccess:value=>{if(value.actor!==actor.current)return;setPreview(value);setLoaded(new Set());setDecision(null);}});
 const resolve=useMutation({mutationFn:async()=>{
  if(!preview||!decision||loaded.size!==preview.urls.length)throw Error('Inspect every photo first');
  const {data,error}=await supabase.rpc('resolve_production_photo_review' as never,{p_job:preview.id,p_decision:decision} as never);if(error)throw error;if(typeof data!=='boolean')throw Error('Decision unconfirmed');
 },onSuccess:async()=>{setPreview(null);setLoaded(new Set());setDecision(null);await client.invalidateQueries({queryKey:['production-photo-review',user?.id]});}});
 if(!production||!user)return null;
 const inspected=Boolean(preview)&&loaded.size===preview!.urls.length;
 return <section className="gaming-card p-4 space-y-3" aria-labelledby="production-photo-review-heading">
  <h2 id="production-photo-review-heading" className="text-lg font-semibold">Photo and caption review</h2>
  <p>Inspect every photo and its caption before a decision. Pending, failed and quota-limited scans remain held. Videos require reports and human moderation.</p>
  {queue.isPending?<p role="status">Loading reviews…</p>:queue.isError?<div role="alert"><p>Moderator access and an authenticator verification are required.</p><Link className="underline inline-flex min-h-11 items-center" to="/settings">Open Settings to enable two-factor authentication</Link><Button onClick={()=>void queue.refetch()}>Retry reviews</Button></div>:
   !queue.data?.length?<p>No photo posts require review.</p>:<ul className="space-y-3">{queue.data.map(row=><li key={row.job_id} className="rounded border border-purple-500/40 p-3 flex flex-wrap items-center justify-between gap-3">
    <span>{row.state==='processing'?'Automatic scan in progress':row.state==='needs_review'?'Flagged photo or caption':row.state==='failed'?'Scan failed — human review needed':'Awaiting review'}</span>
    <Button disabled={open.isPending||resolve.isPending||row.state==='processing'} onClick={()=>{setPreview(null);setLoaded(new Set());setDecision(null);open.mutate(row.job_id);}}>Inspect protected photos</Button>
   </li>)}</ul>}
  {open.isError&&<p role="alert">Protected preview unavailable. Refresh your MFA session and reopen the current review.</p>}
  {preview&&<div className="space-y-3 rounded border border-purple-500/40 p-3">
   {preview.urls.map((url,index)=><img key={url} src={url} alt={'Photo '+(index+1)+' for authorized moderation'} className="max-h-80 w-full object-contain" onLoad={()=>setLoaded(old=>new Set(old).add(index))} onError={()=>setLoaded(old=>{const next=new Set(old);next.delete(index);return next;})}/>)}
   <p className="break-words">{preview.caption}</p>
   {!inspected&&<p role="status">Load and inspect every photo. Reopen the preview if its 60-second access expires.</p>}
   <Button disabled={!inspected||resolve.isPending} onClick={()=>setDecision('restore')}>Approve for its original audience</Button>
   <Button variant="outline" disabled={!inspected||resolve.isPending} onClick={()=>setDecision('keep')}>Keep hidden</Button>
   {decision&&<div role="group" aria-label="Confirm photo review decision"><p>{decision==='restore'?'Release this inspected version to its original audience?':'Keep this version hidden without deleting its media?'}</p><Button disabled={resolve.isPending} onClick={()=>resolve.mutate()}>Confirm decision</Button><Button variant="outline" disabled={resolve.isPending} onClick={()=>setDecision(null)}>Cancel</Button></div>}
  </div>}
  {resolve.isError&&<p role="alert">Decision unconfirmed. The post may have changed or still be processing; refresh and inspect it again.</p>}
 </section>;
}
