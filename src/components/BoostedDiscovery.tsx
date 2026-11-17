import {useQuery} from '@tanstack/react-query';
import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {Crown,Gamepad2,Gem,UserPlus,Zap} from 'lucide-react';
import {useAuth} from '@/contexts/AuthContext';
import {supabase} from '@/lib/supabase';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';

type BoostedOpportunity={
  boost_id:string;post_id:string;creator_id:string;package_code:string;expires_at:string;
  caption:string|null;image_url:string|null;
};
const labels:Record<string,{text:string;Icon:typeof Zap}>={
  squad_blast:{text:'SQUAD BLAST · BOOSTED',Icon:Gamepad2},
  hidden_gem:{text:'HIDDEN GEM · BOOSTED',Icon:Gem},
  chain_reaction:{text:'CHAIN REACTION · BOOSTED',Icon:Zap},
  squad_recruit:{text:'SQUAD RECRUIT · BOOSTED CREATOR',Icon:UserPlus},
  king_now:{text:'I’M THE KING NOW · BOOSTED SPOTLIGHT',Icon:Crown},
};
function record(boostId:string,event:'impression'|'post_view'|'profile_visit'){
  return supabase.rpc('record_content_boost_event',{p_boost_id:boostId,p_event_type:event});
}
function BoostedCard({clip}:{clip:BoostedOpportunity}){
  useEffect(()=>{void record(clip.boost_id,'impression');},[clip.boost_id]);
  const recruit=clip.package_code==='squad_recruit';const label=labels[clip.package_code]??labels.squad_blast;
  const Icon=label.Icon;const href=recruit?`/user/${clip.creator_id}?boost=${clip.boost_id}`:`/post/${clip.post_id}?boost=${clip.boost_id}`;
  return <Card className="p-4 border-primary/40 space-y-3" data-boost-placement={clip.package_code}>
    <span className="flex items-center gap-2 text-xs tracking-widest text-primary font-bold"><Icon size={16} aria-hidden/>{label.text}</span>
    <Link to={href} onClick={()=>void record(clip.boost_id,recruit?'profile_visit':'post_view')}
      className="block min-h-11 underline font-semibold break-words">
      {recruit?'Meet this creator':clip.caption||'View boosted Clipt'}
    </Link>
    {recruit&&clip.caption&&<p className="text-sm text-muted-foreground">Represented by: {clip.caption}</p>}
    <p className="text-xs text-muted-foreground">Promotional placement · Expires {new Date(clip.expires_at).toLocaleString()}</p>
  </Card>;
}
export default function BoostedDiscovery({gameId}:{gameId?:string}){
  const {user}=useAuth();const [now,setNow]=useState(Date.now);
  useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer);},[]);
  const query=useQuery({queryKey:['boosted-discovery',user?.id,gameId],enabled:Boolean(user),retry:false,refetchInterval:60000,
    queryFn:async()=>{
      const {data,error}=await supabase.rpc('get_boosted_discovery',gameId?{p_game_id:gameId}:{});
      if(error)throw error;return (data??[]) as BoostedOpportunity[];
    }});
  if(!user)return null;
  return <section aria-label="Boosted discovery" className="space-y-3 my-6">
    <h2 className="text-xl font-semibold">{gameId?'Boosted game discovery':'Boosted discovery'}</h2>
    <p className="text-sm text-muted-foreground">Clearly labeled earned-Token placements, separate from organic Trophy rankings. No guaranteed views or followers.</p>
    {query.isPending&&<p role="status">Loading Boosted opportunities…</p>}
    {query.isError&&<div><p role="alert">Boosted discovery is unavailable.</p><Button variant="outline" onClick={()=>void query.refetch()}>Retry Boosted discovery</Button></div>}
    {!query.isError&&query.data?.length===0&&<p className="text-sm text-muted-foreground">No new Boosted opportunities for you right now.</p>}
    {!query.isError&&query.data?.filter(clip=>Date.parse(clip.expires_at)>now).map(clip=><BoostedCard key={clip.boost_id} clip={clip}/>)}
  </section>;
}
