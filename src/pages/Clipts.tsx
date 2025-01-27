import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus } from "lucide-react";
import GameBoyControls from "@/components/GameBoyControls";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PostItem from "@/components/PostItem";
import { useIsMobile } from "@/hooks/use-mobile";
import { Post } from "@/types/post";

const Clipts = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['clipts-feed'],
    queryFn: async () => {
      console.log('Starting to fetch clipts feed...');
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          ),
          likes (
            count
          ),
          clip_votes (
            count
          )
        `)
        .not('video_url', 'is', null)
        .is('is_published', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching clipts:', error);
        toast.error("Failed to load clips");
        throw error;
      }

      console.log('Fetched clipts:', data);
      return data as Post[];
    },
    retry: 1
  });

  if (error) {
    console.error('Query error:', error);
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center gaming-cartridge p-8">
          <h3 className="text-xl font-semibold mb-2 gaming-gradient">Error Loading Clipts</h3>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Failed to load clips"}
          </p>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            className="gaming-button"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    console.log('Clipts is in loading state');
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gaming-400" />
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    console.log('No clipts found');
    return (
      <div className="min-h-screen bg-[#1A1F2C]">
        <div className="container mx-auto px-4 py-6">
          <div className="gaming-cartridge mb-4 p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold gaming-gradient">Gaming Clipts</h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-sm text-gaming-400">LIVE</span>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => navigate('/clip-editor/new')}
            className="gaming-button gap-2 bg-gaming-400 hover:bg-gaming-500 mb-4"
          >
            <Plus className="h-4 w-4" />
            Create Clipt
          </Button>

          <div className="text-center gaming-cartridge p-8">
            <h3 className="text-xl font-semibold mb-2 gaming-gradient">No Clipts Yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to share an amazing gaming moment!
            </p>
            <Button 
              onClick={() => navigate('/clip-editor/new')}
              variant="outline"
              className="gaming-button"
            >
              Create Your First Clipt
            </Button>
          </div>
        </div>
        <GameBoyControls />
      </div>
    );
  }

  console.log('Rendering clipts:', posts.length);
  return (
    <div className="min-h-screen bg-[#1A1F2C]">
      <div className="container mx-auto px-4 py-6">
        {/* GameBoy Cartridge Header */}
        <div className="gaming-cartridge mb-4 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold gaming-gradient">Gaming Clipts</h1>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-sm text-gaming-400">LIVE</span>
            </div>
          </div>
        </div>

        {/* Create Button */}
        <div className="mb-4">
          <Button 
            onClick={() => navigate('/clip-editor/new')}
            className="gaming-button gap-2 bg-gaming-400 hover:bg-gaming-500"
          >
            <Plus className="h-4 w-4" />
            Create Clipt
          </Button>
        </div>

        {/* Posts Feed */}
        <div className={`relative ${isMobile ? 'h-[calc(100vh-120px)]' : 'h-[calc(100vh-200px)]'} 
                      overflow-y-auto snap-y snap-mandatory scroll-smooth touch-none overscroll-none`}>
          <div className="space-y-6 pb-6">
            {posts.map((post) => (
              <div key={post.id} className="snap-start">
                <PostItem post={post} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Game Boy Controls */}
      <GameBoyControls />
    </div>
  );
};

export default Clipts;