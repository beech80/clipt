import React, { useState } from 'react';
import { FeaturedCarousel } from "@/components/content/FeaturedCarousel";
import { TopGames } from "@/components/discover/TopGames";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { igdbService } from '@/services/igdbService';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('games');
  const [searchQuery, setSearchQuery] = useState('');

  // Query for streamers
  const { data: streamers, isLoading: isLoadingStreamers } = useQuery({
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

  // Search query for streamers
  const { data: searchedStreamers } = useQuery({
    queryKey: ['streamers', 'search', searchQuery, activeTab],
    enabled: !!searchQuery && searchQuery.length > 2 && activeTab === 'streamers',
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
        .ilike('username', `%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      
      return (data || []).map((profile: Streamer) => ({
        ...profile,
        is_live: profile.streams?.[0]?.is_live || false,
        viewer_count: profile.streams?.[0]?.viewer_count || 0
      }));
    }
  });

  // Query for games based on filter
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

  // Search query for games
  const { data: searchedGames } = useQuery({
    queryKey: ['games', 'search', searchQuery, activeTab],
    enabled: !!searchQuery && searchQuery.length > 2 && activeTab === 'games',
    queryFn: async () => {
      return igdbService.searchGames(searchQuery, {
        limit: 10
      });
    }
  });

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchQuery(''); // Clear search when changing tabs
  };

  return (
    <div className="container mx-auto p-4 min-h-screen relative">
      <div className="header">
        <h1 className="text-2xl font-bold text-center py-4 text-white">Find your next favorite game or streamer</h1>
        
        <div className="relative my-6 max-w-lg mx-auto">
          <Input
            type="text"
            placeholder={`Search ${activeTab === 'games' ? 'games' : 'streamers'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gaming-800 border-gaming-600"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <Tabs defaultValue="games" className="mt-6" onValueChange={handleTabChange}>
        <div className="flex justify-center mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger
              value="games"
              className="data-[state=active]:bg-gaming-700"
              onClick={() => setActiveTab('games')}
            >
              Games
            </TabsTrigger>
            <TabsTrigger
              value="streamers"
              className="data-[state=active]:bg-gaming-700"
              onClick={() => setActiveTab('streamers')}
            >
              Streamers
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="games">
          {searchQuery && searchQuery.length > 2 ? (
            /* Search results for games */
            <div className="glass-card p-4 backdrop-blur-sm mb-24">
              {searchedGames && searchedGames.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchedGames.map((game: any) => (
                    <Card 
                      key={game.id} 
                      className="overflow-hidden border-gaming-700 bg-gaming-800/50"
                    >
                      {game.cover && (
                        <div className="h-40 overflow-hidden">
                          <img 
                            src={game.cover.url.replace('t_thumb', 't_cover_big')} 
                            alt={game.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold truncate">{game.name}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-gray-400">
                            {game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : 'TBA'}
                          </span>
                          <Button 
                            size="sm" 
                            onClick={() => navigate(`/game/${game.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center p-12">
                  <p className="text-gray-400">No games found matching your search.</p>
                </div>
              )}
            </div>
          ) : (
            /* Default games view with filter */
            <div>
              <div className="flex items-center justify-center mb-6">
                <Select
                  value={gameFilter}
                  onValueChange={(value: 'top_rated' | 'most_played' | 'most_watched') => setGameFilter(value)}
                >
                  <SelectTrigger className="w-[300px] h-12 text-lg gaming-button border-[#9b87f5] hover:border-[#8B5CF6] bg-[#1A1F2C] text-white">
                    <SelectValue placeholder="Filter games" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1F2C] border-[#403E43]">
                    <SelectItem value="top_rated" className="text-white hover:bg-[#2A2F3C]">Top Rated</SelectItem>
                    <SelectItem value="most_played" className="text-white hover:bg-[#2A2F3C]">Most Played</SelectItem>
                    <SelectItem value="most_watched" className="text-white hover:bg-[#2A2F3C]">Most Watched</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="glass-card p-4 backdrop-blur-sm mb-24">
                <TopGames games={filteredGames} />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="streamers">
          {searchQuery && searchQuery.length > 2 ? (
            /* Search results for streamers */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchedStreamers && searchedStreamers.length > 0 ? (
                searchedStreamers.map((streamer) => (
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
                ))
              ) : (
                <div className="col-span-3 text-center p-12">
                  <p className="text-gray-400">No streamers found matching your search.</p>
                </div>
              )}
            </div>
          ) : (
            /* Default streamers view */
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Discover;
