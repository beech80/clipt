import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {gameChannel} from '@/lib/game-catalog';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function GameStreamers() {
  const { id } = useParams();
  const { user } = useAuth();
  const validId = z.string().uuid().safeParse(id).success;
  const game = useQuery({
    queryKey: ['game-creators-game', id, user?.id], enabled: validId, retry: false,
    queryFn: async ({ signal }) => {
      return gameChannel(id!,signal);
    },
  });
  const creators = useQuery({
    queryKey: ['game-creators', id, user?.id], enabled: validId && Boolean(game.data), retry: false,
    queryFn: async ({ signal }) => {
      // Published Clipts establish relevance, not a claim that these creators are live.
      // Existing RLS still filters blocked, hidden and inaccessible content.
      const result = await supabase.from('profiles')
        .select('id,username,display_name,avatar_url,posts!inner(game_id)')
        .in('posts.game_id', game.data!.member_ids??[game.data!.id]).eq('posts.is_published', true)
        .eq('posts.moderation_hidden', false).not('posts.video_url', 'is', null)
        .order('username').order('id').limit(20).retry(false).abortSignal(signal);
      if (result.error) throw result.error;
      return result.data;
    },
  });
  return <main className="container max-w-3xl px-4 py-6 pb-44 space-y-5">
    <Link to="/top-games" className="underline">Game catalog</Link>
    <h1 className="text-2xl font-bold">Game creators</h1>
    {!validId ? <p role="alert">This game is not available in the Clipt catalog.</p> : <>
      {game.isPending && <p role="status">Loading game…</p>}
      {game.isError && <div role="alert"><p>Unable to load this game.</p><Button onClick={() => void game.refetch()}>Retry game</Button></div>}
      {!game.isPending && !game.isError && !game.data && <p>Game not found.</p>}
      {game.data && <>
        <h2 className="text-xl font-semibold break-words">{game.data.name}</h2>
        <p className="text-muted-foreground">Up to 20 creators with visible published videos for this game, alphabetically. This is not a live-status or popularity ranking.</p>
        <Link className="underline" to={'/game/' + game.data.id}>Browse game Clipts</Link>
        {creators.isPending && <p role="status">Loading creators…</p>}
        {creators.isError && <div role="alert"><p>Unable to load creators.</p><Button onClick={() => void creators.refetch()}>Retry creators</Button></div>}
        {!creators.isPending && !creators.isError && creators.data?.length === 0 && <p>No creators with visible Clipts for this game yet.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {creators.data?.map(creator => <Card key={creator.id} className="p-4">
            <Link to={'/user/' + creator.id} className="flex items-center gap-3 rounded focus-visible:outline focus-visible:outline-violet-300">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={creator.avatar_url || undefined} alt="" />
                <AvatarFallback>{(creator.display_name || creator.username || 'C').slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 break-words">{creator.display_name || creator.username || 'Clipt creator'}</span>
            </Link>
          </Card>)}
        </div>
      </>}
    </>}
  </main>;
}
