import {useQuery} from '@tanstack/react-query';
import {useAuth} from '@/contexts/AuthContext';
import {supabase} from '@/lib/supabase';
import {Button} from '@/components/ui/button';
import {BlockUserButton} from '@/components/BlockUserButton';
import {MuteUserButton} from '@/components/profile/MuteUserButton';

export function CreatorSafetySettings(){
 const {user}=useAuth();
 const blocked=useQuery({queryKey:['blocked-users',user?.id],enabled:!!user,retry:false,queryFn:async()=>{
  const rows:{blocked_id:string}[]=[];
  for(let offset=0;;offset+=500){const {data,error}=await supabase.from('user_blocks').select('blocked_id').eq('blocker_id',user!.id).order('blocked_id').range(offset,offset+499);if(error)throw error;rows.push(...data);if(data.length<500)return rows;}
 }});
 const muted=useQuery({queryKey:['muted-creators',user?.id],enabled:!!user,retry:false,queryFn:async()=>{
  const ids:string[]=[];
  for(let offset=0;;offset+=500){const {data,error}=await supabase.from('user_mutes').select('muted_id').eq('owner_id',user!.id).order('muted_id').range(offset,offset+499);if(error)throw error;ids.push(...data.map(x=>x.muted_id));if(data.length<500)return ids;}
 }});
 return <section className="gaming-card p-5 space-y-4" aria-label="Blocked and muted creators">
  <h2 className="text-xl font-semibold">Blocked and muted creators</h2>
  <p>Mute hides a creator from your Clipts and Squad feeds. It does not block messages. Blocking restricts account interactions; already downloaded/public copies cannot be recalled.</p>
  <h3>Blocked accounts</h3>
  {blocked.isPending?<p role="status">Loading blocked accounts…</p>:blocked.isError?<div role="alert"><p>Blocked accounts unavailable.</p><Button onClick={()=>void blocked.refetch()}>Retry blocked accounts</Button></div>:!blocked.data?.length?<p>No blocked accounts.</p>:<ul>{blocked.data.map(x=><li key={x.blocked_id} className="space-y-2 border-b py-3"><p className="break-all text-sm">Account {x.blocked_id}</p><BlockUserButton userId={x.blocked_id} username="this account" variant="outline" size="default"/></li>)}</ul>}
  <h3>Muted creators</h3>
  {muted.isPending?<p role="status">Loading muted creators…</p>:muted.isError?<div role="alert"><p>Muted creators unavailable.</p><Button onClick={()=>void muted.refetch()}>Retry muted creators</Button></div>:!muted.data?.length?<p>No muted creators.</p>:<ul>{muted.data.map(id=><li key={id} className="space-y-2 border-b py-3"><p className="break-all text-sm">Account {id}</p><MuteUserButton userId={id}/></li>)}</ul>}
 </section>;
}
