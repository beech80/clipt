import {useQuery} from '@tanstack/react-query';
import {useState,useRef,useEffect} from 'react';
import {Link} from 'react-router-dom';
import {z} from 'zod';
import {Zap, Crown, Radio, Users} from 'lucide-react';
import {useAuth} from '@/contexts/AuthContext';
import {supabase} from '@/lib/supabase';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter} from '@/components/ui/alert-dialog';
import WeeklyMegaBoost from '@/components/WeeklyMegaBoost';

const economySchema=z.object({
  membership:z.enum(['free','premium','maxed']),discount_percent:z.number().int().min(0).max(20),
  daily_earned_cap:z.number().int().positive(),stored_balance_cap:z.number().int().positive(),
  balance:z.number().int().nonnegative(),weekly_content_boost_entitled:z.boolean(),
  weekly_squad_blast:z.object({available:z.boolean(),used:z.boolean(),week_start:z.string(),resets_at:z.string(),package_code:z.literal('squad_blast'),token_cost:z.literal(0),rollover:z.literal(false)}).optional(),
  weekly_mega_boost_status:z.enum(['definition_pending','not_entitled']),
  packages:z.array(z.object({code:z.enum(['squad_blast','chain_reaction','king_now','stream_surge']),
    name:z.string(),base_price:z.number().int().positive(),final_price:z.number().int().positive(),
    duration_seconds:z.number().int().positive(),target_kind:z.enum(['clipt','stream']),description:z.string()})).length(4),
});
const icons={squad_blast:Users,chain_reaction:Zap,king_now:Crown,stream_surge:Radio};
const duration=(seconds:number)=>seconds<3600?`${seconds/60} minutes`:`${seconds/3600} hours`;
const pendingSchema=z.object({post:z.string().uuid(),code:z.string(),cost:z.number().int().nonnegative(),request:z.string().uuid(),name:z.string(),mode:z.enum(['paid','weekly']).default('paid'),week:z.string().optional()});
const historySchema=z.array(z.object({id:z.string().uuid(),post_id:z.string().uuid(),package_code:z.string(),token_cost:z.number(),funding_source:z.string().optional(),expires_at:z.string(),state:z.enum(['active','expired','invalidated'])}));

