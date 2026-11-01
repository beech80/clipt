import {useEffect,useRef,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useInfiniteQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {Gamepad2} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {providerCatalogPage,chooseProviderGame,type CatalogGameSelection} from '@/lib/provider-game-catalog';
import {gameLabel} from '@/lib/game-catalog';
import {useAuth} from '@/contexts/AuthContext';
export function GameCatalogLookup({term='',onChoose,disabled=false,searchOnType=false}:{term?:string;disabled?:boolean;searchOnType?:boolean;onChoose?:(game:CatalogGameSelection)=>void}){
 const {user}=useAuth();const navigate=useNavigate(),client=useQueryClient();const [open,setOpen]=useState(false);const [dismissedTerm,setDismissedTerm]=useState<string|null>(null);const expanded=open||(searchOnType&&term.trim().length>=2&&dismissedTerm!==term);const [lookup,setLookup]=useState({parent:term,value:term});const lookupTerm=lookup.parent===term?lookup.value:term;const [queryTerm,setQueryTerm]=useState(term.trim().slice(0,80));
 useEffect(()=>setLookup({parent:term,value:term}),[term]);
 useEffect(()=>{const timer=setTimeout(()=>setQueryTerm(lookupTerm.trim().slice(0,80)),350);return()=>clearTimeout(timer);},[lookupTerm]);const alive=useRef(true);const unavailable=useRef(disabled);unavailable.current=disabled;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const results=useInfiniteQuery({queryKey:['provider-game-catalog',user?.id,queryTerm],enabled:expanded&&Boolean(user)&&queryTerm===lookupTerm.trim().slice(0,80),retry:false,initialPageParam:0,queryFn:({pageParam,signal})=>providerCatalogPage(queryTerm,pageParam,signal),getNextPageParam:(last,pages)=>last.more?pages.length:undefined});
 const choose=useMutation({mutationFn:chooseProviderGame,onSuccess:game=>{
  for(const key of ['channel-games','game-catalog','complete-catalog-search','create-clip-games','stream-game-catalog','live-game-catalog'])void client.invalidateQueries({queryKey:[key]});
  if(!alive.current||unavailable.current)return;setOpen(false);setDismissedTerm(term);if(onChoose)onChoose(game);else navigate('/game/'+game.id);
 }});
 const rows=[...new Map(results.data?.pages.flatMap(page=>page.games).map(game=>[game.id,game])??[]).values()];
 return <section className="space-y-3" aria-label="Full game catalog">
  <Button type="button" variant="outline" onClick={()=>{if(expanded){setOpen(false);setDismissedTerm(term);}else{setOpen(true);setDismissedTerm(null);}}} aria-expanded={expanded} disabled={disabled||choose.isPending}><Gamepad2 aria-hidden="true" className="mr-2 h-4 w-4"/>{expanded?'Hide full catalog':term?'Search full game catalog':'Browse full game catalog'}</Button>
  {expanded&&<>{!user?<p>Sign in to search the full game catalog.</p>:<>
  <label className="block space-y-1"><span>Search full game catalog</span><Input type="search" aria-label="Search full game catalog" className="min-h-11" maxLength={80} value={lookupTerm} onKeyDown={event=>{if(event.key==='Enter'&&!event.nativeEvent.isComposing)event.preventDefault();}} disabled={disabled||choose.isPending} onChange={event=>setLookup({parent:term,value:event.target.value})} placeholder="Find a game by name"/></label>
  <p className="text-sm text-muted-foreground">Search or browse the provider catalog. Select a real game to open its Clipt channel. Availability depends on catalog coverage.</p>
  {results.data?.pages[0].total!==undefined&&<p className="text-sm text-muted-foreground">{results.data.pages[0].total.toLocaleString()} matching game entries</p>}
  {results.isPending&&<p role="status">Loading full catalog…</p>}
  {results.isError&&<div role="alert"><p>Full catalog search is unavailable. Configured Clipt channels remain available.</p><Button type="button" onClick={()=>void results.refetch()}>Retry full catalog</Button></div>}
  {choose.isError&&<p role="alert">{choose.error.message}</p>}
  {!results.isPending&&!results.isError&&rows.length===0&&<p>No provider games match this search.</p>}
  <ul className="space-y-2">{rows.map(game=><li key={game.id}><Button type="button" variant="outline" className="h-auto min-h-11 w-full justify-start whitespace-normal text-left" disabled={disabled||choose.isPending} onClick={()=>choose.mutate(game.id)}><span className="min-w-0"><span className="block">{gameLabel(game)}</span>{game.description&&<span className="block text-sm text-muted-foreground">{game.description}</span>}</span></Button></li>)}</ul>
  {results.hasNextPage&&<Button type="button" disabled={disabled||results.isFetching||choose.isPending} onClick={()=>void results.fetchNextPage()}>Load more provider games</Button>}
  <a href={results.data?.pages[0].source==='wikidata'?'https://www.wikidata.org/wiki/Wikidata:Data_access':'https://www.igdb.com/'} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm underline">Game data from {results.data?.pages[0].source==='wikidata'?'Wikidata':'IGDB'}</a>
  </>}</>}
 </section>;
}
