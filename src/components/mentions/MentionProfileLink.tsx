import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {supabase} from '@/lib/supabase';
export function MentionProfileLink({username}:{username:string}) {
 const navigate=useNavigate(),[busy,setBusy]=useState(false),[failed,setFailed]=useState(false);
 return <span><button type="button" className="inline text-purple-200 underline" disabled={busy} aria-label={'View @'+username+"'s profile"} onClick={event=>{
  event.stopPropagation();if(busy)return;setBusy(true);setFailed(false);
  void supabase.from('profiles').select('id').ilike('username',username.replace(/[\\%_]/g,'\\.eq('username',username).limit(1)')).limit(2).maybeSingle().then(({data,error})=>{
   if(error||!data)setFailed(true);else navigate('/user/'+encodeURIComponent(data.id));
  }).then(()=>setBusy(false),()=>{setFailed(true);setBusy(false);});
 }}>@{username}</button>{failed&&<span role="status" className="text-sm"> (profile unavailable)</span>}</span>;
}
