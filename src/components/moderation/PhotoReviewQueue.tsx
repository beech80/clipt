import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {z} from 'zod';
import {supabase} from '@/lib/supabase';
import {useAuth} from '@/contexts/AuthContext';
import {Button} from '@/components/ui/button';

const rowsSchema=z.array(z.object({id:z.string().uuid(),post_id:z.string().uuid(),
  state:z.enum(['pending','needs_review','failed']),created_at:z.string().datetime({offset:true})})).max(100);
export function PhotoReviewQueue(){
 const {user}=useAuth();
 const queryClient=useQueryClient();
 const [selection,setSelection]=useState<{id:string;decision:'dismiss'|'hide'}|null>(null);
 const resolution=useMutation({mutationFn:async({id,decision}:{id:string;decision:'dismiss'|'hide'})=>{
  const {data,error}=await supabase.rpc('resolve_azure_photo_review' as never,{p_job:id,p_decision:decision} as never);
  if(error)throw error;if(typeof data!=='boolean')throw new Error('Invalid review response');
 },onSuccess:async()=>{setSelection(null);await queryClient.invalidateQueries({queryKey:['azure-photo-review',user?.id]});}});
 const development=import.meta.env.VITE_SUPABASE_URL==='https://akiksrlzdqvipqbbjxpw.supabase.co';
 const queue=useQuery({queryKey:['azure-photo-review',user?.id],enabled:Boolean(user)&&development,retry:false,
  queryFn:async()=>{const {data,error}=await supabase.rpc('azure_photo_review_queue' as never);if(error)throw error;return rowsSchema.parse(data);}});
 if(!development)return null;
 return <section aria-labelledby="photo-review-heading" className="gaming-card p-4 space-y-3">
  <h2 id="photo-review-heading" className="text-lg font-semibold">Public photo review pilot</h2>
  <p className="text-sm text-muted-foreground">This queue requires human review. The separately configured development quarantine pilot can hide flagged public photos; neither flow automatically bans users. A result is not a guarantee of safety.</p>
  {resolution.isError&&<p role="alert">Review could not be resolved. Verify MFA and staff access, refresh the queue, and inspect the current photo before retrying.</p>}
  {selection&&<div className="border border-purple-500/30 rounded p-3 space-y-2" role="group" aria-label="Confirm photo review decision">
   <p>{selection.decision==='hide'?'Hide this public photo from Clipt? Media is retained; this does not delete the post or ban its creator.':'Dismiss this review after inspecting the photo? This records your decision, not a safety guarantee.'}</p>
   <Button disabled={resolution.isPending} onClick={()=>resolution.mutate(selection)}>Confirm {selection.decision==='hide'?'hide':'dismiss'}</Button>
   <Button variant="outline" disabled={resolution.isPending} onClick={()=>setSelection(null)}>Cancel decision</Button>
  </div>}
  {!user?<p>Sign in with a staff account to view reviews.</p>:queue.isPending?<p role="status">Loading photo reviews…</p>:queue.isError?
   <div role="alert"><p>Photo review queue unavailable. The pilot may not be deployed or access may be denied.</p><Button variant="outline" onClick={()=>void queue.refetch()}>Retry photo reviews</Button></div>:
   !queue.data?.length?<p>No pending photo reviews.</p>:<ul className="space-y-2">{queue.data.map(row=><li key={row.id} className="flex flex-wrap items-center justify-between gap-2 border border-purple-500/30 rounded p-3">
    <span>{row.state==='needs_review'?'Flagged for review':row.state==='failed'?'Scan failed — review pending':'Scan pending'}</span>
    <Link className="underline min-h-11 inline-flex items-center" to={`/post/${row.post_id}`}>Open public photo</Link>
    {row.state!=='pending'&&<div className="flex flex-wrap gap-2">
     <Button variant="outline" disabled={resolution.isPending} onClick={()=>{resolution.reset();setSelection({id:row.id,decision:'dismiss'});}}>Dismiss review</Button>
     <Button variant="outline" disabled={resolution.isPending} onClick={()=>{resolution.reset();setSelection({id:row.id,decision:'hide'});}}>Hide photo</Button>
    </div>}
   </li>)}</ul>}
 </section>;
}
