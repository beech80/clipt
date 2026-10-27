import { Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { FileEdit } from 'lucide-react';

export default function Drafts() {
  const { user } = useAuth();
  const drafts = useInfiniteQuery({
    queryKey: ['clipt-drafts', user?.id], enabled: Boolean(user), retry: false, initialPageParam: 0,
    queryFn: async ({ signal, pageParam }) => {
      const { data, error } = await supabase.from('posts').select('id,content,created_at')
        .eq('user_id', user!.id).eq('is_published', false).order('created_at', { ascending: false }).order('id')
        .range(pageParam * 20, pageParam * 20 + 19).abortSignal(signal).retry(false);
      if (error) throw error;
      return data;
    },
    getNextPageParam: (last, pages) => last.length === 20 ? pages.length : undefined,
  });
  const rows = drafts.data?.pages.flat() ?? [];
  return <main className="clipt-drafts mx-auto max-w-3xl space-y-5 p-4">
    <h1 className="flex items-center gap-2 text-2xl font-bold"><FileEdit aria-hidden="true"/>Your drafts</h1>
    <p>Saved privately to your account. Only you can open or publish these clips.</p>
    <Button asChild><Link to="/new-post">Create a new Clipt</Link></Button>
    {drafts.isPending ? <p role="status">Loading drafts…</p> : drafts.isError ? <div role="alert">Drafts could not be loaded. <Button onClick={()=>void drafts.refetch()}>Retry drafts</Button></div> : !rows.length ? <p>No saved drafts yet. Choose Drafts when creating a Clipt to save one.</p> : <ul className="space-y-3">{rows.map(draft => <li key={draft.id} className="gaming-card p-4"><p className="break-words">{draft.content || 'Untitled Clipt'}</p><p className="text-xs text-slate-300">{new Date(draft.created_at).toLocaleString()}</p><Button asChild variant="outline"><Link to={`/new-post?draft=${draft.id}`}>Open draft</Link></Button></li>)}</ul>}
    {drafts.hasNextPage && <Button disabled={drafts.isFetchingNextPage} onClick={()=>void drafts.fetchNextPage()}>{drafts.isFetchingNextPage ? 'Loading…' : 'Load more drafts'}</Button>}
  </main>;
}
