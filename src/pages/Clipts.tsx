
import React from 'react';
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import GameBoyControls from "@/components/GameBoyControls";
import PostItem from "@/components/PostItem";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BackButton } from "@/components/ui/back-button";

interface DbPost {
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

interface Post extends DbPost {
  likes_count: number;
  comments_count: number;
  clip_votes: any[];
}

const Clipts = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: posts, isLoading } = useQuery<Post[]>({
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

      return postsData.map((post: DbPost) => ({
        ...post,
        likes_count: 0,
        comments_count: 0,
        clip_votes: []
      }));
    }
  });

  return (
    <div className="min-h-screen bg-gaming-900/95 backdrop-blur-sm">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-gaming-900 to-transparent">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-2xl font-bold text-gaming-100 text-center animate-fade-in">
            Clipts
          </h1>
        </div>
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
