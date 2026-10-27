import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Radio } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { storageProjectUrl } from '@/integrations/supabase/client';

const developmentLiveBackend = storageProjectUrl === 'https://akiksrlzdqvipqbbjxpw.supabase.co';

const PAGE_SIZE = 24;

export default function LiveDiscovery() {
  const { user } = useAuth();
  const [mode, setMode] = useState<'all' | 'following'>('all');
  const following = useQuery({
    queryKey: ['live-following', user?.id], enabled: Boolean(user) && mode === 'following', retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.from('follows').select('following_id').eq('follower_id', user!.id).order('following_id').limit(1000);
      if (error) throw error;
      return data.map(row => row.following_id);
    },
  });
  const streams = useInfiniteQuery({
    queryKey: ['live-discovery', user?.id, mode, following.data],
    enabled: mode === 'all' || Boolean(user && following.isSuccess),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) => {
      if (mode === 'following' && !following.data?.length) return [];
      // Explicit public fields: never fetch stream keys or ingest credentials.
      let query = supabase.from('streams')
        .select('id, user_id, title, description, thumbnail_url, viewer_count')
        .eq('is_live', true).order('id', { ascending: true }).limit(PAGE_SIZE);
      if (pageParam) query = query.gt('id', pageParam);
      if (mode === 'following') query = query.in('user_id', following.data!);
      const { data, error } = await query.abortSignal(signal);
      if (error) throw error;
      if (developmentLiveBackend) {
        const verified = await Promise.all(data.map(async row => {
          const result = await supabase.rpc('get_verified_live_status',{p_stream_id:row.id});
          if(result.error)throw result.error;
          return result.data?.[0]?.is_live ? {...row,viewer_count:null} : null;
        }));
        // Cursor must follow the unfiltered page, including stale entries.
        return data.map((row,index)=>({...row,verified:verified[index] !== null,viewer_count:null}));
      }
      return data.map(row=>({...row,verified:true}));
    },
    getNextPageParam: page => page.length === PAGE_SIZE ? page[page.length - 1].id : undefined,
    staleTime: 15000,
    refetchInterval: 15000,
  });
  const rows = [...new Map((streams.data?.pages.flat() ?? []).filter(row=>row.verified).map(row => [row.id, row])).values()];

  return <main className="clipt-live-discovery container max-w-6xl px-4 py-6 space-y-6">
    <header className="flex items-center justify-between gap-3">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Radio aria-hidden="true" /> Live Streams</h1>
      <Button variant="outline" disabled={streams.isFetching || (mode === 'following' && !following.isSuccess)} onClick={() => { if (mode === 'following') void following.refetch(); void streams.refetch(); }}>Refresh</Button>
    </header>
    <p className="text-muted-foreground">Watch creators who are live now.</p>
    <div role="group" aria-label="Live discovery filter" className="clipt-filter-bar flex flex-wrap gap-2">
      <Button variant="outline" aria-pressed={mode === 'all'} onClick={() => setMode('all')}>Live Now</Button>
      <Button variant="outline" aria-pressed={mode === 'following'} disabled={!user} onClick={() => setMode('following')}>Following</Button>
    </div>
    {mode === 'following' && following.isError && <div role="alert"><p>Unable to load followed creators.</p><Button onClick={() => void following.refetch()}>Retry followed creators</Button></div>}
    {mode === 'following' && following.isPending && <p role="status">Loading followed creators…</p>}
    {mode === 'following' && following.isSuccess && <p className="text-xs text-muted-foreground">Live streams from your first 1,000 followed creators.</p>}
    {streams.isLoading && <p role="status">Loading live streams…</p>}
    {streams.isError && <div role="alert" className="space-y-3">
      <p>Unable to load live streams. Please try again.</p>
      <Button onClick={() => void (streams.isFetchNextPageError ? streams.fetchNextPage() : streams.refetch())}>Retry</Button>
    </div>}
    {!streams.isPending && !streams.isError && rows.length === 0 && <Card className="p-8 text-center">
      <Radio className="mx-auto mb-3 h-8 w-8 text-purple-400" aria-hidden="true" />
      <h2 className="text-lg font-semibold">No live streams right now</h2>
      <p className="mt-2 text-muted-foreground">Check back later or explore the latest Clipts.</p>
      <Button asChild className="mt-4"><Link to="/clipts">Explore Clipts</Link></Button>
    </Card>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((stream, index) => <Card key={stream.id} className={`gaming-card overflow-hidden ${index === 0 ? 'lg:col-span-2' : ''}`}>
        <Link to={`/streaming/${stream.id}`} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400">
          <div className="aspect-video relative bg-purple-950/40 flex items-center justify-center">
            <Radio className="h-10 w-10 text-purple-400" aria-hidden="true" />
            {stream.thumbnail_url && <img src={stream.thumbnail_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" onError={event => { event.currentTarget.style.display = 'none'; }} />}
            <span className="absolute top-2 left-2 rounded bg-red-600 px-2 py-1 text-xs font-bold">LIVE</span>
          </div>
          <div className="p-4 space-y-2">
            <h2 className="font-semibold break-words">{stream.title || 'Untitled stream'}</h2>
            {stream.description && <p className="line-clamp-2 text-sm text-muted-foreground">{stream.description}</p>}
            <p className="text-sm text-muted-foreground">{stream.viewer_count == null ? 'Viewer count unavailable' : `${stream.viewer_count.toLocaleString()} watching`}</p>
          </div>
        </Link>
      </Card>)}
    </div>
    {streams.hasNextPage && <Button disabled={streams.isFetching} onClick={() => void streams.fetchNextPage()}>
      {streams.isFetchingNextPage ? 'Loading…' : 'Load more streams'}
    </Button>}
  </main>;
}
