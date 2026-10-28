import { useParams } from 'react-router-dom';
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
  return <main className="mx-auto max-w-3xl space-y-5 px-4 py-6 pb-44">
    <BackButton /><h1 className="break-words text-2xl font-bold [overflow-wrap:anywhere]">{tag ? `#${tag}` : 'Hashtag unavailable'}</h1>
    {!tag ? <p role="alert">Choose a hashtag of 1–40 letters, numbers or underscores.</p> : <>
      <p>Published Clipts with this hashtag.</p>
      {query.isPending && <p role="status">Loading Clipts…</p>}
      {query.isError && <div role="alert"><p>Could not load this hashtag.</p><Button onClick={() => void query.refetch()}>Retry hashtag</Button></div>}
      {!query.isPending && !query.isError && posts.length === 0 && <p>No published Clipts with this hashtag yet.</p>}
      {posts.map(post => <DiscoveryPostCard key={post.id} post={post} />)}
      {query.hasNextPage && <Button disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>{query.isFetchingNextPage ? 'Loading…' : 'Load more Clipts'}</Button>}
    </>}
  </main>;
}
