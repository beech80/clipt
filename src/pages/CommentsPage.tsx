import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CommentList } from '@/components/post/CommentList';

export const CommentsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const validId = z.string().uuid().safeParse(id).success;
  const post = useQuery({
    queryKey: ['comment-page-post', id, user?.id], enabled: validId, retry: false,
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase.from('posts')
        .select('id,content,user_id,profiles(username)').eq('id', id!)
        .abortSignal(signal).retry(false).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  return <main className="mx-auto max-w-3xl space-y-5 px-4 py-6 pb-44">
    <Button asChild variant="outline"><Link to="/clipts">Back to Clipts</Link></Button>
    <h1 className="text-2xl font-bold">Comments</h1>
    {!validId ? <p role="alert">This Clipt link is invalid.</p> : post.isPending ? <p role="status">Loading Clipt…</p> : post.isError ?
      <Card className="space-y-3 p-4"><p role="alert">Unable to load this Clipt.</p><Button onClick={() => void post.refetch()}>Retry Clipt</Button></Card> :
      !post.data ? <p>This Clipt is unavailable or you do not have access.</p> : <>
        <Card className="space-y-3 p-4">
          <Link to={`/user/${post.data.user_id}`} className="font-semibold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">{post.data.profiles?.username || 'Creator'}</Link>
          <p className="whitespace-pre-wrap break-words">{post.data.content}</p>
          <Button asChild variant="outline"><Link to={`/post/${post.data.id}`}>View Clipt</Link></Button>
        </Card>
        <CommentList postId={post.data.id} />
      </>}
  </main>;
};
export default CommentsPage;
