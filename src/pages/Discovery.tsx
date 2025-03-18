import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Search, X, Trophy, Trophy as TrophyIcon, Users as UsersIcon, Star, Gamepad2 } from 'lucide-react';
import GameCard from '@/components/GameCard';
import StreamerCard from '@/components/StreamerCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostsGrid from '@/components/PostsGrid';
import { toast } from 'sonner';

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
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [activeTab, setActiveTab] = useState('games');
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // Fetch posts for the main explore view
  useEffect(() => {
    const fetchPosts = async () => {
      setPostsLoading(true);
      try {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:user_id(username, display_name, avatar_url),
            games:game_id(name, cover_url)
          `)
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (error) throw error;
        setPosts(data || []);
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast.error('Failed to load posts');
      } finally {
        setPostsLoading(false);
      }
    };
    
    if (!isSearchMode) {
      fetchPosts();
    }
  }, [isSearchMode]);

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
        
        return transformedData;
      } catch (error) {
        console.error('Error in games search:', error);
        throw error;
      }
    },
    enabled: isSearchMode, // Only run when search mode is active
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
    enabled: isSearchMode && activeTab === 'streamers', // Only run when search mode and streamers tab is active
  });

  // Handle search input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    setIsSearching(value.length > 0);
    
    // Enter search mode as soon as user interacts with search
    if (!isSearchMode) {
      setIsSearchMode(true);
    }
  };

  // Handle search clear
  const handleClearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
  };

  // Close search mode
  const handleCloseSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
    setIsSearchMode(false);
  };

  // Focus on search input
  const handleSearchFocus = () => {
    if (!isSearchMode) {
      setIsSearchMode(true);
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-black text-white">
      {/* Fixed header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-indigo-950/90 backdrop-blur-md border-b border-indigo-900 shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-2xl">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={isSearchMode ? handleCloseSearch : () => navigate(-1)}
            className="text-gray-300 hover:text-white"
          >
            <span className="sr-only">Back</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="m15 18-6-6 6-6"/></svg>
          </Button>
          
          <div className="flex-1 mx-4">
            <div className="relative">
              <Input
                placeholder="Search games or streamers..."
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={handleSearchFocus}
                className="pl-10 py-5 bg-black/20 border-indigo-500/30 text-white placeholder:text-gray-400 w-full"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-400" />
              {isSearching && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      {isSearchMode ? (
        /* Search Mode UI */
        <div className="container mx-auto px-4 pt-24 pb-32 max-w-2xl">
          {/* EXPLORE Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Star className="h-6 w-6 text-yellow-400" />
              <h1 className="text-3xl font-bold text-yellow-400">EXPLORE</h1>
              <Star className="h-6 w-6 text-yellow-400" />
            </div>
            <p className="text-gray-300 text-sm">DISCOVER AMAZING GAMES & STREAMERS</p>
          </div>

          {/* Trending Games Section */}
          {!searchTerm && (
            <div className="mb-8">
              <div className="relative">
                <div className="flex items-center mb-4">
                  <h2 className="text-2xl font-bold text-yellow-400 px-4 py-1 bg-indigo-900/50 rounded-lg inline-flex items-center">
                    <Gamepad2 className="mr-2 h-5 w-5" /> TRENDING GAMES
                  </h2>
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
                        <div className="relative aspect-square bg-indigo-900/30 rounded-lg mb-2 overflow-hidden group-hover:opacity-90 transition-opacity border-2 border-indigo-400/30">
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
            </div>
          )}

          {/* Top Streamers Section - Only shown when no search term */}
          {!searchTerm && (
            <div className="mb-8">
              <div className="relative">
                <div className="flex items-center mb-4">
                  <h2 className="text-2xl font-bold text-yellow-400 px-4 py-1 bg-indigo-900/50 rounded-lg inline-flex items-center">
                    <UsersIcon className="mr-2 h-5 w-5" /> TOP STREAMERS
                  </h2>
                </div>
                
                {streamersLoading ? (
                  <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse bg-indigo-900/30 rounded-lg p-4 flex items-center">
                        <div className="h-12 w-12 bg-indigo-700/50 rounded-full mr-4"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-indigo-700/50 rounded w-1/3 mb-2"></div>
                          <div className="h-3 bg-indigo-700/50 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {streamers && streamers.slice(0, 3).map((streamer: Streamer) => (
                      <StreamerCard 
                        key={streamer.id}
                        id={streamer.id}
                        username={streamer.username}
                        displayName={streamer.display_name}
                        avatarUrl={streamer.avatar_url}
                        streamingUrl={streamer.streaming_url}
                        currentGame={streamer.current_game}
                        isLive={streamer.is_live}
                      />
                    ))}
                    
                    {(!streamers || streamers.length === 0) && (
                      <div className="text-center p-8 bg-indigo-900/20 rounded-lg border border-indigo-500/20">
                        <p className="text-gray-300">No streamers available right now.</p>
                        <p className="text-sm text-gray-400 mt-2">Check back later for the latest streamers.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Search Results */}
          {isSearching && (
            <div>
              <Tabs defaultValue="games" value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid grid-cols-2 w-full rounded-xl p-1 bg-indigo-950/40 backdrop-blur-sm border border-indigo-500/20">
                  <TabsTrigger 
                    value="games" 
                    className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                  >
                    <Gamepad2 className="mr-2 h-4 w-4" />
                    Games
                  </TabsTrigger>
                  <TabsTrigger 
                    value="streamers"
                    className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                  >
                    <UsersIcon className="mr-2 h-4 w-4" />
                    Streamers
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="games" className="mt-4">
                  {gamesLoading ? (
                    <div className="animate-pulse space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 bg-indigo-900/30 rounded-lg"></div>
                      ))}
                    </div>
                  ) : gamesError ? (
                    <div className="text-center p-8 bg-indigo-900/20 rounded-lg border border-indigo-500/20">
                      <p className="text-red-400">Error loading games</p>
                      <Button variant="outline" size="sm" onClick={() => refetchGames()} className="mt-2">
                        Try Again
                      </Button>
                    </div>
                  ) : (
                    <>
                      {games && games.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
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
                      ) : (
                        <div className="text-center p-8 bg-indigo-900/20 rounded-lg border border-indigo-500/20">
                          <p className="text-gray-300">No games found matching "{searchTerm}"</p>
                          <p className="text-sm text-gray-400 mt-2">Try a different search term</p>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="streamers" className="mt-4">
                  {streamersLoading ? (
                    <div className="animate-pulse space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-indigo-900/30 rounded-lg"></div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {streamers && streamers.length > 0 ? (
                        <div className="space-y-3">
                          {streamers.map((streamer: Streamer) => (
                            <StreamerCard 
                              key={streamer.id}
                              id={streamer.id}
                              username={streamer.username}
                              displayName={streamer.display_name}
                              avatarUrl={streamer.avatar_url}
                              streamingUrl={streamer.streaming_url}
                              currentGame={streamer.current_game}
                              isLive={streamer.is_live}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-8 bg-indigo-900/20 rounded-lg border border-indigo-500/20">
                          <p className="text-gray-300">No streamers found matching "{searchTerm}"</p>
                          <p className="text-sm text-gray-400 mt-2">Try a different search term</p>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      ) : (
        /* Explore Mode UI - Initial state showing posts/clips */
        <div className="container mx-auto px-4 pt-24 pb-32 max-w-2xl">
          <h1 className="text-2xl font-bold mb-6">Explore</h1>
          
          {postsLoading ? (
            <div className="animate-pulse space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-indigo-900/30 rounded-lg aspect-square"></div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <PostsGrid posts={posts} />
          ) : (
            <div className="flex flex-col items-center justify-center h-60 text-center p-8 bg-indigo-900/20 rounded-lg border border-indigo-500/20">
              <p className="text-gray-300 text-lg mb-2">No clips found</p>
              <p className="text-sm text-gray-400">Be the first to add some content!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Discovery;
