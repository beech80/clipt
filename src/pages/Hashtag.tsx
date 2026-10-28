import { Link, useParams } from 'react-router-dom';
import { Hash, ArrowDownWideNarrow, Play, RefreshCw } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import DiscoveryPostCard from '@/components/post/DiscoveryPostCard';
import { normalizeHashtag } from '@/utils/hashtagUtils';
import { hashtagFeed } from '@/lib/discovery-feeds';

export default function Hashtag() {
  const { tag: rawTag } = useParams();
  const tag = normalizeHashtag(rawTag ?? '');
  const { user } = useAuth();
  const query = useInfiniteQuery({ queryKey: ['hashtag-feed', tag, user?.id], enabled: Boolean(tag), retry: false,
    initialPageParam: 0, queryFn: ({ pageParam, signal }) => hashtagFeed(tag!, pageParam, signal),
    getNextPageParam: (last, pages) => last.more ? pages.length : undefined });
  const posts = [...new Map(query.data?.pages.flatMap(page => page.items).map(post => [post.id, post]) ?? []).values()];
  return <main className="clipt-hashtag-page mx-auto max-w-6xl space-y-6 px-4 py-5 pb-44">
    <div className="flex flex-wrap items-center justify-between gap-3"><BackButton /><Link to="/clipts" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-violet-200 underline"><Play size={16} aria-hidden="true" />Explore Clipts</Link></div>
    <header className="relative overflow-hidden rounded-2xl border border-violet-400/30 bg-gradient-to-br from-purple-950/80 to-slate-950 p-6 sm:p-8">
      <Hash className="pointer-events-none absolute -right-3 -top-4 h-36 w-36 text-purple-400/10" aria-hidden="true" />
      <p className="relative mb-3 text-xs font-semibold uppercase tracking-widest text-violet-300">CLIPT Collection</p>
      <h1 className="relative break-words text-3xl font-bold text-white [overflow-wrap:anywhere] sm:text-4xl">{tag ? `#${tag}` : 'Hashtag unavailable'}</h1>
      <p className="relative mt-3 max-w-xl text-sm leading-relaxed text-slate-300">Clipts sharing this hashtag. Find a moment, meet its creator, and join the conversation.</p>
    </header>
    {!tag ? <p role="alert">Choose a hashtag of 1–40 letters, numbers or underscores.</p> : <>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><p className="text-slate-300">{posts.length} {posts.length === 1 ? 'Clipt' : 'Clipts'} loaded</p><span className="inline-flex items-center gap-2 rounded-full border border-purple-400/25 bg-purple-500/10 px-3 py-2 text-violet-200"><ArrowDownWideNarrow size={16} aria-hidden="true" />Newest first</span></div>
      {query.isPending && <div role="status"><p className="mb-3 text-violet-200">Loading Clipts…</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">{[0,1,2].map(index=><div key={index} className="h-64 animate-pulse rounded-2xl border border-purple-400/20 bg-purple-950/30 motion-reduce:animate-none" />)}</div></div>}
      {query.isError && <div role="alert" className="rounded-2xl border border-purple-400/30 bg-slate-950/70 p-6"><p>Could not load this hashtag.</p><Button className="mt-3" onClick={() => void query.refetch()}><RefreshCw size={16} className="mr-2" aria-hidden="true" />Retry hashtag</Button></div>}
      {!query.isPending && !query.isError && posts.length === 0 && <section className="rounded-2xl border border-dashed border-purple-400/30 bg-slate-950/50 p-8 text-center"><Hash className="mx-auto mb-4 text-violet-400" size={32} aria-hidden="true" /><h2 className="text-lg font-semibold text-white">No published Clipts with this hashtag yet.</h2><p className="mt-2 text-sm text-slate-400">Try another hashtag or explore the feed.</p></section>}
      <section aria-label="Hashtag Clipts" className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">{posts.map(post => <DiscoveryPostCard key={post.id} post={post} />)}</section>
      {query.hasNextPage && <div className="flex justify-center pt-2"><Button disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>{query.isFetchingNextPage ? 'Loading…' : 'Load more Clipts'}</Button></div>}
    </>}
  </main>;
}
