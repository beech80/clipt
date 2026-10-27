import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const periods = [['weekly', 'Weekly'], ['monthly', 'Monthly'], ['all-time', 'All Time']] as const;
type Period = typeof periods[number][0];

export default function TopClipts() {
  const [period, setPeriod] = useState<Period>('weekly');
  const { user } = useAuth();
  const ranking = useQuery({
    queryKey: ['top-clipts', period, user?.id ?? 'guest'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_top_clipts', { ranking_period: period }).retry(false);
      if (error) throw error;
      return data;
    },
    retry: false,
    staleTime: 0,
  });

  return <main className="clipt-leaderboard mx-auto w-full max-w-6xl space-y-5 px-4 py-6">
    <header>
      <h1 className="flex items-center gap-3 text-2xl font-bold"><Trophy aria-hidden="true" className="text-yellow-400" />Top Clipts</h1>
      <p className="mt-2 text-sm text-muted-foreground">Community Trophies decide the ranking. Gifts, tokens and paid boosts do not count.</p>
    </header>
    <div role="group" aria-label="Ranking period" className="clipt-filter-bar flex gap-2">
      {periods.map(([value, label]) => <Button key={value} variant={period === value ? 'default' : 'outline'}
        aria-pressed={period === value} onClick={() => setPeriod(value)}>{label}</Button>)}
    </div>
    <p className="text-xs text-muted-foreground">{period === 'all-time' ? 'All eligible Clipts.' : `Clipts created this UTC calendar ${period === 'weekly' ? 'week (Monday onward)' : 'month'}.`} Most Trophies first; ties use oldest Clipt, then its ID. Top 100.</p>
    {ranking.isPending ? <p role="status">Loading rankings…</p> : ranking.isError ?
      <div role="alert" className="space-y-3 rounded-xl border border-destructive p-4">
        <p>Rankings could not be loaded. No results have been substituted.</p>
        <Button onClick={() => void ranking.refetch()} disabled={ranking.isFetching}>Retry</Button>
      </div> : !ranking.data?.length ?
      <div className="rounded-xl border border-primary/40 p-6 text-center">
        <p>No ranked Clipts in this period yet.</p>
        <Link to="/clipts" className="mt-3 inline-block underline">Discover Clipts and award a Trophy</Link>
      </div> : <ol aria-label="Clipt rankings" className="clipt-rankings">
        {ranking.data.map((clip, index) => <li key={clip.post_id} data-rank={index + 1} className={`rounded-xl border bg-card p-4 ${index < 3 ? 'border-yellow-400/60' : 'border-primary/30'}`}>
          <div className="flex items-center gap-3">
            <span className={`w-8 shrink-0 text-2xl font-bold ${index < 3 ? 'text-yellow-400' : 'text-muted-foreground'}`} aria-label={`Rank ${index + 1}`}>{index + 1}</span>
            <Avatar className="h-10 w-10 shrink-0"><AvatarImage src={clip.avatar_url ?? undefined} alt="" /><AvatarFallback>{(clip.username ?? '?').slice(0, 2)}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1">
              <Link to={`/user/${clip.creator_id}`} className="block truncate text-sm underline">@{clip.username ?? 'creator'}</Link>
              <Link to={`/post/${clip.post_id}`} className="mt-1 block break-words font-semibold hover:underline">{clip.content || 'Watch Clipt'}</Link>
            </div>
            <span className="shrink-0 text-sm text-yellow-300" aria-label={`${clip.trophy_count} Trophies`}>🏆 {clip.trophy_count.toLocaleString()}</span>
          </div>
        </li>)}
      </ol>}
  </main>;
}
