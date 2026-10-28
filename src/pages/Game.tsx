import {useParams,Link} from 'react-router-dom';
import {useQuery,useInfiniteQuery} from '@tanstack/react-query';
import {z} from 'zod';
import {supabase} from '@/lib/supabase';
import {useAuth} from '@/contexts/AuthContext';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {BackButton} from '@/components/ui/back-button';
import BoostedDiscovery from '@/components/BoostedDiscovery';
import DiscoveryPostCard from '@/components/post/DiscoveryPostCard';
import {gameVideoFeed} from '@/lib/discovery-feeds';

export default function Game() {
  const {id}=useParams();const {user}=useAuth();
  const gameId=z.string().uuid().safeParse(id);
  const query=useQuery({queryKey:['game-discovery',id,user?.id],enabled:gameId.success,retry:false,
    queryFn:async({signal})=>{
      const result=await supabase.from('games').select('id,name,cover_url').eq('id',id!).abortSignal(signal).maybeSingle();
      if(result.error)throw result.error;
      return result.data;
    }});
  const clips=useInfiniteQuery({queryKey:['game-videos',id,user?.id],enabled:gameId.success&&Boolean(query.data),retry:false,
    initialPageParam:0,queryFn:({pageParam,signal})=>gameVideoFeed(id!,pageParam,signal),
    getNextPageParam:(last,pages)=>last.more?pages.length:undefined});
  const posts=[...new Map(clips.data?.pages.flatMap(page=>page.items).map(post=>[post.id,post])??[]).values()];
  return <main className="container max-w-3xl px-4 py-6 pb-44 space-y-6">
    <BackButton/><h1 className="text-2xl font-bold">Game discovery</h1>
    {!gameId.success?<p role="alert">This game is not available in the Clipt catalog.</p>:<>
      {query.isPending&&<p role="status">Loading game…</p>}
      {query.isError&&<Card className="p-5"><p role="alert">Unable to load this game.</p><Button onClick={()=>void query.refetch()}>Retry</Button></Card>}
      {!query.isError&&!query.isPending&&!query.data&&<p>Game not found.</p>}
      {!query.isError&&query.data&&<>
        <header className="flex items-center gap-4">{query.data.cover_url&&<img src={query.data.cover_url} alt="" className="w-20 rounded object-cover"/>}<h2 className="text-xl font-semibold">{query.data.name}</h2></header>
        <BoostedDiscovery gameId={id}/>
        <Link to={'/game-streamers/'+id} className="inline-block underline">Find creators for this game</Link>
        <section className="space-y-3"><h2 className="text-xl font-semibold">Recent organic Clipts</h2>
          <p className="text-sm text-muted-foreground">Newest published videos. Boost spending does not change this order.</p>
          {clips.isPending&&<p role="status">Loading Clipts…</p>}
          {clips.isError&&<div role="alert"><p>Unable to load this game's Clipts.</p><Button onClick={()=>void clips.refetch()}>Retry Clipts</Button></div>}
          {!clips.isPending&&!clips.isError&&posts.length===0&&<p>No published Clipts for this game yet.</p>}
          {posts.map(post=><DiscoveryPostCard key={post.id} post={post}/>)}
          {clips.hasNextPage&&<Button disabled={clips.isFetchingNextPage} onClick={()=>void clips.fetchNextPage()}>{clips.isFetchingNextPage?'Loading…':'Load more Clipts'}</Button>}
        </section>
      </>}
    </>}
  </main>;
}
