import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/ui/back-button";
import { Search, Trophy, Tv, Users } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import GameCard from '@/components/GameCard';
import StreamerCard from '@/components/StreamerCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Discovery = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('games');

  // Games Tab
  const { data: games, isLoading: gamesLoading, error: gamesError, refetch: refetchGames } = useQuery({
    queryKey: ['games', 'discovery', searchTerm],
    queryFn: async () => {
      try {
        let query = supabase
          .from('games')
          .select(`
            *,
            post_count:posts(count)
          `)
          .order('name');
        
        // Apply search filter if provided
        if (searchTerm) {
          query = query.ilike('name', `%${searchTerm}%`);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching games:', error);
          throw error;
        }
        
        // If no data or empty data, attempt to load games from IGDB
        if (!data || data.length === 0) {
          console.log('No games from Supabase, getting from IGDB');
          try {
            const { igdbService } = await import('@/services/igdbService');
            const igdbGames = await igdbService.getTopGames('top_rated');
            
            // Convert IGDB games to the format our app expects
            return igdbGames.map(game => ({
              id: `igdb-${game.id}`,
              name: game.name,
              cover_url: game.cover?.url,
              post_count: 0,
              igdb_id: game.id
            }));
          } catch (igdbError) {
            console.error('Error fetching from IGDB:', igdbError);
            // Return hardcoded games as last resort
            return [
              { id: 'fallback-1', name: 'Halo Infinite', cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg', post_count: 0 },
              { id: 'fallback-2', name: 'Forza Horizon 5', cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3wk8.jpg', post_count: 0 },
              { id: 'fallback-3', name: 'Call of Duty: Modern Warfare', cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wkb.jpg', post_count: 0 },
              { id: 'fallback-4', name: 'FIFA 23', cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co52l6.jpg', post_count: 0 },
              { id: 'fallback-5', name: 'Elden Ring', cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4hk8.jpg', post_count: 0 },
              { id: 'fallback-6', name: 'The Legend of Zelda', cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5vmg.jpg', post_count: 0 }
            ];
          }
        }
        
        return data;
      } catch (error) {
        console.error('Error in games query:', error);
        // Return hardcoded games as a last resort
        return [
          { id: 'fallback-1', name: 'Halo Infinite', cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg', post_count: 0 },
          { id: 'fallback-2', name: 'Forza Horizon 5', cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3wk8.jpg', post_count: 0 },
          { id: 'fallback-3', name: 'Call of Duty: Modern Warfare', cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wkb.jpg', post_count: 0 },
          { id: 'fallback-4', name: 'FIFA 23', cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co52l6.jpg', post_count: 0 },
          { id: 'fallback-5', name: 'Elden Ring', cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4hk8.jpg', post_count: 0 },
          { id: 'fallback-6', name: 'The Legend of Zelda', cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5vmg.jpg', post_count: 0 }
        ];
      }
    },
    enabled: activeTab === 'games',
  });

  // Streamers Tab
  const { data: streamers, isLoading: streamersLoading, refetch: refetchStreamers } = useQuery({
    queryKey: ['streamers', 'discovery', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .not('streaming_url', 'is', null)
        .order('username');
      
      // Apply search filter if provided
      if (searchTerm) {
        query = query.or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    },
    enabled: activeTab === 'streamers',
  });

  useEffect(() => {
    if (activeTab === 'games') {
      refetchGames();
    } else if (activeTab === 'streamers') {
      refetchStreamers();
    }
  }, [searchTerm, activeTab, refetchGames, refetchStreamers]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1f3c] to-[#0d0f1e]">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/60 backdrop-blur-lg border-b border-indigo-500/20">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <BackButton className="absolute left-0 text-indigo-400 hover:text-indigo-300" />
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center gap-2">
            <Trophy className="text-indigo-400" size={28} />
            Discovery
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-32 max-w-2xl">
        {/* Main Tabs */}
        <Tabs defaultValue="games" value={activeTab} onValueChange={handleTabChange} className="w-full mb-6">
          <TabsList className="grid grid-cols-2 w-full rounded-xl p-1 bg-indigo-950/40 backdrop-blur-sm border border-indigo-500/20">
            <TabsTrigger 
              value="games" 
              className="data-[state=active]:bg-gradient-to-r from-indigo-600 to-purple-600 data-[state=active]:text-white rounded-lg"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Games
            </TabsTrigger>
            <TabsTrigger 
              value="streamers" 
              className="data-[state=active]:bg-gradient-to-r from-indigo-600 to-purple-600 data-[state=active]:text-white rounded-lg"
            >
              <Tv className="w-4 h-4 mr-2" />
              Streamers
            </TabsTrigger>
          </TabsList>

          {/* Search UI */}
          <div className="mb-6 mt-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400" size={18} />
              <Input 
                className="bg-indigo-950/30 border-indigo-500/30 pl-10 text-white placeholder:text-indigo-300/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 h-12 rounded-xl"
                placeholder={activeTab === 'games' ? "Search for games..." : "Search for streamers..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Tab Content */}
          <TabsContent value="games" className="mt-2">
            {activeTab === 'games' && (
              <>
                {gamesLoading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-indigo-300">Loading games...</p>
                  </div>
                )}
                
                {!gamesLoading && games && games.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {games.map((game) => (
                      <GameCard
                        key={game.id}
                        id={game.id}
                        name={game.name}
                        coverUrl={game.cover_url}
                        postCount={game.post_count || 0}
                        onClick={() => navigate(`/game/${game.id}`)}
                      />
                    ))}
                  </div>
                )}
                
                {!gamesLoading && (!games || games.length === 0) && (
                  <div className="flex flex-col items-center justify-center text-center py-20 px-4 bg-indigo-950/20 rounded-2xl border border-indigo-500/20">
                    <div className="bg-indigo-900/30 p-5 rounded-full mb-4">
                      <Trophy className="h-12 w-12 text-indigo-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">No games found</h3>
                    <p className="text-indigo-300 mb-6">Try a different search term</p>
                    
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => setSearchTerm('')}
                    >
                      Clear search
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="streamers" className="mt-2">
            {streamersLoading && (
              <div className="flex justify-center my-12">
                <div className="flex flex-col items-center">
                  <div className="animate-pulse flex space-x-2 items-center">
                    <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                  <div className="mt-3 text-indigo-300/70">Loading streamers...</div>
                </div>
              </div>
            )}

            {!streamersLoading && streamers && streamers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {streamers.map((streamer) => (
                  <StreamerCard 
                    key={streamer.id}
                    id={streamer.id}
                    username={streamer.username}
                    displayName={streamer.display_name}
                    avatarUrl={streamer.avatar_url}
                    streamingUrl={streamer.streaming_url}
                    game={streamer.current_game}
                    isLive={streamer.is_live}
                    onClick={() => navigate(`/profile/${streamer.id}`)}
                  />
                ))}
              </div>
            )}

            {!streamersLoading && (!streamers || streamers.length === 0) && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-4 bg-indigo-950/30 p-8 rounded-2xl border border-indigo-500/20 backdrop-blur-sm">
                  <div className="inline-block p-4 bg-indigo-900/30 rounded-full mb-4">
                    <Users className="h-10 w-10 text-indigo-400" />
                  </div>
                  <p className="text-2xl font-semibold text-white">No streamers found</p>
                  <p className="text-indigo-300">Try a different search term</p>
                  <Button
                    className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-6 py-2"
                    onClick={() => {
                      setSearchTerm('');
                    }}
                  >
                    Clear search
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Discovery;
