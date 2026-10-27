import { useQuery } from '@tanstack/react-query';
import {useState} from 'react';
import { Link } from 'react-router-dom';
import { Coins, Rocket, Gift, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {checkClipReward,clipRewardMessage} from '@/lib/clip-reward';

export default function TokenStore() {
  const { user } = useAuth();
  const [checking,setChecking]=useState('');const [rewardNotice,setRewardNotice]=useState('');
  const publications=useQuery({queryKey:['reward-publications',user?.id],enabled:Boolean(user),retry:false,
    queryFn:async()=>{const {data,error}=await supabase.from('posts').select('id,content').eq('user_id',user!.id).eq('is_published',true).eq('moderation_hidden',false).ilike('video_url','%.mp4').order('created_at',{ascending:false}).limit(10).retry(false);if(error)throw error;return data;}});
  const legacy=useQuery({queryKey:['legacy-token-history',user?.id],enabled:Boolean(user),retry:false,
    queryFn:async()=>{const {data,error}=await supabase.from('token_transactions').select('id,change_amount,new_balance,reason,created_at').eq('user_id',user!.id).order('created_at',{ascending:false}).limit(25).retry(false);if(error)throw error;return data;}});
  const wallet = useQuery({
    queryKey: ['token-wallet', user?.id], enabled: Boolean(user), retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.from('token_wallets').select('balance,updated_at').eq('user_id', user!.id).maybeSingle().retry(false);
      if (error) throw error;
      return data;
    },
  });
  const ledger = useQuery({
    queryKey: ['token-ledger', user?.id], enabled: Boolean(user), retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.from('token_ledger').select('id,kind,amount,created_at')
        .eq('user_id', user!.id).order('created_at', { ascending: false }).order('id').limit(25).retry(false);
      if (error) throw error;
      return data;
    },
  });
  async function retryReward(postId:string){
    if(checking)return;setChecking(postId);setRewardNotice('');
    try{setRewardNotice(clipRewardMessage(await checkClipReward(postId)));await Promise.all([wallet.refetch(),ledger.refetch()]);}
    catch{setRewardNotice('Reward not confirmed. No success is assumed; retry this same Clipt later.');}
    finally{setChecking('');}
  }
  return <main className="clipt-token-store mx-auto max-w-6xl space-y-6 px-4 py-6">
    <h1 className="flex items-center gap-3 text-2xl font-bold"><Coins className="text-yellow-300" aria-hidden="true" />Token Store</h1>
    <div className="clipt-store-topbar">
    <nav className="clipt-store-nav" aria-label="Token economy"><a href="#token-buy"><Coins aria-hidden="true" />Membership</a><Link to="/boosts"><Rocket aria-hidden="true" />Boosts / My Boosts</Link><a href="#token-earn"><Gift aria-hidden="true" />Earn Tokens</a><a href="#token-history"><History aria-hidden="true" />Transaction History</a></nav>
    <section className="clipt-store-balance rounded-xl border border-primary/50 bg-card p-5" aria-label="Token balance">
      <h2 className="text-sm text-muted-foreground">Your balance</h2>
      {wallet.isPending ? <p role="status">Loading balance…</p> : wallet.isError ? <div role="alert"><p>Balance is unavailable, not zero.</p><Button onClick={() => void wallet.refetch()}>Retry balance</Button></div> :
        <p className="mt-2 text-3xl font-bold text-yellow-300">{(wallet.data?.balance ?? 0).toLocaleString()} tokens</p>}
    </section>
    </div>
    <section id="token-buy" className="space-y-3 rounded-xl border border-primary/30 p-5">
      <h2 className="text-lg font-semibold">Earned Tokens</h2>
      <p className="text-sm text-muted-foreground">Tokens cannot be purchased. Earn them through eligible activity; membership changes earning limits and Boost benefits.</p>
      <Link to="/subscription" className="block underline">Premium and Maxed memberships</Link>
      <p className="text-sm">Tokens buy virtual gifts and Boost exposure. They are not Trophy votes and do not increase Top Clipts rankings.</p>
      <Link to="/boosts" className="block underline">Browse Boosts</Link>
      <Link to="/live" className="inline-block underline">Find a live creator to support</Link>
    </section>
    <section id="token-earn" className="space-y-3 rounded-xl border border-primary/30 p-5" aria-label="Publication rewards">
      <h2 className="text-lg font-semibold">Earn from a Clipt</h2>
      <p className="text-sm text-muted-foreground">Eligible public H.264 MP4 uploads can earn up to 3 Tokens after server file checks. Ten distinct non-author likes on a verified Clipt can earn up to 3 more, once per Clipt. Daily and storage limits apply. Identical re-uploads do not earn again. WebM, watch, comment and live earning adapters are not yet enabled.</p>
      <p className="text-xs text-muted-foreground">Free: 15 earned/day, 200 stored · Premium: 30/day, 400 stored · Maxed: 50/day, 1,000 stored. Daily limits reset at 00:00 UTC. Balances are not trimmed on downgrade.</p>
      {publications.isPending&&<p role="status">Loading recent publications…</p>}
      {publications.isError&&<><p role="alert">Recent publications could not be loaded.</p><Button onClick={()=>void publications.refetch()}>Retry publications</Button></>}
      {!publications.isError&&publications.data?.map(post=><div key={post.id} className="space-y-2 border-t border-primary/20 pt-3"><Link className="block underline break-words" to={`/post/${post.id}`}>{post.content?.slice(0,120)||'Clipt'}</Link>
        <Button variant="outline" disabled={Boolean(checking)} onClick={()=>void retryReward(post.id)}>{checking===post.id?'Checking server reward…':'Check publication reward'}</Button></div>)}
      {!publications.isError&&publications.data?.length===0&&<p>No recent MP4 publications to check.</p>}
      {rewardNotice&&<p role="status">{rewardNotice}</p>}
    </section>
    <section id="token-history" aria-label="Token history" className="space-y-3">
      <h2 className="text-lg font-semibold">Recent activity</h2>
      <p className="text-xs text-muted-foreground">Your latest 25 recorded transactions.</p>
      {ledger.isPending ? <p role="status">Loading activity…</p> : ledger.isError ? <div role="alert"><p>Activity could not be loaded.</p><Button onClick={() => void ledger.refetch()}>Retry activity</Button></div> :
        !ledger.data?.length ? <p>No token activity yet.</p> : <ol className="space-y-2">{ledger.data.map(entry => <li key={entry.id} className="flex justify-between gap-3 rounded-lg border border-primary/30 bg-card p-4">
          <div><p className="font-semibold">{entry.kind}</p><p className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</p></div>
          <span className={entry.amount > 0 ? 'text-emerald-300' : 'text-violet-200'}>{entry.amount > 0 ? '+' : ''}{entry.amount.toLocaleString()}</span>
        </li>)}</ol>}
    </section>
    {legacy.isError&&<div role="alert"><p>Legacy Token history is unavailable.</p><Button onClick={()=>void legacy.refetch()}>Retry legacy history</Button></div>}
    {!legacy.isError&&!!legacy.data?.length&&<section className="space-y-3" aria-label="Legacy Token records"><h2 className="text-lg font-semibold">Preserved legacy records</h2>
      <p className="text-sm text-muted-foreground">Older coin records remain unchanged. They have not been silently converted into this wallet; reconciliation is pending.</p>
      {legacy.data.map(entry=><div key={entry.id} className="border border-primary/30 rounded p-4"><p>{entry.reason||'Legacy transaction'}</p><p className="text-sm">Recorded change: {entry.change_amount} · Recorded balance: {entry.new_balance}</p></div>)}
    </section>}
  </main>;
}
