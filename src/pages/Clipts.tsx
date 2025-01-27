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
      console.log('Fetching clipts feed...');
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
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center gaming-card p-8">
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
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gaming-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1F2C]">
      <div className="container mx-auto px-4 py-6">
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
            {!posts || posts.length === 0 ? (
              <div className="text-center gaming-card p-8">
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
            ) : (
              posts.map((post) => (
                <div key={post.id} className="snap-start">
                  <PostItem post={post} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Game Boy Controls */}
      <GameBoyControls />
    </div>
  );
};

export default Clipts;