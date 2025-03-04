import React, { useState, useEffect } from 'react';
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
import { Search, Trophy, Flame, Clock, ArrowUp, X, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PostItem from '@/components/PostItem';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const [gameFilter, setGameFilter] = useState<'top_rated' | 'most_played' | 'most_watched'>('top_rated');
  const [activeTab, setActiveTab] = useState('games');
  const [searchQuery, setSearchQuery] = useState('');

  // Query for streamers
  const { data: streamers, isLoading: streamersLoading } = useQuery({
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
  };

  // Handle search input changes and @ mentions
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // If the query starts with @, we are searching for users
    if (query.startsWith('@') && query.length > 1) {
      // Search logic will be adjusted in the JSX to show user results
    }
  };

  // Handle navigation to user profile
  const navigateToUserProfile = (username: string) => {
    navigate(`/profile/${username}`);
  };

  return (
    <div className="container mx-auto p-4 min-h-screen relative">
      <div className="header">
        <h1 className="text-2xl font-bold text-center py-4 text-white">Discovery</h1>
        
        <div className="mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search games, streamers, or @mention users..."
              className="pl-10 bg-gaming-800/70 border-gaming-700"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button 
                className="absolute right-3 top-2.5" 
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Render user search results if query starts with @ */}
      {searchQuery.startsWith('@') && searchQuery.length > 1 ? (
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-white">Users matching "{searchQuery.substring(1)}"</h2>
          
          {streamersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gaming-800/50 p-4 rounded-lg animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-gaming-700/50 h-12 w-12"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gaming-700/50 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gaming-700/50 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : streamers && streamers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {streamers
                .filter(streamer => 
                  streamer.username.toLowerCase().includes(searchQuery.substring(1).toLowerCase())
                )
                .map((streamer) => (
                  <div 
                    key={streamer.id} 
                    className="bg-gaming-800/50 p-4 rounded-lg cursor-pointer hover:bg-gaming-700/50 transition-colors"
                    onClick={() => navigateToUserProfile(streamer.username)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-gaming-600">
                        <AvatarImage src={streamer.avatar_url || undefined} alt={streamer.username} />
                        <AvatarFallback className="bg-gaming-700 text-white">
                          {streamer.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-white">{streamer.display_name || streamer.username}</h3>
                        <p className="text-sm text-gray-400">@{streamer.username}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-gaming-800/30 rounded-lg">
              <User className="mx-auto h-8 w-8 text-gaming-500 mb-2" />
              <p className="text-gray-400">No users found matching "{searchQuery.substring(1)}"</p>
            </div>
          )}
        </div>
      ) : (
        <Tabs defaultValue="games" value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-center mb-6">
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="streamers">Streamers</TabsTrigger>
          </TabsList>

          <TabsContent value="games">
            {searchQuery && searchQuery.length > 2 ? (
              /* Search results for games */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchedGames && searchedGames.length > 0 ? (
                  searchedGames.map((game) => (
                    <Card 
                      key={game.id} 
                      className="relative overflow-hidden cursor-pointer transition duration-300 ease-in-out transform hover:scale-105"
                      onClick={() => navigate(`/game/${game.id}`)}
                    >
                      <div className="aspect-video">
                        <img 
                          src={game.cover_url || '/placeholder-game.jpg'}
                          alt={game.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/70 to-transparent p-4">
                        <h3 className="font-bold text-white">{game.name}</h3>
                        {game.rating && (
                          <div className="flex items-center mt-1">
                            <Badge variant="secondary" className="mr-2">
                              {Math.round(game.rating)}%
                            </Badge>
                            <span className="text-xs text-white/70">
                              {game.release_date || 'Unknown release date'}
                            </span>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-3 text-center p-12">
                    <p className="text-gray-400">No games found matching your search.</p>
                  </div>
                )}
              </div>
            ) : (
              /* Default games view */
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">Featured Games</h2>
                  <Select value={gameFilter} onValueChange={(value: any) => setGameFilter(value)}>
                    <SelectTrigger className="w-36 sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top_rated">Top Rated</SelectItem>
                      <SelectItem value="most_played">Most Played</SelectItem>
                      <SelectItem value="most_watched">Most Watched</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <TopGames filter={gameFilter} />
              </>
            )}
          </TabsContent>

          <TabsContent value="streamers">
            {searchQuery && searchQuery.length > 2 ? (
              /* Search results for streamers */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchedStreamers && searchedStreamers.length > 0 ? (
                  searchedStreamers.map((streamer: Streamer) => (
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
      )}
    </div>
  );
};

export default Discover;
