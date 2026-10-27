import {useRef,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useAuth} from '@/contexts/AuthContext';
import {supabase} from '@/lib/supabase';
import {Button} from '@/components/ui/button';

export function MuteUserButton({userId}:{userId:string}) {
 const {user}=useAuth(); const cache=useQueryClient();
 const busy=useRef(false); const [pending,setPending]=useState(false); const [error,setError]=useState('');
 const read=async()=>{const {data,error}=await supabase.from('user_mutes').select('muted_id').eq('owner_id',user!.id).eq('muted_id',userId).maybeSingle();if(error)throw error;return Boolean(data);};
 const status=useQuery({queryKey:['mute-status',user?.id,userId],enabled:!!user&&user.id!==userId,queryFn:read,retry:false});
 async function toggle(){
  if(!user||busy.current||!status.isSuccess)return;
  busy.current=true;setPending(true);setError('');
  try {
   const desired=!status.data;
   const result=desired ? await supabase.from('user_mutes').insert({owner_id:user.id,muted_id:userId})
    : await supabase.from('user_mutes').delete().eq('owner_id',user.id).eq('muted_id',userId);
   if(result.error&&!(desired&&result.error.code==='23505'))throw result.error;
   if(await read()!==desired)throw Error('Unconfirmed');
   cache.setQueryData(['mute-status',user.id,userId],desired);
   cache.setQueryData<string[]>(['muted-creators',user.id],previous=>desired?[...new Set([...(previous||[]),userId])].sort():(previous||[]).filter(id=>id!==userId));
   await cache.invalidateQueries({queryKey:['muted-creators']});
  }catch{setError('Mute preference could not be confirmed. Please retry.');}
  finally{busy.current=false;setPending(false);}
 }
 if(!user||user.id===userId)return null;
 return <div className="space-y-2">
  {status.isError?<div role="alert"><p>Mute status unavailable.</p><Button onClick={()=>void status.refetch()}>Retry mute status</Button></div>:
   <Button variant="outline" disabled={pending||status.isPending} onClick={()=>void toggle()}>{pending?'Updating…':status.isPending?'Checking mute status…':status.data?'Unmute creator':'Mute creator'}</Button>}
  {error&&<p role="alert" className="text-sm">{error}</p>}
 </div>;
}
