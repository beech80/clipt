import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {useInfiniteQuery} from '@tanstack/react-query';
import {Gamepad2} from 'lucide-react';
import {useAuth} from '@/contexts/AuthContext';
import {GameCatalogLookup} from '@/components/GameCatalogLookup';
import {GameCatalogCover} from '@/components/GameCatalogCover';
import {gameCatalogPage,gameLabel} from '@/lib/game-catalog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import '@/pages/clipt-channels.css';
export function GameChannels(){
  const {user}=useAuth();const [input,setInput]=useState('');const [term,setTerm]=useState('');
  useEffect(()=>{const timer=setTimeout(()=>setTerm(input.trim()),200);return()=>clearTimeout(timer);},[input]);
  const games=useInfiniteQuery({queryKey:['channel-games',user?.id,term],initialPageParam:0,retry:false,
    queryFn:({pageParam,signal})=>gameCatalogPage(term,pageParam,signal),getNextPageParam:(last,pages)=>last.length===40?pages.length:undefined});
  const rows=games.data?.pages.flat()??[];
  return <section className="space-y-4" aria-labelledby="clipt-channels-title">
    <header className="space-y-2"><h2 id="clipt-channels-title" className="text-xl font-semibold">Clipt Channels</h2><p className="text-sm text-muted-foreground">Choose a game to watch its Clipts, live streams and posts.</p></header>
    <Input type="search" aria-label="Search Clipt Channels" placeholder="Find your game…" maxLength={80} value={input} onChange={event=>setInput(event.target.value)}/>
    {games.isPending?<p role="status">Loading channels…</p>:games.isError?<div role="alert"><p>Channels could not be loaded.</p><Button onClick={()=>void games.refetch()}>Retry channels</Button></div>:rows.length===0?<p>No game channels match this search.</p>:<ul className="clipt-channel-games">{rows.map(game=><li key={game.id}><Link className="clipt-channel-game" to={'/game/'+game.id}><GameCatalogCover src={game.cover_url} name={game.name}/><span>{gameLabel(game)}</span></Link></li>)}</ul>}
    <GameCatalogLookup term={term}/>
    {games.hasNextPage&&<Button disabled={games.isFetchingNextPage} onClick={()=>void games.fetchNextPage()}>Load more channels</Button>}
  </section>;
}
