import {useRef} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {z} from 'zod';
import {supabase,storageProjectUrl} from '@/integrations/supabase/client';
import {useAuth} from '@/contexts/AuthContext';
import {Button} from '@/components/ui/button';

const reviewsSchema=z.array(z.object({job_id:z.string().uuid(),post_id:z.string().uuid(),
 quarantined_at:z.string(),appeal_requested_at:z.string().nullable(),decision:z.enum(['restore','keep']).nullable()})).max(100);
export function PhotoSafetyNotices(){
 const {user}=useAuth();
 const client=useQueryClient();
 const busy=useRef(false);
 const development=storageProjectUrl==='https://akiksrlzdqvipqbbjxpw.supabase.co';
 const key=['my-photo-quarantines',user?.id];
 const holds=useQuery({queryKey:['my-photo-review-holds',user?.id],enabled:!!user&&development,retry:false,refetchInterval:60000,
  queryFn:async()=>{const {data,error}=await supabase.rpc('my_photo_review_holds');if(error)throw error;
   return z.array(z.object({post_id:z.string().uuid(),state:z.enum(['queued','processing','failed']),created_at:z.string()})).max(100).parse(data);}});
 const reviews=useQuery({queryKey:key,enabled:!!user&&development,retry:false,refetchInterval:60000,
  queryFn:async()=>{const {data,error}=await supabase.rpc('my_photo_quarantines');if(error)throw error;return reviewsSchema.parse(data);}});
 const appeal=useMutation({mutationFn:async(job:string)=>{
  if(!user||busy.current)throw Error('Review request unavailable');busy.current=true;
  try {const {data,error}=await supabase.rpc('appeal_photo_quarantine',{p_job:job});if(error)throw error;
   if(typeof data!=='boolean')throw Error('Review request was not confirmed');
  } finally {busy.current=false;}
 },onSuccess:async()=>{await client.invalidateQueries({queryKey:key});}});
 if(!development||!user)return null;
 return <section className="gaming-card p-4 space-y-3" aria-labelledby="photo-safety-heading">
  <h2 id="photo-safety-heading" className="text-xl font-semibold">Photo safety notices</h2>
  <p>Automated flags can be mistaken. A quarantined photo is hidden from other people, not deleted. You can request human review.</p>
  {holds.isPending?<p role="status">Checking pending photo reviews…</p>:holds.isError?<p role="alert">Pending-review status is unavailable, not approved.</p>:holds.data?.map(row=><p key={row.post_id} role="status">{row.state==='failed'?'A photo review failed or could not be confirmed. This version remains out of public discovery.':'A photo is waiting for automated review and is not public yet.'} <Link className="underline" to={`/post/${row.post_id}`}>Open my post</Link></p>)}
  {reviews.isPending?<p role="status">Loading your photo reviews…</p>:reviews.isError?<div role="alert"><p>Photo review status is unavailable. No safety approval is assumed.</p><Button variant="outline" onClick={()=>void reviews.refetch()}>Retry photo review status</Button></div>:
   !reviews.data?.length?<p>No photo quarantines recorded for this account.</p>:<ul className="space-y-3">{reviews.data.map(row=><li key={row.job_id} className="rounded border border-purple-500/40 p-3 space-y-2">
    <p>{row.decision==='restore'?'Review completed — photo restored.':row.decision==='keep'?'Review completed — photo remains hidden.':'Automated photo review flagged this public post. It is hidden pending review.'}</p>
    <Link className="inline-flex min-h-11 items-center underline" to={`/post/${row.post_id}`}>Open my post</Link>
    {!row.decision&&(row.appeal_requested_at?<p role="status">Your review request is recorded.</p>:<Button disabled={appeal.isPending} onClick={()=>{appeal.reset();appeal.mutate(row.job_id);}}>Request human review</Button>)}
   </li>)}</ul>}
  {appeal.isError&&<p role="alert">The review request could not be confirmed. Refresh your status before retrying.</p>}
  <p className="text-xs text-muted-foreground">Showing up to 100 recent records. This is an in-app notice, not an email or push-delivery confirmation.</p>
 </section>;
}
