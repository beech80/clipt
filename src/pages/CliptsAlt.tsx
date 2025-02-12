
import React from 'react';
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import GameBoyControls from "@/components/GameBoyControls";
import PostItem from "@/components/PostItem";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Grid2X2, LayoutList } from "lucide-react";

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

const CliptsAlt = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [gridView, setGridView] = React.useState(true);

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
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-gaming-900">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-3xl font-bold text-white text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Featured Clipts
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setGridView(false)}
              className={!gridView ? "bg-purple-500/20" : ""}
            >
              <LayoutList className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setGridView(true)}
              className={gridView ? "bg-purple-500/20" : ""}
            >
              <Grid2X2 className="h-5 w-5" />
            </Button>
          </div>
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
          <div className={`grid gap-6 ${gridView ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-3xl mx-auto'}`}>
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

export default CliptsAlt;
