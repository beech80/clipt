
import React from 'react';
import { useNavigate } from "react-router-dom";
import GameBoyControls from "@/components/GameBoyControls";
import PostItem from "@/components/PostItem";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BackButton } from "@/components/ui/back-button";
import type { Post } from "@/types/post";

interface PostResponse {
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
    name: string;
  } | null;
}

const Clipts = () => {
  const navigate = useNavigate();

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
          profiles (
            username,
            avatar_url
          ),
          games (name)
        `)
        .eq('type', 'video')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!postsData) return [];

      return (postsData as PostResponse[]).map((post): Post => ({
        id: post.id,
        content: post.content,
        image_url: post.image_url,
        video_url: post.video_url,
        user_id: post.user_id,
        created_at: post.created_at,
        profiles: post.profiles,
        games: post.games,
        likes_count: 0,
        comments_count: 0,
        clip_votes: [{ count: 0 }],
        is_published: true,
        is_premium: false,
        required_tier_id: null,
        scheduled_publish_time: null,
        type: 'video'
      }));
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <BackButton />
          <h1 className="text-3xl font-bold text-white">
            Clipts
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-24">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
          </div>
        ) : posts?.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <p className="text-2xl font-semibold text-white/60">No clipts found</p>
              <p className="text-purple-400">Be the first to share a gaming moment!</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 max-w-3xl mx-auto">
            {posts?.map((post) => (
              <div 
                key={post.id} 
                className="gaming-card overflow-hidden rounded-xl neo-blur hover:ring-2 hover:ring-purple-500/50 transition-all duration-300"
              >
                <PostItem post={post} />
              </div>
            ))}
          </div>
        )}
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Clipts;
