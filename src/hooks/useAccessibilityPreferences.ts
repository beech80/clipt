import {useEffect} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useAuth} from '@/contexts/AuthContext';
import {supabase} from '@/lib/supabase';

export function useAccessibilityPreferences(){
  const {user}=useAuth();
  return useQuery({queryKey:['accessibility-preferences',user?.id],enabled:Boolean(user),retry:false,
    queryFn:async()=>{const {data,error}=await supabase.from('accessibility_settings').select('*').eq('user_id',user!.id).maybeSingle().retry(false);if(error)throw error;return data;}});
}

/** Mount once at app level so preferences survive navigation and fresh login. */
export function useApplyAccessibilityPreferences(){
  const {user}=useAuth();const query=useAccessibilityPreferences();
  useEffect(()=>{
    const root=document.documentElement;
    root.classList.toggle('high-contrast',Boolean(user&&query.data?.high_contrast));
    root.classList.toggle('reduce-motion',Boolean(user&&query.data?.reduced_motion));
    return()=>{root.classList.remove('high-contrast','reduce-motion');};
  },[user?.id,query.data?.high_contrast,query.data?.reduced_motion]);
}
