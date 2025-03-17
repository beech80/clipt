import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Search, X, Ghost, Trophy, Gamepad2, Users, Sparkles, Star, SearchX } from 'lucide-react';
import { igdbService } from '@/services/igdbService';
import { BackButton } from '@/components/ui/back-button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const RetroSearchPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [streamersLoading, setStreamersLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle clicks outside of search container
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus search input on page load
  useEffect(() => {
    if (searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, []);

  // Query for IGDB games with fixed implementation
  const { data: igdbGames, isLoading: igdbGamesLoading, error: igdbGamesError, refetch: refetchIgdbGames } = useQuery({
    queryKey: ['igdb', 'games', 'search', searchTerm || ''],
    queryFn: async () => {
      console.log('IGDB Query executing for search term:', searchTerm);
      
      try {
        // Call the improved IGDB service directly
        const games = await igdbService.searchGames(searchTerm, {
          sort: 'popularity desc',
          limit: 12 // Increased from 10 to 12 for more results
        });
        
        console.log('IGDB API returned games:', games?.length || 0);
        return games || [];
      } catch (error) {
        console.error('IGDB search error:', error);
        return [];
      }
    },
    enabled: true, // Always enabled to show trending games
    staleTime: 10 * 1000, // 10 seconds
    retry: 2, // Retry failed requests twice
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Query for top games from our database (as fallback and for "top searched")
  const { data: topGames, isLoading: topGamesLoading, error: topGamesError } = useQuery({
    queryKey: ['games', 'top-searched'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('games')
        .select(`
          id,
          name,
          cover_url,
          post_count:posts(count)
        `)
        .order('post_count', { ascending: false })
        .limit(3); // Only fetch top 3
      
      if (error) throw error;
      
      // Transform data to fix the count object issue
      return (data || []).map(game => ({
        ...game,
        post_count: typeof game.post_count === 'object' && game.post_count !== null 
          ? Number(game.post_count.count || 0) 
          : (typeof game.post_count === 'number' ? game.post_count : 0)
      })).slice(0, 3); // Ensure we only return 3 games maximum
    },
  });

  // Query for streamers with search term
  const { data: streamersSearchData, isLoading: streamersSearchLoading, error: streamersSearchError, refetch: refetchStreamers } = useQuery<any[]>({
    queryKey: ['streamers', 'search', searchTerm || ''],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }

      const formattedSearchTerm = searchTerm.trim();
      
      console.log('Searching streamers for term:', formattedSearchTerm);
      
      let query = supabase
        .from('profiles')
        .select(`
          id,
          username,
          display_name,
          avatar_url
        `);
      
      // Only filter for streamers if not searching for users
      if (!formattedSearchTerm.startsWith('@')) {
        query = query.not('streaming_url', 'is', null);
      }
      
      if (formattedSearchTerm) {
        query = query.or(`username.ilike.%${formattedSearchTerm}%,display_name.ilike.%${formattedSearchTerm}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false }).limit(3); // Only fetch top 3
      
      if (error) {
        console.error('Error fetching streamers:', error);
        return [];
      }
      
      return data || [];
    },
    staleTime: searchTerm ? 10000 : 60000, // Cache results for 10s when searching, 60s otherwise
    enabled: Boolean(searchTerm), // Fixed boolean conversion
  });
  
  // Separate query for top streamers (not search-dependent)
  const { data: topStreamersData, isLoading: topStreamersLoading, error: topStreamersError, refetch: refetchTopStreamers } = useQuery<any[]>({
    queryKey: ['streamers', 'top'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          display_name,
          avatar_url
        `)
        .not('streaming_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(3); // Only fetch top 3
      
      if (error) {
        console.error('Error fetching top streamers:', error);
        return [];
      }
      
      return data || [];
    },
    staleTime: 60000, // Cache results for 60s
    enabled: !searchTerm, // Keep as is as this should evaluate to boolean
  });

  // Better filtering for games that prioritizes search results
  const getFilteredGames = () => {
    // If search term is entered, prioritize IGDB search results
    if (searchTerm && searchTerm.trim().length > 0) {
      if (igdbGames?.length) {
        // Return more results for a better browsing experience - up to 10 instead of 8
        console.log('Returning IGDB search results:', igdbGames.slice(0, 10));
        return igdbGames.slice(0, 10);
      } else {
        // If no IGDB results but we have a search term, return empty
        console.log('No IGDB results found for search term');
        return [];
      }
    } 
    // If no search term, show top games
    else if (topGames?.length) {
      console.log('Returning top games from database:', topGames);
      // Show more top games for better browsing experience
      return topGames.slice(0, 8); // Show more top games (increased from 6)
    }
    
    // Return empty array if no games available
    return [];
  };

  // Define displayable games with proper empty handling
  const displayGames = getFilteredGames();
  
  // Get the appropriate streamers data based on search state
  const displayStreamers = searchTerm 
    ? (streamersSearchData || []).slice(0, 5)  // Show more streamers in search results
    : (topStreamersData || []).slice(0, 5);
  
  // Combine loading states for better UI feedback
  const isGamesLoading = gamesLoading || (searchTerm ? (igdbGamesLoading) : topGamesLoading);
  const isStreamersLoading = streamersLoading || (searchTerm ? (streamersSearchLoading) : topStreamersLoading);

  // Debug logging for search functionality
  useEffect(() => {
    console.log('Search state:', { 
      term: searchTerm, 
      igdbGamesCount: igdbGames?.length || 0,
      topGamesCount: topGames?.length || 0,
      displayGamesCount: displayGames?.length || 0,
      igdbGamesLoading,
      topGamesLoading,
      streamersSearchLoading,
      topStreamersLoading,
      isGamesLoading,
      isStreamersLoading
    });
  }, [searchTerm, igdbGames, topGames, displayGames, igdbGamesLoading, topGamesLoading, streamersSearchLoading, topStreamersLoading, isGamesLoading, isStreamersLoading]);

  // Search functions
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    console.log('Search input changed:', value);
    
    // Immediately start showing loading state for better UX
    if (value.trim().length > 0) {
      setGamesLoading(true);
      setStreamersLoading(true);
    } else {
      // Reset loading states if search is cleared
      setGamesLoading(false);
      setStreamersLoading(false);
    }
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set a new timeout for debounce
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim().length > 0) {
        console.log('Invalidating queries for search:', value);
        // Force a refetch by invalidating the queries
        queryClient.invalidateQueries({ 
          queryKey: ['igdb', 'games', 'search'],
          refetchType: 'all'
        });
        queryClient.invalidateQueries({ 
          queryKey: ['streamers', 'search'],
          refetchType: 'all'
        });
      } else {
        // If search term is empty, invalidate the top games and streamers queries
        console.log('Invalidating top queries for empty search');
        queryClient.invalidateQueries({ queryKey: ['games', 'top-searched'] });
        queryClient.invalidateQueries({ queryKey: ['streamers', 'top'] });
      }
      
      // Reset loading states after a short delay
      setTimeout(() => {
        setGamesLoading(false);
        setStreamersLoading(false);
      }, 300);
    }, 300); // Debounce for 300ms
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim().length > 0) {
      console.log('Search submitted:', searchTerm);
      // Invalidate queries to force a refresh
      queryClient.invalidateQueries({ 
        queryKey: ['igdb', 'games', 'search'], 
        refetchType: 'all'
      });
      // Trigger loading state
      setGamesLoading(true);
      
      // Reset loading state after a short delay
      setTimeout(() => {
        setGamesLoading(false);
      }, 1000);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    queryClient.invalidateQueries(['topGames']);
    queryClient.invalidateQueries(['topStreamers']);
    
    // Focus the search input after clearing
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    
    // Reset loading states
    setGamesLoading(false);
    setStreamersLoading(false);
  };

  // Format cover URL for IGDB games
  const formatCoverUrl = (game: any) => {
    if (!game) return '/img/games/default.jpg';
    
    try {
      // Handle IGDB game
      if (game.cover?.url) {
        // Make sure the URL uses https and is formatted correctly
        let url = game.cover.url;
        
        // Fix common URL issues
        if (url.startsWith('//')) {
          url = 'https:' + url;
        } else if (!url.startsWith('http')) {
          url = 'https://' + url;
        }
        
        // Make sure we're using the right size image
        if (!url.includes('t_cover_big')) {
          url = url.replace(/t_[a-z_]+/, 't_cover_big');
        }
        
        return url;
      }
      
      // Handle database game
      if (game.cover_url) {
        return game.cover_url;
      }
    } catch (error) {
      console.error('Error formatting cover URL:', error);
    }
    
    return '/img/games/default.jpg';
  };

  // Navigate to game page when a game is clicked
  const handleGameClick = (game: any) => {
    console.log('Game clicked:', game);
    if (game && game.id) {
      // Navigate to the Game Streamers page for the selected game
      navigate(`/game/${game.id}?name=${encodeURIComponent(game.name || '')}`);
    }
  };

  // Update streamer click handler with animation
  const handleStreamerClick = (username: string) => {
    // Create a smooth transition by animating the click
    const streamerElement = document.getElementById(`streamer-${username}`);
    if (streamerElement) {
      streamerElement.classList.add('scale-95', 'opacity-75');
      setTimeout(() => {
        streamerElement.classList.remove('scale-95', 'opacity-75');
      }, 150);
    }
    
    // Navigate after a short delay for better UX
    setTimeout(() => {
      navigate(`/profile/${username}`);
    }, 200);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-950 to-blue-900 text-white">
      {/* Hero section with animated gradient and search bar */}
      <div className="relative bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800 py-12 px-4">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:32px_32px]"></div>
        
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-radial from-blue-500/20 to-transparent blur-xl"></div>
          <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-radial from-blue-400/10 to-transparent blur-xl"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-yellow-300 mb-2 tracking-wider flex items-center justify-center gap-3">
            <Star className="h-6 w-6 md:h-8 md:w-8 text-yellow-300 animate-pulse" />
            EXPLORE
            <Star className="h-6 w-6 md:h-8 md:w-8 text-yellow-300 animate-pulse" />
          </h1>
          <p className="text-sm md:text-base text-blue-300 mt-2 tracking-wide">DISCOVER AMAZING GAMES & STREAMERS</p>
        </div>
      </div>

      {/* Main content area */}
      <div className="container px-4 pt-6 pb-20 mx-auto relative z-10">
        <BackButton className="mb-4" />

        {/* Search form with refined UI */}
        <div className="mb-8">
          <form onSubmit={handleSearchSubmit} className="space-y-2" ref={searchContainerRef}>
            <div
              className={`bg-blue-950/60 rounded-md flex items-center px-4 py-3 gap-2 transition-all duration-300 border-2 ${
                isSearchFocused
                  ? searchTerm.trim() 
                    ? 'border-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.3)]' 
                    : 'border-blue-500'
                  : 'border-blue-800'
              }`}
            >
              <Search className={`h-5 w-5 ${isSearchFocused ? 'text-yellow-300' : 'text-blue-500'} transition-colors duration-300`} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search games & streamers..."
                className="flex-1 bg-transparent outline-none border-none focus:ring-0 text-sm text-yellow-300 placeholder:text-blue-500"
                value={searchTerm}
                onChange={handleSearch}
                onFocus={() => setIsSearchFocused(true)}
              />
              {searchTerm ? (
                <button
                  className="text-blue-400 hover:text-yellow-300 transition-colors"
                  onClick={clearSearch}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </form>
        </div>

        {/* Content */}
        <div className="pt-6 pb-16 max-w-4xl mx-auto px-4 md:px-8">
          <div className="flex justify-center mb-6">
            <h1 className="text-xl md:text-3xl text-yellow-300 font-['Press_Start_2P',monospace] text-center relative">
              {searchTerm ? "SEARCH RESULTS" : "TOP CHARTS"}
              <span className="absolute -top-6 -right-8 hidden md:block">
                <Ghost className="h-6 w-6 text-pink-500" />
              </span>
            </h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {/* Only show Games if category is All or Games */}
            <div className="mb-10">
              <h2 className="flex items-center text-lg text-yellow-300 font-bold mb-4 gap-2">
                <Gamepad2 className="h-5 w-5" />
                {searchTerm ? 'GAME RESULTS' : 'TRENDING GAMES'}
              </h2>
              
              {/* Loading state */}
              {(gamesLoading || igdbGamesLoading || topGamesLoading) && (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-yellow-300 rounded-full"></div>
                </div>
              )}
              
              {/* Error state with retry button */}
              {!gamesLoading && !igdbGamesLoading && !topGamesLoading && getFilteredGames().length === 0 && (
                <div className="bg-blue-950/60 rounded-md p-8 text-center">
                  <SearchX className="h-12 w-12 mx-auto text-blue-500 mb-3" />
                  <p className="text-blue-300 text-sm">
                    {(igdbGamesError || topGamesError) 
                      ? "An error occurred while fetching games." 
                      : searchTerm 
                        ? `No games found matching "${searchTerm}"`
                        : "No trending games available right now."}
                  </p>
                  <p className="text-blue-400 text-xs mt-2">
                    {(igdbGamesError || topGamesError)
                      ? "Please try again later."
                      : searchTerm 
                        ? "Try a different search term or category."
                        : "Check back later for the latest games."}
                  </p>
                  
                  {/* Retry button */}
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => refetchIgdbGames()}
                    className="mt-4 bg-blue-900/50 border-blue-700 hover:bg-blue-800/60"
                  >
                    Refresh
                  </Button>
                </div>
              )}
              
              {/* Games list in simplified leaderboard format - names only */}
              {!gamesLoading && !igdbGamesLoading && !topGamesLoading && getFilteredGames().length > 0 && (
                <div className="bg-blue-950/60 rounded-lg overflow-hidden border-2 border-blue-800">
                  {/* Leaderboard header */}
                  <div className="grid grid-cols-8 bg-blue-900/80 p-2 border-b-2 border-blue-700">
                    <div className="col-span-1 text-blue-300 text-xs font-bold text-center">#</div>
                    <div className="col-span-2 text-blue-300 text-xs font-bold text-center">Cover</div>
                    <div className="col-span-5 text-blue-300 text-xs font-bold">Name</div>
                  </div>
                  
                  {/* Games rows - improved with rank, cover image and name */}
                  {getFilteredGames().map((game, index) => (
                    <div 
                      key={game.id}
                      onClick={() => handleGameClick(game)}
                      className={`grid grid-cols-8 items-center p-3 cursor-pointer hover:bg-blue-900/40 transition-all ${
                        index < getFilteredGames().length - 1 ? 'border-b border-blue-800/50' : ''
                      }`}
                    >
                      {/* Rank */}
                      <div className="col-span-1 text-center">
                        <div className={`
                          w-7 h-7 flex items-center justify-center rounded-full mx-auto
                          ${index === 0 ? 'bg-yellow-500 text-black' : 
                            index === 1 ? 'bg-gray-300 text-black' : 
                            index === 2 ? 'bg-amber-700 text-white' : 'bg-blue-800 text-blue-300'}
                        `}>
                          <span className="text-xs font-bold">{index + 1}</span>
                        </div>
                      </div>
                      
                      {/* Game cover */}
                      <div className="col-span-2 flex justify-center">
                        <div className="w-12 h-16 bg-blue-900/50 rounded overflow-hidden border border-blue-700 shadow-inner">
                          <img 
                            src={formatCoverUrl(game)} 
                            alt={`${game.name} cover`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null; // Prevent infinite callback loop
                              target.src = '/img/games/default.jpg';
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Game name and details */}
                      <div className="col-span-5 overflow-hidden pl-2">
                        <h3 className="text-sm text-yellow-300 truncate font-semibold">{game.name}</h3>
                        {game.genres && game.genres.length > 0 && (
                          <p className="text-xs text-blue-300 truncate">
                            {game.genres.slice(0, 2).map(g => g.name).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Only show Streamers if category is All or Streamers */}
            <div className="mb-10">
              <h2 className="flex items-center text-lg text-yellow-300 font-bold mb-4 gap-2">
                <Trophy className="h-5 w-5" />
                {searchTerm ? 'STREAMER RESULTS' : 'TOP STREAMERS'}
              </h2>
              
              {/* Loading state */}
              {(streamersLoading || topStreamersLoading) && (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-yellow-300 rounded-full"></div>
                </div>
              )}
              
              {/* Error or empty state */}
              {!streamersLoading && !topStreamersLoading && displayStreamers.length === 0 && (
                <div className="bg-blue-950/60 rounded-md p-8 text-center">
                  <SearchX className="h-12 w-12 mx-auto text-blue-500 mb-3" />
                  <p className="text-blue-300 text-sm">
                    {(streamersSearchError || topStreamersError) 
                      ? "An error occurred while fetching streamers." 
                      : searchTerm 
                        ? `No streamers found matching "${searchTerm}"`
                        : "No streamers available right now."}
                  </p>
                  <p className="text-blue-400 text-xs mt-2">
                    {(streamersSearchError || topStreamersError)
                      ? "Please try again later."
                      : searchTerm 
                        ? "Try a different search term or category."
                        : "Check back later for the latest streamers."}
                  </p>
                  
                  {/* Retry button */}
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => refetchStreamers()}
                    className="mt-4 bg-blue-900/50 border-blue-700 hover:bg-blue-800/60"
                  >
                    Refresh
                  </Button>
                </div>
              )}
              
              {/* Streamers list with simplified leaderboard styling - names only */}
              {!streamersLoading && !topStreamersLoading && displayStreamers.length > 0 && (
                <div className="bg-blue-950/60 rounded-lg overflow-hidden border-2 border-blue-800">
                  {/* Leaderboard header */}
                  <div className="grid grid-cols-6 bg-blue-900/80 p-2 border-b-2 border-blue-700">
                    <div className="col-span-1 text-blue-300 text-xs font-bold text-center">#</div>
                    <div className="col-span-5 text-blue-300 text-xs font-bold">Name</div>
                  </div>
                  
                  {/* Leaderboard rows - simplified with only rank and name */}
                  {displayStreamers.map((streamer, index) => (
                    <div 
                      key={streamer.id}
                      onClick={() => handleStreamerClick(streamer.username)}
                      className={`grid grid-cols-6 items-center p-3 cursor-pointer hover:bg-blue-900/40 transition-all ${
                        index < displayStreamers.length - 1 ? 'border-b border-blue-800/50' : ''
                      }`}
                    >
                      {/* Rank */}
                      <div className="col-span-1 text-center">
                        <div className={`
                          w-7 h-7 flex items-center justify-center rounded-full mx-auto
                          ${index === 0 ? 'bg-yellow-500 text-black' : 
                            index === 1 ? 'bg-gray-300 text-black' : 
                            index === 2 ? 'bg-amber-700 text-white' : 'bg-blue-800 text-blue-300'}
                        `}>
                          <span className="text-xs font-bold">{index + 1}</span>
                        </div>
                      </div>
                      
                      {/* Streamer name */}
                      <div className="col-span-5 overflow-hidden">
                        <h3 className="text-sm text-yellow-300 truncate font-semibold">{streamer.username || streamer.display_name}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pixel Pac-Man Animation - Hide on smaller screens */}
          <div className="mt-16 flex justify-center hidden md:flex">
            <div className="relative w-24 h-24">
              <div className="absolute top-0 left-0 w-12 h-12 bg-yellow-300 rounded-full animate-bounce"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-red-500 rounded-full animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 bg-blue-500 rounded-full animate-ping"></div>
              <div className="absolute top-0 right-0 w-8 h-8 bg-pink-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default RetroSearchPage;
