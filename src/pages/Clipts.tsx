
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import GameBoyControls from "@/components/GameBoyControls";
import PostItem from "@/components/PostItem";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import MuxPlayer from "@/components/video/MuxPlayer";

interface Game {
  id: string;
  name: string;
  cover_url: string | null;
  created_at: string;
}

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
          profiles:user_id (username, avatar_url),
          games:game_id (name),
          likes (count),
          clip_votes (count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="fixed inset-0 bg-gaming-900/95 backdrop-blur-sm">
      {/* Title */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-gaming-900 to-transparent">
        <h1 className="text-2xl font-bold text-gaming-100 text-center animate-fade-in">
          Clipts
        </h1>
      </div>

      {/* Full Screen Vertical Feed */}
      <div className="h-screen w-full snap-y snap-mandatory overflow-y-scroll scrollbar-hide">
        {isLoading ? (
          <div className="flex h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gaming-400"></div>
          </div>
        ) : posts?.length === 0 ? (
          <div className="flex h-screen items-center justify-center text-gaming-400/60">
            No clipts found
          </div>
        ) : (
          posts?.map((post) => (
            <div 
              key={post.id} 
              className="h-screen w-full snap-start relative flex items-center justify-center bg-gaming-900/80"
            >
              {post.video_url && (
                <div className="relative w-full h-full">
                  <MuxPlayer
                    playbackId={post.video_url}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                  />
                  {/* Overlay Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gaming-900/90 to-transparent">
                    <div className="flex items-center gap-3 animate-fade-in">
                      <img 
                        src={post.profiles?.avatar_url || '/placeholder.svg'} 
                        alt={post.profiles?.username}
                        className="w-10 h-10 rounded-full border border-gaming-400/20 hover:border-gaming-400 transition-all duration-300"
                      />
                      <div>
                        <h3 className="text-gaming-100 font-semibold hover:text-gaming-200 transition-colors">
                          {post.profiles?.username}
                        </h3>
                        <p className="text-gaming-300 text-sm">
                          {post.games?.name}
                        </p>
                      </div>
                    </div>
                    <p className="text-gaming-100/90 mt-2 animate-fade-in">{post.content}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Clipts;
