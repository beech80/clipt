import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Gamepad2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { gameCatalogPage } from '@/lib/game-catalog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { BackButton } from '@/components/ui/back-button';

export default function TopGames() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [term, setTerm] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setTerm(input.trim()), 250);
    return () => clearTimeout(timer);
  }, [input]);
  const games = useInfiniteQuery({
    queryKey: ['game-catalog', user?.id, term], retry: false,
    initialPageParam: 0,
    queryFn: ({ signal, pageParam }) => gameCatalogPage(term, pageParam, signal),
    getNextPageParam: (last, pages) => last.length === 40 ? pages.length : undefined,
  });
  const catalog = games.data?.pages.flat() ?? [];
  return <main className="mx-auto max-w-3xl space-y-5 px-4 py-6 pb-44">
    <BackButton />
    <header className="space-y-2">
      <h1 className="flex items-center gap-2 text-2xl font-bold"><Gamepad2 aria-hidden="true" />Game catalog</h1>
      <p className="text-sm text-muted-foreground">Explore games in Clipt. Listed alphabetically, not by player counts or Trophy ranking.</p>
    </header>
    <Input type="search" aria-label="Search games" placeholder="Search games…" maxLength={80} value={input} onChange={event => setInput(event.target.value)} />
    {input.trim() !== term && <p role="status">Updating search…</p>}
    {games.isPending ? <p role="status">Loading games…</p> : games.isError ? <Card className="space-y-3 p-4">
      <p role="alert">Unable to load games. Please try again.</p>
      <Button onClick={() => void games.refetch()}>Retry games</Button>
    </Card> : !catalog.length ? <Card className="p-4">{term ? 'No games match this search.' : 'No games are available yet.'}</Card> :
      <ul className="grid gap-3 sm:grid-cols-2">{catalog.map(game => <li key={game.id}>
        <Card><Link to={`/game/${game.id}`} className="flex min-w-0 items-center gap-3 rounded-lg p-4 hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
          <Gamepad2 className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0 break-words font-medium">{game.name}</span>
        </Link></Card>
      </li>)}</ul>}
    {games.hasNextPage && <Button disabled={games.isFetchingNextPage} onClick={() => void games.fetchNextPage()}>{games.isFetchingNextPage ? 'Loading games…' : 'Load more games'}</Button>}
    <p className="text-xs text-muted-foreground">Browse every game in the configured Clipt catalog. Search any game name; unavailable games are not fabricated.</p>
  </main>;
}
