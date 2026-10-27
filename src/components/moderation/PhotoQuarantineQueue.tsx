import {useEffect,useRef,useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {z} from 'zod';
import {supabase,storageProjectUrl} from '@/integrations/supabase/client';
import {useAuth} from '@/contexts/AuthContext';
import {Button} from '@/components/ui/button';
const schema=z.array(z.object({job_id:z.string().uuid(),post_id:z.string().uuid(),quarantined_at:z.string(),appeal_requested_at:z.string().nullable(),decision:z.string().nullable()})).max(100);
export function PhotoQuarantineQueue(){
 const {user}=useAuth(),client=useQueryClient();
 const actor=useRef(user?.id);actor.current=user?.id;
 const [preview,setPreview]=useState<{job:string;url:string;caption:string}|null>(null);
 const [loaded,setLoaded]=useState(false);
 const [decision,setDecision]=useState<'restore'|'keep'|null>(null);
 useEffect(()=>{setPreview(null);setLoaded(false);setDecision(null);},[user?.id]);
 const development=storageProjectUrl==='https://akiksrlzdqvipqbbjxpw.supabase.co';
 const queue=useQuery({queryKey:['photo-quarantine-queue',user?.id],enabled:!!user&&development,retry:false,
  queryFn:async()=>{const {data,error}=await supabase.rpc('photo_quarantine_queue');if(error)throw error;return schema.parse(data);}});
 const open=useMutation({mutationFn:async(job:string)=>{
  const {data,error}=await supabase.functions.invoke('review-quarantine',{body:{jobId:job}});if(error)throw error;
  const value=z.object({url:z.string().url(),caption:z.string(),postId:z.string().uuid()}).parse(data);
  const url=new URL(value.url);if(url.origin!==storageProjectUrl||!url.pathname.startsWith('/storage/v1/object/sign/'))throw Error('Invalid review preview');
  return {job,url:value.url,caption:value.caption,actor:user?.id};
 },onSuccess:data=>{if(data.actor!==actor.current)return;setLoaded(false);setDecision(null);setPreview(data);}});
 const resolve=useMutation({mutationFn:async()=>{
  if(!preview||!loaded||!decision)throw Error('Inspect the current media first');
  const {data,error}=await supabase.rpc('resolve_photo_quarantine',{p_job:preview.job,p_decision:decision});if(error)throw error;
  if(typeof data!=='boolean')throw Error('Decision unconfirmed');
 },onSuccess:async()=>{setPreview(null);setLoaded(false);setDecision(null);await client.invalidateQueries({queryKey:['photo-quarantine-queue',user?.id]});}});
 if(!development)return null;
 return <section className="gaming-card p-4 space-y-3" aria-labelledby="quarantine-heading">
  <h2 id="quarantine-heading" className="text-lg font-semibold">Automatically quarantined photos</h2>
  <p>These posts are hidden. Inspect the protected preview before restoring or keeping one hidden. No automatic bans.</p>
  {queue.isPending?<p role="status">Loading quarantines…</p>:queue.isError?<div role="alert"><p>Quarantine access unavailable. Staff role and MFA are required.</p><Button onClick={()=>void queue.refetch()}>Retry quarantines</Button></div>:
   !queue.data?.length?<p>No unresolved quarantines.</p>:<ul className="space-y-2">{queue.data.map(row=><li key={row.job_id} className="rounded border border-purple-500/40 p-3 flex flex-wrap items-center gap-3">
    <span>{row.appeal_requested_at?'Creator requested review':'Automatically flagged'}</span><Button disabled={open.isPending||resolve.isPending} onClick={()=>{setPreview(null);setLoaded(false);setDecision(null);open.mutate(row.job_id);}}>Open protected review</Button>
   </li>)}</ul>}
  {open.isError&&<p role="alert">Preview unavailable. Verify staff MFA and refresh; do not restore unseen media.</p>}
  {preview&&<div className="space-y-3 rounded border border-purple-500/40 p-3">
   <img src={preview.url} alt="Quarantined photo for authorized moderation review" className="max-h-80 w-full object-contain" onLoad={()=>setLoaded(true)} onError={()=>setLoaded(false)}/>
   <p className="break-words">{preview.caption}</p>
   {!loaded&&<p role="status">Preview not loaded. Reopen the review if its short-lived media access expired.</p>}
   <Button disabled={!loaded||resolve.isPending} onClick={()=>setDecision('restore')}>Restore photo</Button>
   <Button variant="outline" disabled={!loaded||resolve.isPending} onClick={()=>setDecision('keep')}>Keep hidden</Button>
   {decision&&<div role="group" aria-label="Confirm quarantine decision"><p>{decision==='restore'?'Restore this inspected photo to its prior public audience?':'Keep this photo hidden? The post and audit are retained.'}</p><Button disabled={resolve.isPending} onClick={()=>resolve.mutate()}>Confirm decision</Button><Button variant="outline" disabled={resolve.isPending} onClick={()=>setDecision(null)}>Cancel</Button></div>}
  </div>}
  {resolve.isError&&<p role="alert">Decision unconfirmed. The snapshot may have changed; refresh and review again.</p>}
 </section>;
}
