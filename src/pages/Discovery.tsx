import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/ui/back-button";
import { Search, Trophy, Tv, Users, X } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import GameCard from '@/components/GameCard';
import StreamerCard from '@/components/StreamerCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Game {
  id: string;
  name: string;
  cover_url: string;
  post_count: any;
}

interface Streamer {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  streaming_url: string;
  current_game: string;
  is_live: boolean;
}

const Discovery = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('games');
  const [isSearching, setIsSearching] = useState(false);

  // Games Tab
  const { data: games, isLoading: gamesLoading, error: gamesError, refetch: refetchGames } = useQuery({
    queryKey: ['games', 'discovery', searchTerm],
    queryFn: async () => {
      try {
        console.log('Searching for games with term:', searchTerm);
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
        
        console.log('Executing Supabase query for games search');
        const { data, error } = await query.limit(20); // Increased limit from default
        
        if (error) {
          console.error('Supabase games query error:', error);
          throw error;
        }
        
        console.log('Supabase games search results:', data?.length || 0);
        
        // Transform data to fix the count object issue
        const transformedData = (data || []).map(game => {
          // Cast game.post_count to any to work around TypeScript restrictions
          const postCount = game.post_count as any;
          return {
            ...game,
            post_count: typeof postCount === 'object' && postCount !== null 
              ? (Array.isArray(postCount) 
                ? (postCount.length > 0 && postCount[0]?.count ? postCount[0].count : 0) 
                : (postCount?.count || 0)) 
              : (typeof postCount === 'number' ? postCount : 0)
          };
        });
        
        // If no data from database, try fetching from IGDB
        if (transformedData.length === 0) {
          try {
            console.log('No games found in database, trying IGDB');
            const { igdbService } = await import('@/services/igdbService');
            const popularGames = await igdbService.getPopularGames(6);
            
            console.log('IGDB results:', popularGames?.length || 0);
            
            if (popularGames && popularGames.length > 0) {
              return popularGames.map((game: any) => {
                // Fix IGDB cover URL formatting
                let coverUrl = undefined;
                if (game.cover?.url) {
                  coverUrl = game.cover.url;
                  // If URL starts with //, add https:
                  if (coverUrl.startsWith('//')) {
                    coverUrl = `https:${coverUrl}`;
                  } 
                  // If URL doesn't have protocol or // prefix
                  else if (!coverUrl.includes('://') && !coverUrl.startsWith('//')) {
                    coverUrl = `https://${coverUrl}`;
                  }
                  // Replace t_thumb with t_cover_big for better quality images
                  if (coverUrl.includes('t_thumb')) {
                    coverUrl = coverUrl.replace('t_thumb', 't_cover_big');
                  }
                }
                
                return {
                  id: `igdb-${game.id}`,
                  name: game.name,
                  cover_url: coverUrl,
                  post_count: 0
                };
              });
            }
          } catch (igdbError) {
            console.error('IGDB fallback failed:', igdbError);
          }
        }
        
        console.log('Returning transformed data:', transformedData.length);
        return transformedData;
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
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Streamers Tab
  const { data: streamers, isLoading: streamersLoading, refetch: refetchStreamers } = useQuery({
    queryKey: ['streamers', 'discovery', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .not('streaming_url', 'is', null);
      
      // Apply search filter if provided
      if (searchTerm) {
        query = query.or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform the data to match the Streamer interface
      return (data || []).map(profile => {
        // Cast the profile to any to bypass TypeScript strict checks
        const p = profile as any;
        return {
          id: p.id,
          username: p.username || '',
          display_name: p.display_name || '',
          avatar_url: p.avatar_url || '',
          streaming_url: p.streaming_url || '',
          current_game: p.current_game || '',
          is_live: Boolean(p.is_live)
        };
      });
    },
    enabled: activeTab === 'streamers',
  });

  useEffect(() => {
    // Reset searching flag after a delay when searchTerm changes
    if (searchTerm.length > 0) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        if (activeTab === 'games') {
          refetchGames();
        } else if (activeTab === 'streamers') {
          refetchStreamers();
        }
      }, 500); // Debounce search for 500ms
      
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [searchTerm, activeTab, refetchGames, refetchStreamers]);
  
  // Enhanced search handler with debounce
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
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
        {/* Trending Games Section */}
        {!searchTerm && (
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Trophy className="mr-2 h-5 w-5 text-indigo-400" />
              <h2 className="text-xl font-bold">Trending Games</h2>
            </div>
            
            {gamesLoading ? (
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-indigo-900/30 rounded-lg mb-2"></div>
                    <div className="h-4 bg-indigo-900/30 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-indigo-900/30 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {games && games.slice(0, 3).map((game: Game) => (
                  <div 
                    key={game.id} 
                    className="cursor-pointer group"
                    onClick={() => navigate(`/game/${game.id}`)}
                  >
                    <div className="relative aspect-square bg-indigo-900/30 rounded-lg mb-2 overflow-hidden group-hover:opacity-90 transition-opacity">
                      {game.cover_url ? (
                        <img 
                          src={game.cover_url} 
                          alt={game.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).onerror = null;
                            (e.target as HTMLImageElement).src = `https://via.placeholder.com/300x400/374151/FFFFFF?text=${encodeURIComponent(game.name?.charAt(0) || 'G')}`;
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-indigo-900/50 text-4xl font-bold text-indigo-300">
                          {game.name?.charAt(0) || 'G'}
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-2">
                        <div className="text-xs text-indigo-300">
                          <span className="text-indigo-400">{game.post_count || 0}</span> clips
                        </div>
                      </div>
                    </div>
                    <h3 className="font-medium text-white group-hover:text-indigo-300 transition-colors">{game.name}</h3>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="games" value={activeTab} onValueChange={setActiveTab}>
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
                onChange={handleSearch}
              />
              {searchTerm.length > 0 && (
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-400 hover:text-indigo-300"
                  onClick={() => setSearchTerm('')}
                >
                  <X size={18} />
                </button>
              )}
            </div>
            {searchTerm.length > 0 && (
              <p className="text-sm text-indigo-300">
                Searching for: <span className="font-semibold">{searchTerm}</span>
              </p>
            )}
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
                    {games.map((game: Game) => (
                      <GameCard
                        key={game.id}
                        id={game.id}
                        name={game.name}
                        coverUrl={game.cover_url}
                        postCount={game.post_count}
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
                    
                    {gamesError && (
                      <p className="text-red-400 text-sm mt-1 mb-4">Error: {typeof gamesError === 'object' && gamesError !== null ? 
                        (gamesError as Error).message || JSON.stringify(gamesError) : 
                        String(gamesError)}</p>
                    )}
                    
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => setSearchTerm('')}
                    >
                      Clear search
                    </Button>
                    
                    {/* Debug info during development - can be removed in production */}
                    {import.meta.env.DEV && searchTerm && (
                      <details className="mt-4 text-left p-3 bg-gray-800 rounded">
                        <summary className="cursor-pointer text-purple-400">Debug Information</summary>
                        <div className="p-2 mt-2 bg-gray-900 rounded overflow-auto max-h-40">
                          <p>Search Term: {JSON.stringify(searchTerm)}</p>
                          <p>Games Data: {JSON.stringify(games)}</p>
                          <p>Error: {JSON.stringify(gamesError)}</p>
                        </div>
                      </details>
                    )}
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
                {streamers.map((streamer: Streamer) => (
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
