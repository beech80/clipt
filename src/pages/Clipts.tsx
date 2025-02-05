
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import GameBoyControls from "@/components/GameBoyControls";
import PostItem from "@/components/PostItem";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const Clipts = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedGame, setSelectedGame] = useState<string>('all');

  const { data: games } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts', selectedGame],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (username, avatar_url),
          games:game_id (name),
          likes (count),
          clip_votes (count)
        `)
        .order('created_at', { ascending: false });

      if (selectedGame !== 'all') {
        query = query.eq('game_id', selectedGame);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-[#1A1F2C]">
      {/* Modern Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-md z-50 
                    border-b border-white/10 shadow-lg flex items-center justify-between px-6">
        <span className="text-sm font-bold tracking-wider text-white">GAME CLIPTS</span>
        
        <Select value={selectedGame} onValueChange={setSelectedGame}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Game" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Games</SelectItem>
            {games?.map((game) => (
              <SelectItem key={game.id} value={game.id}>
                {game.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Posts Container */}
      <div className={`relative ${isMobile ? 'h-[calc(100vh-120px)]' : 'h-[calc(100vh-200px)]'} 
                    mt-16 overflow-y-auto snap-y snap-mandatory scroll-smooth touch-none overscroll-none post-container`}>
        <div className="space-y-4 pb-6 px-4 max-w-3xl mx-auto">
          {isLoading ? (
            <div className="text-center py-8 text-white/60">Loading clipts...</div>
          ) : posts?.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              No clipts found for this game
            </div>
          ) : (
            posts?.map((post) => (
              <div key={post.id} className="snap-start">
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
