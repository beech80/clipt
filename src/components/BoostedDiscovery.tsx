import {useQuery} from '@tanstack/react-query';
import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from '@/contexts/AuthContext';
import {supabase} from '@/lib/supabase';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';

export default function BoostedDiscovery({gameId}:{gameId?:string}) {
  const {user}=useAuth();
  const [now,setNow]=useState(Date.now);
  useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer);},[]);
  const query=useQuery({queryKey:['boosted-discovery',user?.id,gameId],enabled:Boolean(user),retry:false,
    refetchInterval:15000,
    queryFn:async()=>{const {data,error}=await supabase.rpc('get_boosted_discovery',gameId?{p_game_id:gameId}:{});if(error)throw error;return data;}});
  if(!user) return null;
  return <section aria-label="Boosted discovery" className="space-y-3 my-6">
    <h2 className="text-xl font-semibold">{gameId?'Boosted game spotlight':'Boosted discovery'}</h2>
    <p className="text-sm text-muted-foreground">Token-funded or membership Boost exposure, separate from organic Trophy rankings. No guaranteed views.</p>
    {query.isPending && <p role="status">Loading Boosted opportunities…</p>}
    {query.isError && <div><p role="alert">Boosted discovery is unavailable.</p><Button variant="outline" onClick={()=>void query.refetch()}>Retry Boosted discovery</Button></div>}
    {!query.isError && query.data?.length===0 && <p className="text-sm text-muted-foreground">No active Boosted Clipts for you right now.</p>}
    {!query.isError && query.data?.filter(clip=>Date.parse(clip.expires_at)>now).map(clip=><Card key={clip.boost_id} className="p-4 border-primary/40 space-y-2">
      <span className="text-xs tracking-widest text-primary font-bold">{clip.package_code==='weekly_mega'?'MAXED MEGA · BOOSTED SPOTLIGHT':clip.package_code==='king_now'?'♛ BOOSTED SPOTLIGHT':'BOOSTED'}</span>
      <Link to={`/post/${clip.post_id}`} className="block underline font-semibold break-words">{clip.caption||'Watch Clipt'}</Link>
      <p className="text-xs text-muted-foreground">Expires {new Date(clip.expires_at).toLocaleString()}</p>
    </Card>)}
  </section>;
}
