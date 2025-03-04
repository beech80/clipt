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
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
      return igdbService.getTopGames(gameFilter);
    }
  });

  // Search query for games
  const { data: searchedGames } = useQuery({
    queryKey: ['games', 'search', searchQuery, activeTab],
    enabled: !!searchQuery && searchQuery.length > 2 && activeTab === 'games',
    queryFn: async () => {
      return igdbService.searchGames(searchQuery);
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
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={`Search for ${activeTab === 'games' ? 'games' : 'streamers'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 focus:ring-purple-600 focus:border-purple-600"
            />
            {searchQuery && (
              <Button 
                variant="ghost" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
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

        <TabsContent value="games" className="pt-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">{searchQuery ? 'Search Results' : 'Top Games'}</h2>
            {!searchQuery && (
              <Select defaultValue={gameFilter} onValueChange={(value: any) => setGameFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top_rated">Top Rated</SelectItem>
                  <SelectItem value="most_played">Most Played</SelectItem>
                  <SelectItem value="most_watched">Most Anticipated</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {(searchQuery && activeTab === 'games') ? (
            searchedGames && searchedGames.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {searchedGames.map((game) => (
                  <Card key={game.id} className="overflow-hidden bg-gray-800 border-gray-700 h-full">
                    <div 
                      className="relative h-40 cursor-pointer" 
                      onClick={() => navigate(`/game/${game.id}`)}
                    >
                      <img 
                        src={game.cover?.url || '/images/placeholder-game.jpg'} 
                        alt={game.name} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium truncate">{game.name}</h3>
                          {game.rating && (
                            <Badge variant="outline" className="bg-yellow-800 border-yellow-600">
                              {Math.round(game.rating)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : searchQuery.length > 2 ? (
              <div className="text-center py-10">
                <p className="text-gray-400">No games found matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-400">Type at least 3 characters to search for games</p>
              </div>
            )
          ) : (
            <TopGames filter={gameFilter} />
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
