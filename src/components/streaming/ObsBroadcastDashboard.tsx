import {useEffect,useRef,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {useAuth} from '@/contexts/AuthContext';
import {Button} from '@/components/ui/button';
import {GameCatalogLookup} from '@/components/GameCatalogLookup';
import {completeGameCatalog,gameLabel} from '@/lib/game-catalog';
import {validChannelGame} from '@/lib/channel-feeds';
import {useSearchParams} from 'react-router-dom';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {StreamPlayer} from './StreamPlayer';
import {createStream,getUserStream,updateStream} from '@/services/streamService';
import {obsReadiness,currentObsSession,createObsSession,endObsSession,obsCredentials,type ObsSession} from '@/services/obsBroadcastService';

export function ObsBroadcastDashboard(){
 const {user}=useAuth(),client=useQueryClient();
 const [params]=useSearchParams();
 const [gameId,setGameId]=useState(()=>{const id=params.get('game');return id&&validChannelGame(id)?id:'';});
 const games=useQuery({queryKey:['obs-games',user?.id],enabled:Boolean(user),retry:false,queryFn:({signal})=>completeGameCatalog('',signal)});
 const [title,setTitle]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [credentials,setCredentials]=useState<Awaited<ReturnType<typeof obsCredentials>>|null>(null),[revealed,setRevealed]=useState(false);
 const [notice,setNotice]=useState('');
 const pending=useRef<{requestId:string;streamId:string}|null>(null),running=useRef(false);
 const mounted=useRef(true),currentUser=useRef(user?.id);currentUser.current=user?.id;
 const readiness=useQuery({queryKey:['obs-readiness'],queryFn:obsReadiness,retry:false,refetchInterval:60000});
 const current=useQuery({queryKey:['obs-current',user?.id],enabled:Boolean(user),queryFn:currentObsSession,
  retry:false,gcTime:0,refetchInterval:15000,refetchIntervalInBackground:false});
 const stream=useQuery({queryKey:['obs-metadata',user?.id],enabled:Boolean(user),retry:false,
  queryFn:async()=>{const r=await getUserStream();if(r.error)throw r.error;return r.data;}});
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 useEffect(()=>{setCredentials(null);setRevealed(false);pending.current=null;setError('');},[user?.id]);
 useEffect(()=>{
  if(!credentials)return;
  const clear=()=>{if(document.hidden){setCredentials(null);setRevealed(false);}};
  const timer=setTimeout(()=>{setCredentials(null);setRevealed(false);},Math.max(0,Math.min(60000,Date.parse(credentials.expiresAt)-Date.now())));
  document.addEventListener('visibilitychange',clear);
  return()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',clear);};
 },[credentials]);
 useEffect(()=>{if(stream.data)setGameId(stream.data.game_id||'');},[stream.data?.id,stream.data?.game_id]);
 const active=current.data,available=readiness.data?.enabled&&readiness.data.configured&&readiness.data.operationsReady;
 async function action(work:()=>Promise<void>){
  if(running.current)return;running.current=true;setBusy(true);setError('');setNotice('');
  try{await work();}catch(e){if(mounted.current)setError(e instanceof Error?e.message:'Broadcast request failed.');}
  finally{running.current=false;if(mounted.current)setBusy(false);}
 }
 function save(s:ObsSession|null){if(currentUser.current!==user?.id||!mounted.current)return;client.setQueryData(['obs-current',user?.id],s);}
 async function prepare(){
  await action(async()=>{
   if(!user||!available)throw Error('OBS broadcasting is not ready.');
   if(!pending.current){
    let metadata=stream.data;
    if(!metadata){if(!title.trim())throw Error('Add a stream title.');
     const r=await createStream({title:title.trim().slice(0,120),description:'',thumbnail_url:null,game_id:gameId||null});
     if(r.error||!r.data)throw r.error||Error('Stream details could not be saved');metadata=r.data;
     client.setQueryData(['obs-metadata',user.id],metadata);
    }
    if(metadata.game_id!==(gameId||null)){
     const r=await updateStream(metadata.id,{game_id:gameId||null});if(r.error||!r.data)throw r.error||Error('Game channel was not saved.');
     metadata=r.data;client.setQueryData(['obs-metadata',user.id],metadata);
    }
    pending.current={streamId:metadata.id,requestId:crypto.randomUUID()};
   }
   const saved=await createObsSession(pending.current.streamId,pending.current.requestId);save(saved);await stream.refetch();
  });
 }
 async function copy(value:string){await action(async()=>{await navigator.clipboard.writeText(value);setNotice('Copied. Keep this credential private.');});}
 if(!user)return <section className="gaming-card p-6"><p>Sign in with your invited account to broadcast.</p><Link className="underline" to="/login">Sign in</Link></section>;
 return <section className="gaming-card p-4 sm:p-6 space-y-4 min-w-0" aria-label="Broadcast instructions">
  <h2 id="obs-title" className="text-xl font-semibold">Computer live — OBS</h2>
  <p>Use OBS on your computer. Phone camera and screen broadcasting remain unavailable in this web beta.</p>
  <p className="text-sm text-muted-foreground">One beta broadcast at a time. Up to 30 minutes per session, two starts per account per day, and 300 reserved minutes per month across the beta. Each prepared session reserves its full allowance. Up to five invited viewer sessions.</p>
  <p>OBS: choose Custom service, H.264 video and AAC audio. Start with 640 × 360, 15 FPS and 600–900 Kbps on a slower computer; use 720p/30 FPS when supported. Avoid 4K output.</p>
  {readiness.isError&&<p role="alert">OBS availability could not be checked.</p>}
  {!available&&<p role="status">Computer broadcasting is being prepared. New sessions stay disabled until provider setup and independent cleanup are verified.</p>}
  {!stream.data&&!active&&<div className="space-y-2"><Label htmlFor="obs-stream-title">Stream title</Label><Input id="obs-stream-title" value={title} onChange={e=>setTitle(e.target.value)} maxLength={120}/></div>}
  {stream.data&&<p>Stream: {stream.data.title}</p>}
  {!active&&<div className="space-y-2"><Label htmlFor="obs-game">Game channel</Label><select id="obs-game" className="clipt-live-game-filter block w-full" value={gameId} disabled={busy} onChange={e=>setGameId(e.target.value)}>
   <option value="">No game selected</option>{games.data?.map(game=><option key={game.id} value={game.id}>{gameLabel(game)}</option>)}</select>
   <GameCatalogLookup onChoose={game=>setGameId(game.id)}/>
   {games.isError&&<p role="alert">Configured games could not be loaded. <button type="button" className="underline min-h-11" onClick={()=>void games.refetch()}>Retry games</button></p>}
  </div>}
  {active&&<div className="space-y-2"><p role="status">Status: {active.isLive?'LIVE':active.state}. Session ends by {new Date(active.expiresAt).toLocaleTimeString()}.</p>
   <p>Closing this page does not stop OBS. Use End broadcast and stop OBS when finished.</p>
   {active.streamId&&<Link className="inline-flex min-h-11 items-center underline" to={'/streaming/'+active.streamId}>Open viewer and live chat</Link>}
  </div>}
  <div className="flex flex-wrap gap-3">
   {!active&&<Button disabled={busy||!available||current.isPending||current.isError||stream.isPending||stream.isError} onClick={()=>void prepare()}>Prepare OBS broadcast</Button>}
   <Button variant="outline" disabled={busy} onClick={()=>void action(async()=>{await Promise.all([current.refetch(),readiness.refetch()]);})}>Check status</Button>
   {active&&active.state!=='ended'&&<Button variant="outline" disabled={busy} onClick={()=>void action(async()=>{save(await endObsSession(active.sessionId));setCredentials(null);setRevealed(false);pending.current=null;await current.refetch();})}>End broadcast</Button>}
   {active&&['ready','active'].includes(active.state)&&<Button disabled={busy} onClick={()=>void action(async()=>{const value=await obsCredentials(active.sessionId);if(currentUser.current===user?.id&&mounted.current){setCredentials(value);setRevealed(false);}})}>Get OBS credentials</Button>}
  </div>
  {credentials&&<div className="space-y-3 rounded-lg border border-purple-500/50 p-4 min-w-0">
   <p>Copy these into OBS → Settings → Stream → Custom. The key is private and expires with this session.</p>
   <Label htmlFor="obs-server">Server</Label><Input id="obs-server" readOnly value={credentials.ingestUrl}/>
   <Button variant="outline" disabled={busy} onClick={()=>void copy(credentials.ingestUrl)}>Copy server</Button>
   <Label htmlFor="obs-key">Stream key</Label><Input id="obs-key" type={revealed?'text':'password'} autoComplete="off" readOnly value={credentials.streamKey}/>
   <div className="flex flex-wrap gap-3"><Button variant="outline" aria-pressed={revealed} onClick={()=>setRevealed(v=>!v)}>{revealed?'Hide':'Show'} key</Button><Button variant="outline" disabled={busy} onClick={()=>void copy(credentials.streamKey)}>Copy stream key</Button><Button variant="outline" onClick={()=>setCredentials(null)}>Clear credentials</Button></div>
  </div>}
  {active?.isLive&&<StreamPlayer streamId={active.streamId} title={stream.data?.title||'Your broadcast'} isLive playbackUrl={'clipt-obs:'+active.streamId} showHealth={false}/>}
  {error&&<p role="alert">{error}</p>}{current.isError&&<p role="alert">Current session could not be checked. Use Check status before preparing another broadcast.</p>}
  {notice&&<p role="status">{notice}</p>}
 </section>;
}
