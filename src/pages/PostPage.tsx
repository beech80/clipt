import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BackButton } from '@/components/ui/back-button';
import PostItem from '@/components/PostItem';
import { ReportButton } from '@/components/ReportButton';

export default function PostPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const boostAttribution = searchParams.get('boost');
  useEffect(() => {
    if (!boostAttribution || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(boostAttribution)) return;
    void supabase.rpc('record_content_boost_event', {p_boost_id:boostAttribution,p_event_type:'post_view'});
  }, [boostAttribution]);
  const { data: post, isLoading, error, refetch } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('posts')
        .select('id, content, image_url, video_url, user_id, created_at, is_published, is_premium, is_subscriber_only, post_type, profiles(username, avatar_url, display_name), games(id, name)')
        .eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
  return <main className="clipt-watch-page min-h-screen">
    <header className="clipt-watch-topbar p-4 bg-black/40 border-b border-white/10 flex items-center gap-4">
      <BackButton /><h1 className="text-3xl font-bold text-white">Post</h1>
    </header>
    <div className="clipt-watch-content mx-auto px-4 py-6 pb-40">
      {isLoading ? <p role="status">Loading post…</p> : error ? (
        <div role="alert"><p>Could not load this post.</p><button onClick={() => void refetch()}>Try again</button></div>
      ) : !post ? <p>This post is unavailable or you do not have access.</p> : (
        <><PostItem post={post} watchPage /><ReportButton contentId={post.id} contentType="post" /><Link className="block mt-4 underline" to={'/comments/' + post.id}>View all comments</Link></>
      )}
    </div>
  </main>;
}
