import {useParams,Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {z} from 'zod';
import {supabase} from '@/lib/supabase';
import {useAuth} from '@/contexts/AuthContext';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {BackButton} from '@/components/ui/back-button';
import BoostedDiscovery from '@/components/BoostedDiscovery';

export default function Game() {
  const {id}=useParams();const {user}=useAuth();
  const gameId=z.string().uuid().safeParse(id);
  const query=useQuery({queryKey:['game-discovery',id,user?.id],enabled:gameId.success,retry:false,
    queryFn:async()=>{
      const [game,clips]=await Promise.all([
        supabase.from('games').select('id,name,cover_url').eq('id',id!).maybeSingle(),
        supabase.from('posts').select('id,content,image_url').eq('game_id',id!).eq('is_published',true)
          .eq('moderation_hidden',false).or('is_premium.is.null,is_premium.eq.false')
          .or('is_subscriber_only.is.null,is_subscriber_only.eq.false').in('post_type',['clipt','clipts','video'])
          .not('video_url','is',null).order('created_at',{ascending:false}).limit(30),
      ]);
      if(game.error)throw game.error;if(clips.error)throw clips.error;
      return {game:game.data,clips:clips.data};
    }});
  return <main className="container max-w-3xl px-4 py-6 pb-44 space-y-6">
    <BackButton/><h1 className="text-2xl font-bold">Game discovery</h1>
    {!gameId.success?<p role="alert">This game is not available in the Clipt catalog.</p>:<>
      {query.isPending&&<p role="status">Loading game and Clipts…</p>}
      {query.isError&&<Card className="p-5"><p role="alert">Unable to load this game.</p><Button onClick={()=>void query.refetch()}>Retry</Button></Card>}
      {!query.isError&&query.data&&!query.data.game&&<p>Game not found.</p>}
      {!query.isError&&query.data?.game&&<>
        <header className="flex items-center gap-4">{query.data.game.cover_url&&<img src={query.data.game.cover_url} alt="" className="w-20 rounded object-cover"/>}<h2 className="text-xl font-semibold">{query.data.game.name}</h2></header>
        <BoostedDiscovery gameId={id}/>
        <Link to={`/game-streamers/${id}`} className="inline-block underline">Find creators for this game</Link>
        <section className="space-y-3"><h2 className="text-xl font-semibold">Recent organic Clipts</h2>
          <p className="text-sm text-muted-foreground">Newest published Clipts. Boost spending does not change this order.</p>
          {query.data.clips.length===0?<p>No published Clipts for this game yet.</p>:query.data.clips.map(clip=><Card key={clip.id} className="p-4"><Link to={`/post/${clip.id}`} className="underline break-words">{clip.content||'Watch Clipt'}</Link></Card>)}
        </section>
      </>}
    </>}
  </main>;
}
