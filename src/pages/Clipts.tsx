
import React from 'react';
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import GameBoyControls from "@/components/GameBoyControls";
import PostItem from "@/components/PostItem";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Post } from '@/types/post';

// Flattened database response type
type DatabasePost = {
  id: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  user_id: string;
  created_at: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
  games: {
    name: string | null;
  } | null;
}

const Clipts = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          video_url,
          user_id,
          created_at,
          profiles!posts_user_id_fkey (
            username,
            avatar_url
          ),
          games!posts_game_id_fkey (name)
        `)
        .eq('type', 'video')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!postsData) return [];

      const postIds = postsData.map(p => p.id);
      
      const [commentCountsResult, voteCountsResult] = await Promise.all([
        supabase
          .from('comments')
          .select('post_id')
          .in('post_id', postIds),
        supabase
          .from('clip_votes')
          .select('post_id')
          .in('post_id', postIds)
      ]);

      // Convert raw database posts to typed DatabasePost array
      const dbPosts = postsData as DatabasePost[];

      // Transform DatabasePost to Post type with explicit typing
      return dbPosts.map(post => {
        const transformed: Post = {
          id: post.id,
          content: post.content,
          image_url: post.image_url,
          video_url: post.video_url,
          user_id: post.user_id,
          created_at: post.created_at,
          profiles: post.profiles,
          likes_count: 0,
          comments_count: (commentCountsResult.data || []).filter(c => c.post_id === post.id).length,
          clip_votes: (voteCountsResult.data || []).filter(v => v.post_id === post.id).length > 0 ? [{ count: 1 }] : []
        };
        return transformed;
      });
    }
  });

  return (
    <div className="min-h-screen bg-gaming-900/95 backdrop-blur-sm">
      {/* Title */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-gaming-900 to-transparent">
        <h1 className="text-2xl font-bold text-gaming-100 text-center animate-fade-in">
          Clipts
        </h1>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-20">
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gaming-400"></div>
            </div>
          ) : posts?.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-gaming-400/60">
              No clipts found
            </div>
          ) : (
            posts?.map((post) => (
              <div key={post.id} className="gaming-card overflow-hidden rounded-lg">
                <PostItem post={post} />
              </div>
            ))
          )}
        </div>
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Clipts;
