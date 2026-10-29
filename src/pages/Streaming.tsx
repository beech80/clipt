import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { StreamPlayer } from '@/components/streaming/StreamPlayer';
import { StreamAnalytics } from '@/components/streaming/StreamAnalytics';
import { ScheduleStream } from '@/components/streaming/schedule/ScheduleStream';
import { ChatModerationDashboard } from '@/components/streaming/moderation/ChatModerationDashboard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BackButton } from '@/components/ui/back-button';
import { StreamDonation } from '@/components/streaming/StreamDonation';
import { Button } from '@/components/ui/button';
import '@/pages/clipt-channels.css';
import { followService } from '@/services/followService';
import { storageProjectUrl } from '@/integrations/supabase/client';

const developmentLiveBackend = storageProjectUrl === 'https://akiksrlzdqvipqbbjxpw.supabase.co';

export default function Streaming() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [followPending, setFollowPending] = useState(false);
  const [followError, setFollowError] = useState('');
  const [activeTab, setActiveTab] = useState('live');
  const followBusy = useRef(false);
  const { data: stream, isLoading, error, refetch } = useQuery({
    queryKey: ['public-stream', id, user?.id],
    queryFn: async ({signal}) => {
      const { data, error } = await supabase.from('streams')
        .select('id, user_id, title, description, is_live, viewer_count, hls_playback_url, playback_url, game_id')
        .eq('id', id).abortSignal(signal).retry(false).maybeSingle();
      if (error) throw error;
      if (!data || !developmentLiveBackend) return data;
      const verified = await supabase.rpc('get_verified_live_status', {p_stream_id: data.id});
      if (verified.error) throw verified.error;
      const state = verified.data?.[0];
      return {...data, is_live: state?.is_live === true,
        playback_url: state?.playback_url ?? null, hls_playback_url: null, viewer_count: null};
    },
    enabled: !!id && !authLoading && (!developmentLiveBackend || !!user),
    retry:false,
    refetchInterval: 15000,
  });
  const game=useQuery({queryKey:['stream-game',stream?.game_id],enabled:Boolean(stream?.game_id),retry:false,queryFn:async()=>{const {data,error}=await supabase.from('games').select('id,name').eq('id',stream!.game_id!).maybeSingle();if(error)throw error;return data;}});
  const owner = !!user && user.id === stream?.user_id;
  const creator = useQuery({queryKey:['stream-creator',stream?.user_id],enabled:Boolean(stream?.user_id),retry:false,
    queryFn:async()=>{const {data,error}=await supabase.from('profiles').select('username,display_name').eq('id',stream!.user_id).maybeSingle();if(error)throw error;return data;}});
  const following = useQuery({queryKey:['stream-follow',user?.id,stream?.user_id],enabled:Boolean(user && stream && !owner),retry:false,
    queryFn:async()=>{const {data,error}=await supabase.from('follows').select('follower_id').eq('follower_id',user!.id).eq('following_id',stream!.user_id).maybeSingle();if(error)throw error;return Boolean(data);}});
  async function toggleFollow() {
    if (!user || !stream || owner || followBusy.current || following.isPending || following.isError) return;
    followBusy.current=true;setFollowPending(true);setFollowError('');
    try {const result=await followService.toggleFollow(user.id,stream.user_id);if(result.error)throw result.error;await following.refetch();}
    catch {setFollowError('Follow status could not be updated. Please retry.');}
    finally {followBusy.current=false;setFollowPending(false);}
  }
  const { data: schedule, error: scheduleError, isLoading: scheduleLoading, refetch: refetchSchedule } = useQuery({
    queryKey: ['stream-schedule', stream?.user_id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('scheduled_streams')
        .select('id, title, description, scheduled_start, duration_minutes')
        .eq('user_id', stream.user_id).gte('scheduled_start', new Date().toISOString())
        .order('scheduled_start').limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!stream,
  });
  useEffect(() => {
    if (!id) return;
    const channel = supabase.channel(`stream-page:${id}`).on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'streams', filter: `id=eq.${id}` },
      () => { void queryClient.invalidateQueries({ queryKey: ['public-stream', id] }); }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [id, queryClient]);
  return <main data-active-stream={stream ? 'true' : 'false'} className="clipt-stream-viewer container max-w-6xl px-3 py-4 space-y-5">
    <header className="flex items-center gap-3"><BackButton /><h1 className="text-2xl font-bold break-words">{stream?.title || 'Stream'}</h1></header>
    {authLoading ? <p role="status">Checking sign-in…</p> : developmentLiveBackend && !user ? <div role="alert" className="gaming-card p-6 space-y-3"><p>Sign in to view this development live stream.</p><Link className="underline" to="/login">Sign in</Link></div> : isLoading ? <p role="status">Loading stream…</p> : error ? <div role="alert" className="gaming-card p-6 space-y-3"><p>{'code' in error && error.code === '42501' ? 'Stream access requires an active authenticated account. Complete your MFA challenge if enabled, then retry.' : 'Unable to load this stream.'}</p><Button onClick={() => void refetch()}>Retry stream</Button><Link className="underline" to="/login">Check sign-in</Link></div> : !stream ? <p>This stream is unavailable or private.</p> : <>
      <p>{stream.description}</p>
      <Link className="inline-flex min-h-11 items-center underline" data-live-action="creator" to={`/user/${stream.user_id}`}>View creator profile</Link>
      {game.data&&<Link className="inline-flex min-h-11 items-center underline" to={'/game/'+game.data.id+'?tab=live'}>{game.data.name} channel</Link>}
      <p role="status">{stream.is_live ? 'LIVE' : developmentLiveBackend ? 'Not currently verified LIVE' : 'OFFLINE'}</p>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          {owner && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          {owner && <TabsTrigger value="moderation">Moderation</TabsTrigger>}
        </TabsList>
        <TabsContent value="live">
          <StreamPlayer streamId={stream.id} title={stream.title} isLive={!!stream.is_live}
            showHealth={!developmentLiveBackend} offlineMessage={developmentLiveBackend ? 'Waiting for verified live playback' : undefined}
            viewerCount={stream.viewer_count} playbackUrl={stream.hls_playback_url || stream.playback_url} />
          <div className="clipt-live-actions">
            <Button variant="outline" data-live-action="comment" disabled={!stream.is_live} onClick={() => { document.querySelector<HTMLInputElement>('[data-live-chat-input]')?.focus(); document.querySelector('[data-live-chat-input]')?.scrollIntoView({block:'center'}); }}>Live Chat</Button>
            <Button data-live-action="follow" variant="outline" disabled={!user || owner || followPending || following.isPending || following.isError} onClick={() => void toggleFollow()}>{followPending ? 'Updating…' : following.data ? 'Following' : 'Follow'}</Button>
          </div>
          {followError && <p role="alert">{followError}</p>}
          {following.isError && <div role="alert"><p>Follow status unavailable.</p><Button onClick={() => void following.refetch()}>Retry follow status</Button></div>}
          {stream.is_live && !owner ? <div className="mt-4 space-y-2">
            <StreamDonation streamId={stream.id} streamerId={stream.user_id} streamerUsername={creator.data?.display_name||creator.data?.username||'this creator'} />
            <p className="text-sm text-muted-foreground">Gifts use tokens. Cash donations are unavailable until payment verification is configured.</p>
          </div> : null}
        </TabsContent>
        <TabsContent value="schedule" className="space-y-4">
          {owner && <ScheduleStream onSuccess={() => { void queryClient.invalidateQueries({ queryKey: ['stream-schedule'] }); }} />}
          {scheduleLoading ? <p role="status">Loading schedule…</p> : scheduleError ? <div role="alert"><p>Unable to load the schedule.</p><Button onClick={() => void refetchSchedule()}>Retry schedule</Button></div> : schedule?.length ? schedule.map(item =>
            <article key={item.id} className="rounded-lg border border-purple-500/30 p-4">
              <h2 className="font-semibold">{item.title}</h2><p>{new Date(item.scheduled_start).toLocaleString()}</p><p>{item.description}</p>
            </article>) : <p>No upcoming streams.</p>}
        </TabsContent>
        {owner && <TabsContent value="analytics"><StreamAnalytics userId={stream.user_id} streamId={stream.id} /></TabsContent>}
        {owner && <TabsContent value="moderation"><ChatModerationDashboard streamId={stream.id} /></TabsContent>}
      </Tabs>
    </>}
  </main>;
}
