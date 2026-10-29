import {useParams,Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {useAuth} from '@/contexts/AuthContext';
import {supabase} from '@/lib/supabase';
import {validChannelGame} from '@/lib/channel-feeds';
import {Button} from '@/components/ui/button';
import {BackButton} from '@/components/ui/back-button';
import BoostedDiscovery from '@/components/BoostedDiscovery';
import {GameChannelBrowser} from '@/components/GameChannelBrowser';
export default function Game(){
 const {id}=useParams();const {user}=useAuth();const valid=Boolean(id&&validChannelGame(id));
 const game=useQuery({queryKey:['game-discovery',id,user?.id],enabled:valid,retry:false,queryFn:async({signal})=>{const {data,error}=await supabase.from('games').select('id,name,cover_url').eq('id',id!).abortSignal(signal).retry(false).maybeSingle();if(error)throw error;return data;}});
 return <main className="container max-w-6xl space-y-6 px-4 py-6"><BackButton/><header className="space-y-2"><Link className="inline-flex min-h-11 items-center underline" to="/discovery">Clipt Channels</Link><h1 className="text-2xl font-bold">{game.data?.name||'Game channel'}</h1><p className="text-muted-foreground">Clipts, live streams and posts from this game only.</p></header>
 {!valid?<p role="alert">Choose a game from the Clipt catalog.</p>:game.isPending?<p role="status">Loading game…</p>:game.isError?<div role="alert"><p>Unable to load this game.</p><Button onClick={()=>void game.refetch()}>Retry game</Button></div>:!game.data?<p>Game not found.</p>:<><Link className="inline-flex min-h-11 items-center underline" to={'/game-streamers/'+id}>Find creators for this game</Link><BoostedDiscovery gameId={id}/><GameChannelBrowser key={id} gameId={id} gameName={game.data.name}/></>}
 </main>;
}
