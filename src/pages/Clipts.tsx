
import React from 'react';
import { useNavigate } from "react-router-dom";
import GameBoyControls from "@/components/GameBoyControls";
import PostItem from "@/components/PostItem";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BackButton } from "@/components/ui/back-button";
import { Camera } from "lucide-react";

interface PostProfile {
  username: string;
  avatar_url: string;
}

interface PostGame {
  name: string;
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  user_id: string;
  created_at: string;
  profiles: PostProfile;
  games: PostGame | null;
  is_published: boolean;
  is_premium: boolean;
  required_tier_id: string | null;
  scheduled_publish_time: string | null;
  type: 'video';
  likes_count: number;
  comments_count: number;
  clip_votes: { count: number }[];
}

const Clipts = () => {
  const navigate = useNavigate();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          video_url,
          user_id,
          created_at,
          profiles:user_id (username, avatar_url),
          games (name),
          is_published,
          is_premium,
          required_tier_id,
          scheduled_publish_time
        `)
        .eq('type', 'video')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map((post): Post => ({
        ...post,
        type: 'video',
        likes_count: 0,
        comments_count: 0,
        clip_votes: [{ count: 0 }]
      }));
    }
  });

  return (
    <div className="min-h-screen bg-[#1a237e]">
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
                className="bg-[#283593]/80 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg border border-indigo-400/20"
              >
                <PostItem post={post} showComments={true} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed left-1/2 -translate-x-1/2 bottom-24 sm:bottom-28">
        <button 
          onClick={() => navigate('/post/new')}
          className="clip-button active:scale-95 transition-transform"
          aria-label="Create Clipt"
          style={{ width: '80px', height: '60px' }}
        >
          <Camera className="clip-button-icon" />
          <span className="clip-button-text">Clipt</span>
        </button>
      </div>

      <GameBoyControls />
    </div>
  );
}

export default Clipts;
