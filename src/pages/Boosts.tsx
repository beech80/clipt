import {useQuery} from '@tanstack/react-query';
import {useState,useRef,useEffect} from 'react';
import {Link} from 'react-router-dom';
import {z} from 'zod';
import {Zap,Crown,Gem,UserPlus,Users} from 'lucide-react';
import {useAuth} from '@/contexts/AuthContext';
import {supabase} from '@/lib/supabase';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter} from '@/components/ui/alert-dialog';
import {membershipsEnabled} from '@/config/featureFlags';

const packageCodes=['squad_blast','hidden_gem','chain_reaction','squad_recruit','king_now'] as const;
type PackageCode=(typeof packageCodes)[number];
const allPackageCodes=[...packageCodes,'stream_surge'] as const;
const packageSchema=z.object({code:z.enum(allPackageCodes),name:z.string(),base_price:z.number().int().positive(),
  final_price:z.number().int().positive(),duration_seconds:z.number().int().positive(),
  target_kind:z.enum(['clipt','stream']),description:z.string()});
const economySchema=z.object({
  membership:z.enum(['free','premium','maxed']),discount_percent:z.number().int().min(0).max(20),
  daily_earned_cap:z.number().int().positive(),stored_balance_cap:z.number().int().positive(),
  balance:z.number().int().nonnegative(),weekly_content_boost_entitled:z.boolean(),
  weekly_mega_boost_status:z.enum(['definition_pending','not_entitled']),
  packages:z.array(packageSchema),
});
const icons:Record<PackageCode,typeof Zap>={
  squad_blast:Users,hidden_gem:Gem,chain_reaction:Zap,squad_recruit:UserPlus,king_now:Crown,
};
const duration=(seconds:number)=>seconds<3600?`${seconds/60} minutes`:`${seconds/3600} hours`;
const pendingSchema=z.object({post:z.string().uuid(),code:z.enum(packageCodes),cost:z.number().int().positive(),
  request:z.string().uuid(),name:z.string()});
const analyticsSchema=z.object({
  promotional_impressions:z.number().int().nonnegative(),attributed_post_views:z.number().int().nonnegative(),
  attributed_profile_visits:z.number().int().nonnegative(),attributed_follows:z.number().int().nonnegative(),
  campaign_window_likes:z.number().int().nonnegative(),campaign_window_comments:z.number().int().nonnegative(),
  campaign_window_shares:z.number().int().nonnegative(),total_post_views:z.number().int().nonnegative(),
});
const emptyAnalytics:z.infer<typeof analyticsSchema>={promotional_impressions:0,attributed_post_views:0,
  attributed_profile_visits:0,attributed_follows:0,campaign_window_likes:0,campaign_window_comments:0,
  campaign_window_shares:0,total_post_views:0};
const historySchema=z.array(z.object({
  id:z.string().uuid(),post_id:z.string().uuid(),package_code:z.string(),token_cost:z.number(),
  activated_at:z.string(),expires_at:z.string(),state:z.enum(['active','expired','invalidated']),
  analytics:analyticsSchema.optional().default(emptyAnalytics),
}));

