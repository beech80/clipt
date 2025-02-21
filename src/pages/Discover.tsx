
import React, { useState } from 'react';
import { FeaturedCarousel } from "@/components/content/FeaturedCarousel";
import { TopGames } from "@/components/discover/TopGames";
import GameBoyControls from "@/components/GameBoyControls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { igdbService } from '@/services/igdbService';

interface StreamInfo {
  is_live: boolean;
  viewer_count: number;
}

interface Streamer {
  id: string;
  username: string;
  avatar_url: string | null;
  display_name: string | null;
  streams: StreamInfo[];
}

const Discover = () => {
  const navigate = useNavigate();
  const [gameFilter, setGameFilter] = useState<'top_rated' | 'most_played' | 'most_watched'>('top_rated');

  const { data: streamers } = useQuery({
    queryKey: ['streamers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          avatar_url,
          display_name,
          streams (
            is_live,
            viewer_count
          )
        `)
        .order('is_live', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      return (data || []).map((profile: Streamer) => ({
        ...profile,
        is_live: profile.streams?.[0]?.is_live || false,
        viewer_count: profile.streams?.[0]?.viewer_count || 0
      }));
    }
  });

  const { data: filteredGames } = useQuery({
    queryKey: ['games', gameFilter],
    queryFn: async () => {
      switch (gameFilter) {
        case 'top_rated':
          return igdbService.getPopularGames();
        case 'most_played':
          // Custom query for most played games
          return igdbService.searchGames('', {
            sort: 'follows desc',
            limit: 10
          });
        case 'most_watched':
          // Custom query for most watched games
          return igdbService.searchGames('', {
            sort: 'total_rating desc',
            limit: 10
          });
        default:
          return igdbService.getPopularGames();
      }
    }
  });

  return (
    <div className="min-h-screen bg-[#1A1F2C] bg-gradient-to-b from-gaming-900/50 to-gaming-800/30">
      <div className="container mx-auto px-4 py-6 space-y-8">
        <div className="max-w-2xl mx-auto space-y-4">
          <h1 className="text-3xl font-bold text-center gaming-gradient">
            Discover
          </h1>
          <p className="text-sm text-center text-white/60">
            Find your next favorite game or streamer
          </p>
          <FeaturedCarousel />
        </div>

        <Tabs defaultValue="games" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="streamers">Streamers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="games">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-medium gaming-gradient">
                  Featured Games
                </h2>
                <Select
                  value={gameFilter}
                  onValueChange={(value: 'top_rated' | 'most_played' | 'most_watched') => setGameFilter(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter games" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top_rated">Top Rated</SelectItem>
                    <SelectItem value="most_played">Most Played</SelectItem>
                    <SelectItem value="most_watched">Most Watched</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="glass-card p-4 backdrop-blur-sm mb-24">
                <TopGames games={filteredGames} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="streamers">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {streamers?.map((streamer) => (
                <Card 
                  key={streamer.id} 
                  className="p-4 flex items-center gap-4 bg-gaming-800/50 backdrop-blur-sm border-gaming-700"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={streamer.avatar_url || ''} alt={streamer.username} />
                    <AvatarFallback>{streamer.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">{streamer.display_name || streamer.username}</h3>
                    <div className="flex items-center gap-2">
                      {streamer.is_live && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-sm text-white/60">
                            {streamer.viewer_count} viewers
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => navigate(`/user/${streamer.username}`)}
                  >
                    View Profile
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Discover;
