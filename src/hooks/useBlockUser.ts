import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useBlockUser() {
  const [isBlocking, setIsBlocking] = useState(false);
  const busy = useRef(false);
  const owner = useCallback(async (target: string) => {
    const {data,error}=await supabase.auth.getUser();
    if(error || !data.user || !target || data.user.id===target) throw new Error('Block authorization unavailable');
    return data.user.id;
  },[]);
  const read = useCallback(async (actor: string,target: string) => {
    const {data,error}=await supabase.from('user_blocks').select('blocked_id')
      .eq('blocker_id',actor).eq('blocked_id',target).maybeSingle();
    if(error) throw error;
    return Boolean(data);
  },[]);
  const checkIfBlocked = useCallback(async(target: string)=>read(await owner(target),target),[owner,read]);
  const change = useCallback(async(target: string,blocked: boolean)=>{
    if(busy.current) throw new Error('Block update already in progress');
    busy.current=true;setIsBlocking(true);
    try {
      const actor=await owner(target);
      const result=blocked
        ? await supabase.from('user_blocks').insert({blocker_id:actor,blocked_id:target})
        : await supabase.from('user_blocks').delete().eq('blocker_id',actor).eq('blocked_id',target);
      if(result.error && !(blocked && result.error.code==='23505')) throw result.error;
      if(await read(actor,target)!==blocked) throw new Error('Block update unconfirmed');
      return blocked;
    } finally {busy.current=false;setIsBlocking(false);}
  },[owner,read]);
  const blockUser=useCallback((target: string)=>change(target,true),[change]);
  const unblockUser=useCallback((target: string)=>change(target,false),[change]);
  return {blockUser,unblockUser,checkIfBlocked,isBlocking};
}
