
import React from 'react';
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import GameBoyControls from "@/components/GameBoyControls";
import PostItem from "@/components/PostItem";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Post } from '@/types/post';

const Clipts = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      // Fetch posts first
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          ),
          games:game_id (name)
        `)
        .eq('type', 'video')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!postsData) return [];

      // Count comments for each post
      const commentCountsPromise = Promise.all(
        postsData.map(post =>
          supabase
            .from('comments')
            .select('*', { count: 'exact' })
            .eq('post_id', post.id)
        )
      );

      // Count votes for each post
      const voteCountsPromise = Promise.all(
        postsData.map(post =>
          supabase
            .from('clip_votes')
            .select('*', { count: 'exact' })
            .eq('post_id', post.id)
        )
      );

      const [commentResults, voteResults] = await Promise.all([
        commentCountsPromise,
        voteCountsPromise
      ]);

      // Transform the data into Post objects
      return postsData.map((post, index) => ({
        id: post.id,
        content: post.content,
        image_url: post.image_url,
        video_url: post.video_url,
        user_id: post.user_id,
        created_at: post.created_at,
        profiles: post.profiles,
        likes_count: 0,
        comments_count: commentResults[index].count || 0,
        clip_votes: voteResults[index].count ? [{ count: 1 }] : []
      })) as Post[];
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
