import {Link,useSearchParams} from 'react-router-dom';
import {useState} from 'react';
import {useInfiniteQuery,useQuery} from '@tanstack/react-query';
import {Radio} from 'lucide-react';
import {useAuth} from '@/contexts/AuthContext';
import {supabase} from '@/lib/supabase';
import {completeGameCatalog} from '@/lib/game-catalog';
import {channelLivePage,validChannelGame,verifiedLiveBackend} from '@/lib/channel-feeds';
import {LiveStreamCard} from '@/components/streaming/LiveStreamCard';
import {Button} from '@/components/ui/button';
import '@/pages/clipt-channels.css';
export default function LiveDiscovery(){
 const {user,loading}=useAuth();const [mode,setMode]=useState<'all'|'following'>('all');const [params,setParams]=useSearchParams();const gameId=params.get('game')||undefined;const invalid=Boolean(gameId&&!validChannelGame(gameId));
 const catalog=useQuery({queryKey:['live-game-catalog',user?.id],retry:false,queryFn:({signal})=>completeGameCatalog('',signal)});
 const following=useQuery({queryKey:['live-following',user?.id],enabled:Boolean(user)&&mode==='following',retry:false,queryFn:async({signal})=>{const ids:string[]=[];for(let offset=0;;offset+=500){const {data,error}=await supabase.from('follows').select('following_id').eq('follower_id',user!.id).order('following_id').range(offset,offset+499).abortSignal(signal).retry(false);if(error)throw error;ids.push(...data.map(row=>row.following_id));if(data.length<500)return ids;}}});
 const streams=useInfiniteQuery({queryKey:['live-discovery',user?.id,mode,gameId,following.data],retry:false,enabled:!loading&&!invalid&&(!verifiedLiveBackend||Boolean(user))&&(mode==='all'||Boolean(user&&following.isSuccess)),initialPageParam:null as string|null,
 queryFn:({pageParam,signal})=>channelLivePage(gameId,pageParam,mode==='following'?following.data:undefined,signal),getNextPageParam:last=>last.next??undefined,staleTime:15000,refetchInterval:15000});
 const rows=streams.isError?[]:[...new Map(streams.data?.pages.flatMap(page=>page.items).map(stream=>[stream.id,stream])??[]).values()];
 const gameName=catalog.data?.find(game=>game.id===gameId)?.name;
 return <main className="clipt-live-discovery container max-w-6xl space-y-5 px-4 py-6">
 <header><h1 className="flex items-center gap-2 text-2xl font-bold"><Radio aria-hidden="true"/>Live Streams</h1><Button asChild><Link to={'/stream-setup'+(gameId&&!invalid?'?game='+gameId:'')}>Go Live</Link></Button><Button variant="outline" disabled={streams.isFetching} onClick={()=>{if(mode==='following')void following.refetch();void streams.refetch();}}>Refresh</Button></header>
 <p className="text-muted-foreground">Watch creators who are live now, or choose a game channel.</p>
 <div role="group" aria-label="Live discovery filter" className="clipt-filter-bar flex flex-wrap"><Button variant="outline" aria-pressed={mode==='all'} onClick={()=>setMode('all')}>Live Now</Button><Button variant="outline" aria-pressed={mode==='following'} disabled={!user} onClick={()=>setMode('following')}>Following</Button><label className="flex min-w-0 flex-col gap-1 text-sm"><span>Game channel</span><select aria-label="Filter live by game" className="clipt-live-game-filter" value={gameId??''} onChange={event=>setParams(current=>{if(event.target.value)current.set('game',event.target.value);else current.delete('game');return current;})}><option value="">All games</option>{catalog.data?.map(game=><option key={game.id} value={game.id}>{game.name}</option>)}</select></label></div>
 {gameId&&!invalid&&<Link className="inline-flex min-h-11 items-center underline" to={'/game/'+gameId+'?tab=live'}>Open {gameName||'game'} channel</Link>}
 {catalog.isError&&<div role="alert"><p>The game list is unavailable.</p><Button onClick={()=>void catalog.refetch()}>Retry game list</Button></div>}
 {invalid?<p role="alert">Choose a game from the Clipt catalog. <Link className="underline" to="/live">Show all games</Link></p>:verifiedLiveBackend&&!user&&!loading?<p><Link className="underline" to="/login">Sign in to watch live streams.</Link></p>:<>
 {mode==='following'&&following.isError&&<div role="alert"><p>Unable to load followed creators.</p><Button onClick={()=>void following.refetch()}>Retry followed creators</Button></div>}
 {(loading||streams.isLoading||(mode==='following'&&following.isPending))&&<p role="status">Loading live streams…</p>}
 {streams.isError&&<div role="alert"><p>Unable to load live streams. Please try again.</p><Button onClick={()=>void (streams.isFetchNextPageError?streams.fetchNextPage():streams.refetch())}>Retry</Button></div>}
 {!streams.isPending&&!streams.isError&&rows.length===0&&<div className="gaming-card space-y-3 p-6 text-center"><Radio className="mx-auto h-8 w-8 text-purple-300" aria-hidden="true"/><h2 className="text-lg font-semibold">{gameName?'No live streams for '+gameName+' right now':'No live streams right now'}</h2><p>Explore the latest Clipts while you wait.</p><Button asChild variant="outline"><Link to={gameId?'/game/'+gameId:'/clipts'}>Explore Clipts</Link></Button></div>}
 <div className="clipt-channel-grid">{rows.map(stream=><LiveStreamCard key={stream.id} stream={stream} gameName={catalog.data?.find(game=>game.id===stream.game_id)?.name}/>)}</div>
 {streams.hasNextPage&&<Button disabled={streams.isFetching} onClick={()=>void streams.fetchNextPage()}>{streams.isFetchingNextPage?'Loading…':'Load more streams'}</Button>}
 </>}
 </main>;
}
