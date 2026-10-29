import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { createStream, getUserStream, startStream, endStream, getMuxTestLiveStatus, updateStream } from '@/services/streamService';
import { useEffect, useState } from 'react';
import {GameCatalogLookup} from '@/components/GameCatalogLookup';
import {useSearchParams} from 'react-router-dom';
import {completeGameCatalog} from '@/lib/game-catalog';
import {validChannelGame} from '@/lib/channel-feeds';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StreamKeyManager } from './broadcast/StreamKeyManager';
import { StreamerDashboardChat } from './chat/StreamerDashboardChat';
import { StreamPlayer } from './StreamPlayer';

export function StreamDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [params]=useSearchParams();
  const [gameId,setGameId]=useState(()=>{const id=params.get('game');return id&&validChannelGame(id)?id:'';});
  const games=useQuery({queryKey:['stream-game-catalog',user?.id],enabled:Boolean(user),retry:false,queryFn:({signal})=>completeGameCatalog('',signal)});
  const [pilotFresh, setPilotFresh] = useState(false);
  const [pilotMonitorUntil, setPilotMonitorUntil] = useState(0);
  const [pilotPlayback, setPilotPlayback] = useState<{ id: string; url: string } | null>(null);
  useEffect(() => { setPilotPlayback(null); setPilotFresh(false); }, [user?.id]);
  const pilot = useMutation({
    // Keep the still-valid previous observation during refresh; its existing
    // expiry timer or an error will disable chat. Do not interrupt typing.
    onSuccess: data => {
      setPilotPlayback({ id: data.id, url: data.playback_url });
      setPilotFresh(true);
    },
    onError: () => { setPilotFresh(false); setPilotMonitorUntil(0); },
    mutationFn: async (streamId: string) => {
      const result=await getMuxTestLiveStatus(streamId);
      if(result.error||!result.data)throw result.error||new Error('Provider state unavailable');
      return result.data;
    },
  });
  useEffect(()=>{
    if(!pilotFresh)return;
    const timer=setTimeout(()=>setPilotFresh(false),30000);
    return ()=>clearTimeout(timer);
  },[pilotFresh,pilot.data]);
  const { mutate: checkPilot, isPending: pilotPending } = pilot;
  useEffect(()=>{
    if (!import.meta.env.DEV || !pilotPlayback?.id || !pilotMonitorUntil || pilotPending) return;
    const id=pilotPlayback.id;
    const timer=setInterval(()=>{
      if (Date.now() >= pilotMonitorUntil) { setPilotMonitorUntil(0); return; }
      if(!document.hidden)checkPilot(id);
    },20000);
    return ()=>clearInterval(timer);
  },[pilotPlayback?.id,pilotMonitorUntil,pilotPending,checkPilot]);
  const queryKey = ['own-stream', user?.id];
  const { data: stream, isLoading, error, refetch } = useQuery({
    queryKey,
    enabled: Boolean(user),
    queryFn: async () => {
      const result = await getUserStream();
      if (result.error) throw result.error;
      return result.data;
    },
    refetchInterval: 15000,
  });
  const requestedGame=params.get('game');
  useEffect(()=>{if(stream)setGameId(stream.game_id||'');},[stream?.id,stream?.game_id,requestedGame]);
  const saveGame=useMutation({mutationFn:async()=>{if(!stream)throw new Error('Create your stream first.');const result=await updateStream(stream.id,{game_id:gameId||null});if(result.error||!result.data)throw result.error||new Error('Game was not saved.');return result.data;},onSuccess:data=>{queryClient.setQueryData(queryKey,data);void queryClient.invalidateQueries({queryKey:['live-discovery']});void queryClient.invalidateQueries({queryKey:['channel-live']});toast.success('Stream game saved');}});
  const gamePicker=<div className="space-y-2"><Label htmlFor="stream-game">Game channel</Label><select id="stream-game" aria-label="Stream game channel" className="clipt-live-game-filter block w-full" value={gameId} disabled={games.isPending||saveGame.isPending} onChange={event=>setGameId(event.target.value)}><option value="">No game selected</option>{games.data?.map(game=><option key={game.id} value={game.id}>{game.name}</option>)}</select><GameCatalogLookup onChoose={game=>setGameId(game.id)}/>{games.isError&&<p role="alert">Games could not be loaded. <button type="button" className="underline" onClick={()=>void games.refetch()}>Retry games</button></p>}</div>;
  const lifecycle = useMutation({
    mutationFn: async (action: 'start' | 'end') => {
      if (!user || !stream) throw new Error('Sign in to manage your stream');
      const result = await (action === 'start' ? startStream(stream.id) : endStream(stream.id));
      if (result.error) throw result.error;
      return { stream: result.data, action };
    },
    onSuccess: ({ stream: updated, action }) => {
      queryClient.setQueryData(queryKey, updated);
      queryClient.invalidateQueries({ queryKey: ['stream-key'] });
      toast.success(action === 'end' ? 'Stream ended' : 'Ingest initialized. Start broadcasting in your encoder.');
    },
    onError: (failure) => toast.error(failure.message),
  });
  const create = useMutation({
    mutationFn: async () => {
      const cleanTitle = title.trim();
      if (!cleanTitle || cleanTitle.length > 120) throw new Error('Enter a stream title up to 120 characters');
      const result = await createStream({title:cleanTitle,description:null,thumbnail_url:null,game_id:gameId||null});
      if (result.error || !result.data) throw result.error || new Error('Stream creation was not confirmed');
      return result.data;
    },
    onSuccess: data => { queryClient.setQueryData(queryKey,data); toast.success('Offline stream draft created'); },
    onError: failure => toast.error(failure.message),
  });

  if (!user) return <p role="status">Sign in to manage your stream.</p>;
  if (isLoading) return <p role="status">Loading stream settings…</p>;
  if (error) return (
    <Card className="p-6 space-y-4">
      <p role="alert">{error?.message || 'Stream settings are unavailable.'}</p>
      <Button onClick={() => refetch()}>Retry</Button>
    </Card>
  );
  if (!stream) return <Card className="p-6 space-y-4">
    <h2 className="text-lg font-semibold">Create your stream draft</h2>
    <p>This saves an offline draft. Broadcasting requires a configured ingest provider; creating a draft does not start a live stream.</p>
    <form className="space-y-3" onSubmit={event => {event.preventDefault();create.mutate();}}>
      <Label htmlFor="stream-title">Stream title</Label>
      <Input id="stream-title" value={title} onChange={event=>setTitle(event.target.value)} maxLength={120} required />
      {gamePicker}
      <Button disabled={create.isPending || !title.trim()}>{create.isPending ? 'Saving…' : 'Create stream draft'}</Button>
    </form>
  </Card>;

  return (
    <Card className="w-full">
      <CardHeader><CardTitle>Stream Dashboard</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <h2 className="font-semibold">{stream.title}</h2>
        {gamePicker}<Button variant="outline" disabled={saveGame.isPending||gameId===(stream.game_id||'')} onClick={()=>saveGame.mutate()}>{saveGame.isPending?'Saving…':'Save game channel'}</Button>
        {saveGame.isError&&<p role="alert">{saveGame.error.message}</p>}
        {import.meta.env.DEV && <section className="gaming-card p-4 space-y-3" aria-label="Development Mux live pilot">
          <h2 className="text-xl font-semibold">In-app broadcast playback</h2>
          <p>Development test stream only. Synchronization requires the secure server pilot configuration. After a successful check, status refreshes while this page is visible for up to five minutes, including while waiting for OBS. Stop OBS to end the broadcast.</p>
          <p className="text-sm">Clipt stream ID: {stream.id}</p>
          <Button disabled={pilot.isPending} onClick={()=>{setPilotMonitorUntil(Date.now()+300000);checkPilot(stream.id);}}>{pilot.isPending?'Checking provider…':'Check Mux test status / playback'}</Button>
          {pilot.isError&&<p role="alert">{pilot.error.message}</p>}
          {pilot.data?.id===stream.id&&pilot.data.provider_stream_id&&/^[A-Za-z0-9]+$/.test(pilot.data.provider_stream_id)&&<p className="text-sm break-all">Mux stream checked: {pilot.data.provider_stream_id}. Compare this with the stream ID in your Active Mux monitor. Different IDs mean OBS and Clipt are using different streams.</p>}
          {pilotPlayback?.id===stream.id&&<><p role="status">{pilotFresh&&pilot.data?.id===stream.id?`Last verified provider status: ${pilot.data.provider_status}.`:'Provider status is unverified or expired.'} Refresh after connecting or disconnecting OBS. Status checks expire after 30 seconds; playback stays open. An idle live stream is not a replay.</p>
            <StreamPlayer streamId={stream.id} title={stream.title||'Development stream'} isLive={pilotFresh&&pilot.data?.id===stream.id&&pilot.data.is_live} playbackUrl={pilotPlayback.url} compact showHealth={false}/></>}
        </section>}
        {!(import.meta.env.DEV && pilotPlayback?.id===stream.id) && <>
        <p role="status">{stream.is_live ? 'Live' : 'Offline'} · {stream.viewer_count == null ? 'Viewer count unavailable' : `${stream.viewer_count} viewers`}</p>
        <StreamKeyManager key={`${user.id}:${stream.id}`} streamId={stream.id} />
        <p className="text-sm text-muted-foreground">
          Use the configured ingest URL and key in OBS Studio. Initializing ingest does not mean video is live;
          live status must be confirmed by the streaming backend. Never share your stream key.
        </p>
        <Button disabled={lifecycle.isPending} onClick={() => lifecycle.mutate(stream.is_live ? 'end' : 'start')}>
          {lifecycle.isPending ? 'Updating…' : stream.is_live ? 'End Stream' : 'Initialize Stream'}
        </Button>
        {stream.is_live ? <StreamerDashboardChat streamId={stream.id} isLive /> : null}
        </>}
      </CardContent>
    </Card>
  );
}