export default function Boosts(){
  const {user}=useAuth();
  const storageKey=`clipt.boost.pending.${user?.id}`;
  const [pending,setPending]=useState<z.infer<typeof pendingSchema>|null>(()=>{
    try{return pendingSchema.parse(JSON.parse(sessionStorage.getItem(storageKey)||'null'));}catch{return null;}
  });
  const [post,setPost]=useState('');const [busy,setBusy]=useState(false);const lock=useRef(false);
  const [notice,setNotice]=useState('');const [failure,setFailure]=useState('');const [now,setNow]=useState(Date.now);
  useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer);},[]);
  const economy=useQuery({queryKey:['boost-economy',user?.id],enabled:Boolean(user),retry:false,
    queryFn:async()=>{const {data,error}=await supabase.rpc('get_boost_economy');if(error)throw error;return economySchema.parse(data);}});
  const data=economy.data;
  const visiblePackages=data?.packages.filter((pack):pack is z.infer<typeof packageSchema>&{code:PackageCode;target_kind:'clipt'}=>
    pack.target_kind==='clipt'&&packageCodes.includes(pack.code as PackageCode))??[];
  const eligible=useQuery({queryKey:['boost-eligible',user?.id],enabled:Boolean(user),retry:false,
    queryFn:async()=>{
      const result=await supabase.from('posts').select('id,content,game_id,created_at,video_url,image_url,post_type')
        .eq('user_id',user!.id).eq('is_published',true).eq('moderation_hidden',false)
        .or('is_premium.is.null,is_premium.eq.false').or('is_subscriber_only.is.null,is_subscriber_only.eq.false')
        .is('required_tier_id',null).or('video_url.not.is.null,image_url.not.is.null')
        .in('post_type',['clipt','clipts','video','photo','post']).order('created_at',{ascending:false}).limit(100);
      if(result.error)throw result.error;return result.data;
    }});
  const history=useQuery({queryKey:['boost-history',user?.id],enabled:Boolean(user),retry:false,refetchInterval:15000,
    queryFn:async()=>{const {data,error}=await supabase.rpc('get_my_content_boosts');if(error)throw error;return historySchema.parse(data);}});
  function review(pack:(typeof visiblePackages)[number]){
    if(!post||pending)return;
    const request={post,code:pack.code,cost:pack.final_price,request:crypto.randomUUID(),name:pack.name};
    try{sessionStorage.setItem(storageKey,JSON.stringify(request));setPending(request);setFailure('');setNotice('');}
    catch{setFailure('Unable to save retry protection in this browser. No Tokens were spent.');}
  }
  async function confirm(){
    if(!pending||lock.current)return;lock.current=true;setBusy(true);setFailure('');
    try{
      const {data:id,error}=await supabase.rpc('purchase_content_boost',{
        p_post_id:pending.post,p_package_code:pending.code,p_idempotency_key:pending.request,p_expected_cost:pending.cost,
      });
      if(error)throw error;if(!z.string().uuid().safeParse(id).success)throw new Error('Confirmation unavailable');
      sessionStorage.removeItem(storageKey);setPending(null);
      setNotice('Purchase confirmed by the server. See its current status below.');
      await Promise.all([economy.refetch(),history.refetch(),eligible.refetch()]);
    }catch(error){
      const code=error&&typeof error==='object'&&'code'in error?String(error.code):'';
      const known=['22023','42501','23514','23505'].includes(code);
      setFailure(known&&error&&typeof error==='object'&&'message'in error?String(error.message):
        'Confirmation was not received. Retry this same request to safely check the outcome; do not start another purchase.');
      if(known){sessionStorage.removeItem(storageKey);setPending(null);void economy.refetch();void history.refetch();}
    }finally{lock.current=false;setBusy(false);}
  }
  return <main className="clipt-boosts container max-w-6xl px-4 py-6 space-y-6">
    <header className="space-y-2"><h1 className="text-2xl font-bold flex items-center gap-2"><Zap aria-hidden className="text-primary"/>Boost your Clipt</h1>
      <p className="text-sm text-muted-foreground">Five earned-Token Boosts for genuine discovery. Never guaranteed views, followers, engagement, or Trophy rankings.</p></header>
    {economy.isPending&&<p role="status">Loading server prices and Token balance…</p>}
    {economy.isError&&<Card className="p-5 space-y-3"><p role="alert">Unable to load Boost prices and balance. No Tokens have been spent.</p>
      <Button onClick={()=>void economy.refetch()}>Retry</Button></Card>}
    {!economy.isError&&data&&<>
      <Card className="p-5 border-primary/40 space-y-2" aria-label="Token balance">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">{membershipsEnabled?`${data.membership} membership`:'Free account'}</p>
        <p className="text-3xl font-bold tabular-nums">{data.balance.toLocaleString()} <span className="text-base font-normal">Tokens</span></p>
        <p className="text-sm">Boost prices are confirmed by the server for every free account.</p>
        <p className="text-xs text-muted-foreground">Tokens are earned, not purchased. The server validates balances and activation limits atomically.</p>
        <Button variant="outline" asChild><Link to="/tokens">Token history</Link></Button>
      </Card>
      <section className="space-y-2"><h2 className="font-semibold" id="boost-target-label">Choose an eligible Clipt or screenshot</h2>
        {eligible.isPending&&<p role="status">Loading eligible content…</p>}
        {eligible.isError&&<><p role="alert">Unable to load eligible content.</p><Button onClick={()=>void eligible.refetch()}>Retry content</Button></>}
        {!eligible.isError&&eligible.data?.length===0&&<p>No eligible published public Clipts or screenshots. <Link className="underline" to="/new-post">Create a post</Link></p>}
        {!!eligible.data?.length&&<Select value={post} onValueChange={setPost} disabled={Boolean(pending)||busy}>
          <SelectTrigger aria-labelledby="boost-target-label"><SelectValue placeholder="Select content"/></SelectTrigger>
          <SelectContent>{eligible.data.map(item=><SelectItem key={item.id} value={item.id}>
            {item.video_url?'Clipt':'Screenshot'} · {item.content?.slice(0,65)||'Untitled'}
          </SelectItem>)}</SelectContent>
        </Select>}
        <p className="text-xs text-muted-foreground">The server rechecks ownership, visibility, account status and moderation. One active post Boost per item, one active Squad Recruit per creator, and daily/weekly limits apply.</p>
      </section>
      {notice&&<p role="status">{notice}</p>}{failure&&!pending&&<p role="alert">{failure}</p>}
      <div data-page-controller="boost-options" className="grid gap-4 sm:grid-cols-2">{visiblePackages.map(pack=>{
        const Icon=icons[pack.code];const selected=eligible.data?.find(item=>item.id===post);
        const hiddenGemTooNew=pack.code==='hidden_gem'&&Boolean(selected)&&Date.parse(selected?.created_at??'')>Date.now()-6*60*60*1000;
        const needsGame=(pack.code==='king_now'||pack.code==='squad_recruit')&&Boolean(selected)&&!selected?.game_id;
        return <Card key={pack.code} data-boost-package={pack.code} className="clipt-boost-package p-5 space-y-3 border-primary/30">
          <Icon aria-hidden className="h-6 w-6 text-primary"/><h2 className="font-bold break-words">{pack.name}</h2>
          <p className="text-2xl font-bold tabular-nums">{pack.final_price} <span className="text-sm font-normal">Tokens</span></p>
          {membershipsEnabled&&data.discount_percent>0&&<p className="text-sm text-muted-foreground"><s>{pack.base_price} Tokens</s> · {data.discount_percent}% membership discount</p>}
          <p className="text-sm">{duration(pack.duration_seconds)}</p><p className="text-sm text-muted-foreground">{pack.description}</p>
          {data.balance<pack.final_price&&<p className="text-sm">Insufficient Tokens for this Boost.</p>}
          {hiddenGemTooNew&&<p className="text-sm">Hidden Gem requires content that is at least 6 hours old.</p>}
          {needsGame&&<p className="text-sm">Select content with a game to use this Boost.</p>}
          <Button onClick={()=>review(pack)} disabled={!post||Boolean(pending)||busy||eligible.isError||data.balance<pack.final_price||hiddenGemTooNew||needsGame}
            className="w-full whitespace-normal h-auto min-h-11 py-2">Review {pack.name}</Button>
        </Card>;
      })}</div>
      <section data-page-controller="boost-history" className="space-y-3"><h2 className="text-xl font-semibold">Your Boosts</h2>
        {history.isPending&&<p role="status">Loading Boost history…</p>}
        {history.isError&&<><p role="alert">Unable to load Boost status. Do not assume a pending purchase failed.</p><Button onClick={()=>void history.refetch()}>Retry status</Button></>}
        {!history.isError&&history.data?.length===0&&<p>No Boost purchases yet.</p>}
        {!history.isError&&history.data?.map(boost=>{
          const state=boost.state==='active'&&Date.parse(boost.expires_at)<=now?'expired':boost.state;
          return <Card key={boost.id} className="p-4 space-y-3"><p className="font-semibold">{visiblePackages.find(pack=>pack.code===boost.package_code)?.name||boost.package_code}</p>
            <p>{state==='active'?'Active':state==='expired'?'Expired':'Invalidated'} · {boost.token_cost} Tokens</p>
            <p className="text-sm">Activated {new Date(boost.activated_at).toLocaleString()} · {state==='active'?`${Math.max(0,Math.ceil((Date.parse(boost.expires_at)-now)/60000))} minutes remaining · `:''}Expires {new Date(boost.expires_at).toLocaleString()}</p>
            <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4" aria-label="Boost analytics">
              <div><dt className="text-muted-foreground">Promo impressions</dt><dd>{boost.analytics.promotional_impressions}</dd></div>
              <div><dt className="text-muted-foreground">Attributed post views</dt><dd>{boost.analytics.attributed_post_views}</dd></div>
              <div><dt className="text-muted-foreground">Profile visits</dt><dd>{boost.analytics.attributed_profile_visits}</dd></div>
              <div><dt className="text-muted-foreground">Attributed follows</dt><dd>{boost.analytics.attributed_follows}</dd></div>
              <div><dt className="text-muted-foreground">Likes during campaign</dt><dd>{boost.analytics.campaign_window_likes}</dd></div>
              <div><dt className="text-muted-foreground">Comments during campaign</dt><dd>{boost.analytics.campaign_window_comments}</dd></div>
              <div><dt className="text-muted-foreground">Shares during campaign</dt><dd>{boost.analytics.campaign_window_shares}</dd></div>
              <div><dt className="text-muted-foreground">Total post views</dt><dd>{boost.analytics.total_post_views}</dd></div>
            </dl>
            <p className="text-xs text-muted-foreground">Attributed counts come from labeled Boost placements. Campaign-window engagement is genuine activity during the Boost, not claimed as caused by it.</p>
            <Link className="underline text-sm" to={`/post/${boost.post_id}`}>View content</Link>
          </Card>;
        })}
      </section>
      <p className="text-sm text-muted-foreground">Boosts are separate from organic Trophies, virtual gifts and donations. Distribution stops when content becomes ineligible; the existing documented refund policy applies.</p>
    </>}
    <AlertDialog open={Boolean(pending)}><AlertDialogContent className="clipt-boost-review overflow-y-auto"><AlertDialogHeader>
      <AlertDialogTitle>Confirm {pending?.name}</AlertDialogTitle><AlertDialogDescription>Spend {pending?.cost} earned Tokens. This provides discovery opportunities, not guaranteed views, followers, engagement, or Trophy ranking. The server revalidates eligibility. Hidden or removed content stops receiving distribution.</AlertDialogDescription>
    </AlertDialogHeader>{failure&&<p role="alert" className="text-sm">{failure}</p>}<AlertDialogFooter>
      <Button variant="outline" disabled={busy||Boolean(failure)} onClick={()=>{sessionStorage.removeItem(storageKey);setPending(null);}}>Cancel</Button>
      <Button disabled={busy} onClick={()=>void confirm()}>{busy?'Awaiting server confirmation…':failure?'Retry same purchase':'Confirm Boost'}</Button>
    </AlertDialogFooter></AlertDialogContent></AlertDialog>
  </main>;
}
