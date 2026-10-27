import {useQuery} from '@tanstack/react-query';
import {useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {z} from 'zod';
import {supabase} from '@/lib/supabase';
import {useAuth} from '@/contexts/AuthContext';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';

const statusSchema=z.object({available:z.boolean(),used:z.boolean(),window_start:z.string().nullable(),resets_at:z.string().nullable(),duration_seconds:z.literal(86400),rollover:z.literal(false)});
const requestSchema=z.object({post:z.string().uuid(),request:z.string().uuid(),window:z.string()});
export default function WeeklyMegaBoost() {
 const {user}=useAuth();
 // Remount on account change so retry state can never cross accounts.
 return user?<MegaForAccount key={user.id} userId={user.id}/>:null;
}
function MegaForAccount({userId}:{userId:string}) {
 const storageKey='clipt.mega.pending.v1.'+userId;
 const [pending,setPending]=useState<z.infer<typeof requestSchema>|null>(()=>{try{return requestSchema.parse(JSON.parse(sessionStorage.getItem(storageKey)||'null'));}catch{return null;}});
 const [post,setPost]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const lock=useRef(false);
 const status=useQuery({queryKey:['weekly-mega',userId],retry:false,refetchInterval:15000,queryFn:async()=>{
  const {data,error}=await supabase.rpc('get_weekly_mega_status');if(error)throw error;return statusSchema.parse(data);
 }});
 const eligible=useQuery({queryKey:['mega-eligible',userId],enabled:Boolean(status.data?.available),retry:false,queryFn:async()=>{
  const {data,error}=await supabase.from('posts').select('id,content').eq('user_id',userId).eq('is_published',true).eq('moderation_hidden',false)
   .or('is_premium.is.null,is_premium.eq.false').or('is_subscriber_only.is.null,is_subscriber_only.eq.false').is('required_tier_id',null)
   .not('game_id','is',null).in('post_type',['clipt','clipts','video','photo']).order('created_at',{ascending:false}).limit(100);
  if(error)throw error;return data;
 }});
 async function activate() {
  if(lock.current)return;
  let attempt=pending;
  if(!attempt) {
   if(!post||!status.data?.available||!status.data.window_start)return;
   attempt={post,request:crypto.randomUUID(),window:status.data.window_start};
   try{sessionStorage.setItem(storageKey,JSON.stringify(attempt));setPending(attempt);}
   catch{setNotice('Retry protection is unavailable. Nothing was redeemed.');return;}
  }
  lock.current=true;setBusy(true);setNotice('');
  try {
   const {data,error}=await supabase.rpc('redeem_weekly_mega',{p_post:attempt.post,p_request:attempt.request,p_window:attempt.window});
   if(error)throw error;
   if(!z.string().uuid().safeParse(data).success)throw new Error('Unconfirmed result');
   sessionStorage.removeItem(storageKey);setPending(null);setNotice('Mega Boost confirmed by the server. The original activation lasts 24 hours; no Tokens were spent.');
   await Promise.all([status.refetch(),eligible.refetch()]);
  }catch(error) {
   const code=error&&typeof error==='object'&&'code'in error?String(error.code):'';
   if(['42501','22023','23505'].includes(code)){sessionStorage.removeItem(storageKey);setPending(null);setNotice('The server declined this redemption. Refresh entitlement status and choose an eligible Clipt.');void status.refetch();}
   else setNotice('No confirmation received. Retry the same request to check its outcome safely.');
  }finally{lock.current=false;setBusy(false);}
 }
 return <Card className="p-5 space-y-3 border-primary/40">
  <h2 className="font-semibold">Maxed Weekly Mega Boost</h2>
  <p className="text-sm text-muted-foreground">One 24-hour Boost every 7 days while your paid Maxed membership is active. Enhanced Squad distribution and labeled featured placement in your Clipt’s game. Unused entitlements expire; they never accumulate. No guaranteed views or Trophy advantage.</p>
  {status.isPending?<p role="status">Checking server entitlement…</p>:status.isError?<div><p role="alert">Mega Boost activation is unavailable until the billing backend is configured and verified.</p><Button variant="outline" onClick={()=>void status.refetch()}>Retry entitlement</Button></div>:
   <p>{status.data?.available?'Available · 0 Tokens':status.data?.used?'Already redeemed this 7-day period':'Active paid Maxed membership required'}{status.data?.resets_at?' · Next period '+new Date(status.data.resets_at).toLocaleString():''}</p>}
  {status.data?.available&&<div className="space-y-2">
   <label htmlFor="mega-clipt" className="block text-sm">Choose your published photo or video Clipt with a game</label>
   {eligible.isPending&&<p role="status">Loading Clipts…</p>}
   {eligible.isError&&<div><p role="alert">Unable to load Clipts.</p><Button onClick={()=>void eligible.refetch()}>Retry Clipts</Button></div>}
   {eligible.data?.length===0&&<p>No eligible game Clipts yet. <Link className="underline" to="/new-post">Create one</Link></p>}
   <select id="mega-clipt" className="w-full min-h-11 rounded-md border border-primary/40 bg-background p-2" value={post} disabled={busy||Boolean(pending)} onChange={event=>setPost(event.target.value)}>
    <option value="">Select a Clipt</option>{eligible.data?.map(item=><option key={item.id} value={item.id}>{item.content?.slice(0,80)||'Untitled Clipt'}</option>)}
   </select>
  </div>}
  {(status.data?.available||pending)&&<Button className="w-full h-auto min-h-11 whitespace-normal" disabled={busy||(!pending&&(!post||eligible.isError))} onClick={()=>void activate()}>{busy?'Awaiting server…':pending?'Retry same Mega Boost':'Activate 24-hour Mega Boost · 0 Tokens'}</Button>}
  {notice&&<p role="status" className="text-sm">{notice}</p>}
 </Card>;
}
