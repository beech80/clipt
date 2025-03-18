import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Trophy, Trophy as TrophyIcon, Users as UsersIcon, Star, Gamepad2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import PostsGrid from '@/components/PostsGrid';
import GameCard from '@/components/GameCard';
import { transformPostsFromDb, transformGamesFromDb, transformStreamersFromDb } from '@/utils/transformers';

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
  follower_count?: number;
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
            id, title, content, created_at, media_url, 
            user_id, game_id,
            likes_count, comments_count,
            profiles (username, display_name, avatar_url),
            games (name, cover_url)
          `)
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (error) throw error;
        setPosts(transformPostsFromDb(data || []));
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
          .select('id, name, cover_url, post_count')
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
        
        const transformedData = transformGamesFromDb(data || []);
        
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
  const { 
    data: streamers, 
    isLoading: streamersLoading, 
    error: streamersError,
    refetch: refetchStreamers 
  } = useQuery({
    queryKey: ['streamers', 'discovery', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, streaming_url, is_live, follower_count, current_game')
        .not('streaming_url', 'is', null);
      
      // Apply search filter if provided
      if (searchTerm) {
        query = query.or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return transformStreamersFromDb(data || []);
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

  const navigateToGame = (gameId: string) => {
    navigate(`/game/${gameId}`);
  };

  const navigateToUser = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const GameLeaderboard = ({ games, isLoading, error }: { games: Game[], isLoading: boolean, error: string | null }) => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="animate-pulse flex items-center p-2 rounded">
              <div className="w-6 h-6 bg-indigo-800/60 rounded flex items-center justify-center text-indigo-300 mr-3">
                {index + 1}
              </div>
              <div className="h-4 bg-indigo-800/60 rounded w-full"></div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return <div className="text-red-400 text-sm">{error}</div>;
    }

    if (games.length === 0) {
      return <div className="text-gray-400 text-sm">No trending games found</div>;
    }

    return (
      <div className="space-y-1">
        {games.slice(0, 3).map((game, index) => (
          <div 
            key={game.id} 
            className="flex items-center p-2 rounded hover:bg-indigo-950/50 transition-colors cursor-pointer"
            onClick={() => navigateToGame(game.id)}
          >
            <div className="w-6 h-6 bg-indigo-900/60 rounded-full flex items-center justify-center text-indigo-300 mr-3">
              {index + 1}
            </div>
            <div className="font-medium text-base">{game.name}</div>
            <div className="ml-auto text-xs text-indigo-400">{game.post_count || 0} clips</div>
          </div>
        ))}
      </div>
    );
  };

  const StreamerLeaderboard = ({ streamers, isLoading, error }: { streamers: Streamer[], isLoading: boolean, error: string | null }) => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="animate-pulse flex items-center p-2 rounded">
              <div className="w-6 h-6 bg-indigo-800/60 rounded flex items-center justify-center text-indigo-300 mr-3">
                {index + 1}
              </div>
              <div className="h-4 bg-indigo-800/60 rounded w-full"></div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return <div className="text-red-400 text-sm">{error}</div>;
    }

    if (streamers.length === 0) {
      return <div className="text-gray-400 text-sm">No trending streamers found</div>;
    }

    return (
      <div className="space-y-1">
        {streamers.slice(0, 3).map((streamer, index) => (
          <div 
            key={streamer.id} 
            className="flex items-center p-2 rounded hover:bg-indigo-950/50 transition-colors cursor-pointer"
            onClick={() => navigateToUser(streamer.id)}
          >
            <div className="w-6 h-6 bg-indigo-900/60 rounded-full flex items-center justify-center text-indigo-300 mr-3">
              {index + 1}
            </div>
            <div className="font-medium text-base">{streamer.username}</div>
            <div className="ml-auto text-xs text-indigo-400">{streamer.follower_count || 0} followers</div>
          </div>
        ))}
      </div>
    );
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
                
                <GameLeaderboard 
                  games={games} 
                  isLoading={gamesLoading} 
                  error={gamesError} 
                />
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
                
                <StreamerLeaderboard 
                  streamers={streamers} 
                  isLoading={streamersLoading} 
                  error={streamersError} 
                />
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
                              onClick={() => navigateToGame(game.id)}
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
                  ) : streamersError ? (
                    <div className="text-center p-8 bg-indigo-900/20 rounded-lg border border-indigo-500/20">
                      <p className="text-red-400">Error loading streamers</p>
                      <p className="text-sm text-gray-400 mt-2">Please try again later</p>
                    </div>
                  ) : (
                    <>
                      {streamers && streamers.length > 0 ? (
                        <div className="space-y-3">
                          {streamers.map((streamer: Streamer) => (
                            <div 
                              key={streamer.id}
                              className="flex items-center p-3 rounded hover:bg-indigo-950/50 transition-colors cursor-pointer bg-indigo-950/30 border border-indigo-500/20"
                              onClick={() => navigateToUser(streamer.id)}
                            >
                              <div className="font-medium text-base">{streamer.username}</div>
                              <div className="ml-auto text-xs text-indigo-400">{streamer.follower_count || 0} followers</div>
                            </div>
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