export default function Boosts() {
  const {user}=useAuth();
  const storageKey=`clipt.boost.pending.${user?.id}`;
  const [pending,setPending]=useState<z.infer<typeof pendingSchema>|null>(()=>{
    try{return pendingSchema.parse(JSON.parse(sessionStorage.getItem(storageKey)||'null'));}catch{return null;}
  });
  const [post,setPost]=useState('');const [busy,setBusy]=useState(false);const lock=useRef(false);
  const [notice,setNotice]=useState('');const [failure,setFailure]=useState('');
  const [now,setNow]=useState(Date.now);
  useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer);},[]);
  const economy=useQuery({queryKey:['boost-economy',user?.id],enabled:Boolean(user),retry:false,
    queryFn:async()=>{const {data,error}=await supabase.rpc('get_boost_economy');if(error)throw error;return economySchema.parse(data);}});
  const data=economy.data;
  const eligible=useQuery({queryKey:['boost-eligible',user?.id],enabled:Boolean(user),retry:false,
    queryFn:async()=>{const result=await supabase.from('posts').select('id,content,game_id').eq('user_id',user!.id)
      .eq('is_published',true).eq('moderation_hidden',false).or('is_premium.is.null,is_premium.eq.false')
      .or('is_subscriber_only.is.null,is_subscriber_only.eq.false').is('required_tier_id',null)
      .not('video_url','is',null).in('post_type',['clipt','clipts','video']).order('created_at',{ascending:false}).limit(100);
      if(result.error)throw result.error;return result.data;}});
  const history=useQuery({queryKey:['boost-history',user?.id],enabled:Boolean(user),retry:false,refetchInterval:15000,
    queryFn:async()=>{const {data,error}=await supabase.rpc('get_my_content_boosts');if(error)throw error;return historySchema.parse(data);}});
  function review(pack:z.infer<typeof economySchema>['packages'][number],weekly=false) {
    if(!post||pending)return;
    if(weekly && (!data?.weekly_squad_blast?.available || pack.code!=='squad_blast'))return;
    const request={post,code:pack.code,cost:weekly?0:pack.final_price,request:crypto.randomUUID(),name:weekly?'Free weekly SQUAD BLAST':pack.name,mode:weekly?'weekly' as const:'paid' as const,week:weekly?data?.weekly_squad_blast?.week_start:undefined};
    try{sessionStorage.setItem(storageKey,JSON.stringify(request));setPending(request);setFailure('');setNotice('');}
    catch{setFailure('Unable to save retry protection in this browser. No Tokens were spent.');}
  }
  async function confirm() {
    if(!pending||lock.current)return;lock.current=true;setBusy(true);setFailure('');
    try{
      const {data:id,error}=pending.mode==='weekly'
        ?await supabase.rpc('redeem_weekly_squad_blast',{p_post_id:pending.post,p_idempotency_key:pending.request,p_expected_week:pending.week??''})
        :await supabase.rpc('purchase_content_boost',{p_post_id:pending.post,p_package_code:pending.code,p_idempotency_key:pending.request,p_expected_cost:pending.cost});
      if(error)throw error;if(!z.string().uuid().safeParse(id).success)throw new Error('Confirmation unavailable');
      sessionStorage.removeItem(storageKey);setPending(null);setNotice(pending.mode==='weekly'?'Weekly Squad Blast confirmed by the server. No Tokens were spent.':'Purchase confirmed by the server. See its current status below.');
      await Promise.all([economy.refetch(),history.refetch(),eligible.refetch()]);
    }catch(error){
      const code=error&&typeof error==='object'&&'code'in error?String(error.code):'';
      const known=['22023','42501','23514','23505'].includes(code);
      setFailure(known&&error&&typeof error==='object'&&'message'in error?String(error.message):'Confirmation was not received. Retry this same request to safely check the outcome; do not start another purchase.');
      if(known){sessionStorage.removeItem(storageKey);setPending(null);void economy.refetch();void history.refetch();}
    }finally{lock.current=false;setBusy(false);}
  }
  return <main className="clipt-boosts container max-w-6xl px-4 py-6 space-y-6">
    <header className="space-y-2"><h1 className="text-2xl font-bold flex items-center gap-2"><Zap aria-hidden className="text-primary"/>Boost your Clipt</h1>
      <p className="text-sm text-muted-foreground">More discovery opportunities. Real people, real interactions. Never guaranteed views or Trophy rankings.</p></header>
    {economy.isPending && <p role="status">Loading server prices and Token balance…</p>}
    {economy.isError && <Card className="p-5 space-y-3"><p role="alert">Unable to load Boost prices and balance. No Tokens have been spent.</p>
      <Button onClick={()=>void economy.refetch()}>Retry</Button></Card>}
    {!economy.isError && data && <>
      <Card className="p-5 border-primary/40 space-y-2">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">{data.membership} membership</p>
        <p className="text-3xl font-bold tabular-nums">{data.balance.toLocaleString()} <span className="text-base font-normal">Tokens</span></p>
        <p className="text-sm">{data.discount_percent}% membership Boost discount · Prices confirmed by the server</p>
        <p className="text-xs text-muted-foreground">Membership limits: earn up to {data.daily_earned_cap}/day; store up to {data.stored_balance_cap}. Reward verification is still being completed. Existing balances are preserved.</p>
        <Button variant="outline" asChild><Link to="/tokens">Token history</Link></Button>
      </Card>
      <section className="space-y-2"><h2 className="font-semibold" id="boost-target-label">Choose your eligible Clipt</h2>
        {eligible.isPending&&<p role="status">Loading eligible Clipts…</p>}
        {eligible.isError&&<><p role="alert">Unable to load eligible content.</p><Button onClick={()=>void eligible.refetch()}>Retry content</Button></>}
        {!eligible.isError&&eligible.data?.length===0&&<p>No eligible published public video Clipts. <Link className="underline" to="/new-post">Create a Clipt</Link></p>}
        {!!eligible.data?.length&&<Select value={post} onValueChange={setPost} disabled={Boolean(pending)||busy}><SelectTrigger aria-labelledby="boost-target-label"><SelectValue placeholder="Select a Clipt"/></SelectTrigger><SelectContent>{eligible.data.map(clip=><SelectItem key={clip.id} value={clip.id}>{clip.content?.slice(0,80)||'Untitled Clipt'}</SelectItem>)}</SelectContent></Select>}
        <p className="text-xs text-muted-foreground">The server rechecks ownership, visibility and moderation when you confirm. One active Boost per Clipt. Up to 100 recent eligible Clipts shown.</p>
      </section>
      {notice&&<p role="status">{notice}</p>}{failure&&!pending&&<p role="alert">{failure}</p>}
      <div data-page-controller="boost-options" className="grid gap-4 sm:grid-cols-2">{data.packages.map(pack=>{
        const Icon=icons[pack.code];return <Card key={pack.code} data-boost-package={pack.code} className="clipt-boost-package p-5 space-y-3 border-primary/30">
          <Icon aria-hidden className="h-6 w-6 text-primary"/><h2 className="font-bold break-words">{pack.name}</h2>
          <p className="text-2xl font-bold tabular-nums">{pack.final_price} <span className="text-sm font-normal">Tokens</span></p>
          {data.discount_percent>0 && <p className="text-sm text-muted-foreground"><s>{pack.base_price} Tokens</s> · {data.discount_percent}% membership discount</p>}
          <p className="text-sm">{duration(pack.duration_seconds)}</p><p className="text-sm text-muted-foreground">{pack.description}</p>
          {data.balance<pack.final_price && <p className="text-sm">Insufficient Tokens for this package.</p>}
          {pack.code==='king_now'&&post&&!eligible.data?.find(clip=>clip.id===post)?.game_id&&<p className="text-sm">Select a Clipt with a game to use this spotlight.</p>}
          <Button onClick={()=>review(pack)} disabled={pack.target_kind==='stream'||!post||Boolean(pending)||busy||eligible.isError||data.balance<pack.final_price||(pack.code==='king_now'&&!eligible.data?.find(clip=>clip.id===post)?.game_id)} className="w-full whitespace-normal h-auto min-h-11 py-2">{pack.target_kind==='stream'?'Live verification required':`Review ${pack.name}`}</Button>
        </Card>;
      })}</div>
      {data.weekly_content_boost_entitled && <Card className="p-5 space-y-3"><h2 className="font-semibold">Free weekly Squad Blast</h2>
        <p className="text-sm text-muted-foreground">One 24-hour Squad Blast per Premium member per UTC calendar week. Resets Monday at 00:00 UTC. Unused Boosts do not accumulate and have no Token or cash value.</p>
        {data.weekly_squad_blast?<>
          <p>{data.weekly_squad_blast.available?'Available this week':data.weekly_squad_blast.used?'Redeemed this week':'Not currently available'} · 0 Tokens</p>
          <p className="text-xs">Next reset: {new Date(data.weekly_squad_blast.resets_at).toLocaleString(undefined,{timeZone:'UTC'})} UTC</p>
          <Button className="w-full whitespace-normal h-auto min-h-11" disabled={!data.weekly_squad_blast.available||!post||Boolean(pending)||busy||eligible.isError}
            onClick={()=>{const pack=data.packages.find(item=>item.code==='squad_blast');if(pack)review(pack,true);}}>Review free weekly Squad Blast</Button>
        </>:<p role="status">Weekly entitlement status is unavailable. Refresh prices to retry; no redemption has been confirmed.</p>}
      </Card>}
      {data.membership==='maxed' && <WeeklyMegaBoost/>}
      <section data-page-controller="boost-history" className="space-y-3"><h2 className="text-xl font-semibold">Your Boosts</h2>
        {history.isPending&&<p role="status">Loading Boost history…</p>}
        {history.isError&&<><p role="alert">Unable to load Boost status. Do not assume a pending purchase failed.</p><Button onClick={()=>void history.refetch()}>Retry status</Button></>}
        {!history.isError&&history.data?.length===0&&<p>No Boost purchases yet.</p>}
        {!history.isError&&history.data?.map(boost=>{
          const state=boost.state==='active'&&Date.parse(boost.expires_at)<=now?'expired':boost.state;
          return <Card key={boost.id} className="p-4 space-y-2"><p className="font-semibold">{data.packages.find(pack=>pack.code===boost.package_code)?.name||boost.package_code}</p>
            <p>{state==='active'?'Active':state==='expired'?'Expired':'Invalidated'} · {boost.funding_source==='premium_weekly'?'Free weekly entitlement · ':''}{boost.token_cost} Tokens</p>
            <p className="text-sm">{state==='active'?`${Math.max(0,Math.ceil((Date.parse(boost.expires_at)-now)/60000))} minutes remaining · `:''}Expires {new Date(boost.expires_at).toLocaleString()}</p>
            <Link className="underline text-sm" to={`/post/${boost.post_id}`}>View Clipt</Link></Card>;
        })}
      </section>
      <p className="text-sm text-muted-foreground">Boosts are separate from organic Trophies, virtual gifts and real-money donations. Distribution stops when content becomes ineligible; no automatic refund is promised.</p>
    </>}
    <AlertDialog open={Boolean(pending)}><AlertDialogContent className="clipt-boost-review overflow-y-auto"><AlertDialogHeader>
      <AlertDialogTitle>Confirm {pending?.name}</AlertDialogTitle><AlertDialogDescription>{pending?.mode==='weekly'?'Use this week’s free Squad Blast entitlement. No Tokens will be spent. Unused entitlements do not roll over.':`Spend ${pending?.cost} Tokens.`} This provides discovery opportunities, not guaranteed views or Trophy ranking. The server revalidates eligibility. Hidden or removed content stops receiving distribution.</AlertDialogDescription>
    </AlertDialogHeader>{failure&&<p role="alert" className="text-sm">{failure}</p>}<AlertDialogFooter>
      <Button variant="outline" disabled={busy||Boolean(failure)} onClick={()=>{sessionStorage.removeItem(storageKey);setPending(null);}}>Cancel</Button>
      <Button disabled={busy} onClick={()=>void confirm()}>{busy?'Awaiting server confirmation…':failure?'Retry same purchase':'Confirm Boost'}</Button>
    </AlertDialogFooter></AlertDialogContent></AlertDialog>
  </main>;
}
