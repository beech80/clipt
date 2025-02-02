import React from 'react';
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import GameBoyControls from "@/components/GameBoyControls";
import PostItem from "@/components/PostItem";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const Clipts = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          ),
          likes:likes (
            count
          ),
          clip_votes:clip_votes (
            count
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="min-h-screen bg-[#1A1F2C]">
      <div className="gameboy-header">
        <span className="gameboy-title">CLIPTS</span>
      </div>

      <div className={`relative ${isMobile ? 'h-[calc(100vh-120px)]' : 'h-[calc(100vh-200px)]'} 
                    mt-16 overflow-y-auto snap-y snap-mandatory scroll-smooth touch-none overscroll-none post-container`}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gaming-400">Loading clips...</div>
          </div>
        ) : (
          <div className="space-y-4 pb-6 px-4">
            {posts?.map((post) => (
              <div key={post.id} className="snap-start">
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