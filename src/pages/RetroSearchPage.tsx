import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Search, X, Ghost, Trophy, Gamepad2, Users, Sparkles, Star, SearchX } from 'lucide-react';
import { igdbService } from '@/services/igdbService';
import { BackButton } from '@/components/ui/back-button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const RetroSearchPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchCategory, setSearchCategory] = useState<'all' | 'games' | 'streamers'>('all');
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
  const { data: igdbGames, isLoading: igdbGamesLoading } = useQuery({
    queryKey: ['igdb', 'games', 'search', searchTerm || ''],
    queryFn: async () => {
      console.log('IGDB Query executing for search term:', searchTerm);
      
      // Don't search if search term is too short but not empty
      if (searchTerm && searchTerm.length < 2) {
        console.log('Search term too short, returning empty results');
        return [];
      }

      if (searchTerm) {
        try {
          console.log('Calling IGDB API for search term:', searchTerm);
          const games = await igdbService.searchGames(searchTerm, {
            sort: 'rating desc',
            limit: 20
          });
          
          console.log('IGDB API returned games:', games.length);
          
          if (games && games.length > 0) {
            return games.slice(0, 3);
          }
          
          return [];
        } catch (error) {
          console.error('IGDB search error:', error);
          return [];
        }
      } else {
        try {
          console.log('Fetching popular IGDB games for empty search');
          const popularGames = await igdbService.getPopularGames();
          
          if (popularGames && popularGames.length > 0) {
            return popularGames.slice(0, 3);
          }
          
          return [];
        } catch (error) {
          console.error('IGDB popular games error:', error);
          return [];
        }
      }
    },
    enabled: searchCategory === 'all' || searchCategory === 'games',
    staleTime: 30000, // Cache for 30 seconds
  });

  // Query for top games from our database (as fallback and for "top searched")
  const { data: topGames, isLoading: topGamesLoading } = useQuery({
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

  // Query for streamers when searching
  const { data: topStreamers, isLoading: streamersSearchLoading } = useQuery({
    queryKey: ['streamers', 'search', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          username,
          display_name,
          avatar_url,
          follower_count
        `);
      
      // Only filter for streamers if not searching for users
      if (!searchTerm) {
        query = query.not('streaming_url', 'is', null);
      }
      
      // Apply search filter if provided - search across username and display_name
      if (searchTerm) {
        const formattedSearchTerm = searchTerm.trim().toLowerCase();
        query = query.or(`username.ilike.%${formattedSearchTerm}%,display_name.ilike.%${formattedSearchTerm}%`);
      }
      
      const { data, error } = await query.order('follower_count', { ascending: false }).limit(3); // Only fetch top 3
      
      if (error) {
        console.error('Error fetching streamers:', error);
        throw error;
      }
      
      console.log('Found streamers for search:', searchTerm, data?.length || 0);
      return data || [];
    },
    staleTime: searchTerm ? 10000 : 60000, // Cache results for 10s when searching, 60s otherwise
    enabled: Boolean(searchTerm) && (searchCategory === 'all' || searchCategory === 'streamers'), // Fixed boolean conversion
  });
  
  // Separate query for top streamers (not search-dependent)
  const { data: topStreamersData, isLoading: topStreamersLoading } = useQuery({
    queryKey: ['streamers', 'top'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          display_name,
          avatar_url,
          follower_count
        `)
        .not('streaming_url', 'is', null)
        .order('follower_count', { ascending: false })
        .limit(3); // Only fetch top 3
      
      if (error) {
        console.error('Error fetching top streamers:', error);
        throw error;
      }
      
      return data || [];
    },
    staleTime: 60000, // Cache results for 60s
    enabled: !searchTerm || (searchCategory !== 'all' && searchCategory !== 'streamers'), // Keep as is as this should evaluate to boolean
  });

  // Get filtered games based on search term and loading state
  const getFilteredGames = () => {
    console.log('getFilteredGames called - igdbGames:', igdbGames?.length, 'topGames:', topGames?.length);
    
    // If we have search results, return them (limited to 3)
    if (searchTerm && igdbGames?.length) {
      console.log('Returning search results:', igdbGames.slice(0, 3));
      return igdbGames.slice(0, 3);
    } 
    // If not searching but we have IGDB games, return those
    else if (igdbGames?.length) {
      console.log('Returning IGDB games:', igdbGames.slice(0, 3));
      return igdbGames.slice(0, 3);
    } 
    // Fall back to top games from our database
    else if (topGames?.length) {
      console.log('Returning top games:', topGames.slice(0, 3));
      return topGames.slice(0, 3);
    }
    
    // Return empty array if no games available
    return [];
  };

  // Define displayable games with proper empty handling
  const displayGames = getFilteredGames();
  
  // Get the appropriate streamers data based on search state
  const displayStreamers = searchTerm 
    ? (topStreamers || []).slice(0, 3) 
    : (topStreamersData || []).slice(0, 3);
  
  // Combine loading states for better UI feedback
  const isGamesLoading = gamesLoading || (searchTerm ? (igdbGamesLoading && (searchCategory === 'all' || searchCategory === 'games')) : topGamesLoading);
  const isStreamersLoading = streamersLoading || (searchTerm ? (streamersSearchLoading && (searchCategory === 'all' || searchCategory === 'streamers')) : topStreamersLoading);

  // Debug logging for search functionality
  useEffect(() => {
    console.log('Search state:', { 
      term: searchTerm, 
      category: searchCategory,
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
  }, [searchTerm, searchCategory, igdbGames, topGames, displayGames, igdbGamesLoading, topGamesLoading, streamersSearchLoading, topStreamersLoading, isGamesLoading, isStreamersLoading]);

  // Search functions
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    console.log('Search input changed:', value);
    
    // Immediately start showing loading state for better UX
    if (value.trim().length > 0) {
      if (searchCategory === 'games' || searchCategory === 'all') {
        setGamesLoading(true);
      }
      if (searchCategory === 'streamers' || searchCategory === 'all') {
        setStreamersLoading(true);
      }
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
        queryClient.invalidateQueries({ queryKey: ['igdb', 'games', 'search'] });
        queryClient.invalidateQueries({ queryKey: ['streamers', 'search'] });
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

  // Tab click handler for search categories
  const handleTabClick = (category: 'all' | 'games' | 'streamers') => {
    setSearchCategory(category);
    
    // Update loading states based on the new category
    if (searchTerm.trim().length > 0) {
      if (category === 'games' || category === 'all') {
        setGamesLoading(true);
      }
      if (category === 'streamers' || category === 'all') {
        setStreamersLoading(true);
      }
      
      // Invalidate the appropriate queries for the new category
      setTimeout(() => {
        if (category === 'games' || category === 'all') {
          queryClient.invalidateQueries(['igdb', 'games', 'search', searchTerm.trim()]);
        }
        if (category === 'streamers' || category === 'all') {
          queryClient.invalidateQueries(['streamers', 'search', searchTerm.trim()]);
        }
        
        // Reset loading states after a short delay
        setTimeout(() => {
          setGamesLoading(false);
          setStreamersLoading(false);
        }, 300);
      }, 0);
    }
  };

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search submitted with term:', searchTerm);
    
    // Explicitly trigger the search by invalidating queries
    if (searchTerm.trim().length > 0) {
      console.log('Invalidating query caches to force refetch');
      
      if (searchCategory === 'games' || searchCategory === 'all') {
        queryClient.invalidateQueries({ 
          queryKey: ['igdb', 'games', 'search'],
          refetchType: 'all'
        });
      }
      
      if (searchCategory === 'streamers' || searchCategory === 'all') {
        queryClient.invalidateQueries({ 
          queryKey: ['streamers', 'search'],
          refetchType: 'all'
        });
      }
      
      // Blur input to hide keyboard on mobile
      if (searchInputRef.current) {
        searchInputRef.current.blur();
      }
    }
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
          
          {/* Category selector */}
          <div className="flex justify-center gap-4 mt-4">
            <button 
              className={`px-3 py-1 text-xs rounded-sm border ${searchCategory === 'all' ? 'bg-yellow-500 text-black border-yellow-300' : 'bg-transparent text-yellow-300 border-blue-600'}`}
              onClick={() => handleTabClick('all')}
            >
              ALL
            </button>
            <button 
              className={`px-3 py-1 text-xs rounded-sm border ${searchCategory === 'games' ? 'bg-yellow-500 text-black border-yellow-300' : 'bg-transparent text-yellow-300 border-blue-600'}`}
              onClick={() => handleTabClick('games')}
            >
              GAMES
            </button>
            <button 
              className={`px-3 py-1 text-xs rounded-sm border ${searchCategory === 'streamers' ? 'bg-yellow-500 text-black border-yellow-300' : 'bg-transparent text-yellow-300 border-blue-600'}`}
              onClick={() => handleTabClick('streamers')}
            >
              STREAMERS
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="container px-4 pt-6 pb-20 mx-auto relative z-10">
        <BackButton className="mb-4" />

        {/* Search form with refined UI */}
        <div className="mb-8">
          <form onSubmit={handleSubmitSearch} className="space-y-2" ref={searchContainerRef}>
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
            {(searchCategory === 'all' || searchCategory === 'games') && (
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
                
                {/* Error or empty state */}
                {!gamesLoading && !igdbGamesLoading && !topGamesLoading && getFilteredGames().length === 0 && (
                  <div className="bg-blue-950/60 rounded-md p-8 text-center">
                    <SearchX className="h-12 w-12 mx-auto text-blue-500 mb-3" />
                    <p className="text-blue-300 text-sm">No games found.</p>
                    <p className="text-blue-400 text-xs mt-2">Try a different search term or category.</p>
                  </div>
                )}
                
                {/* Games grid in cube format - as mentioned in memory */}
                {!gamesLoading && !igdbGamesLoading && !topGamesLoading && getFilteredGames().length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {getFilteredGames().map((game, index) => (
                      <div 
                        key={game.id}
                        onClick={() => handleGameClick(game)}
                        className="bg-blue-950/60 rounded-md overflow-hidden hover:bg-blue-900/60 transition-all cursor-pointer group border-2 border-blue-800 hover:border-yellow-300 shadow-lg hover:shadow-yellow-900/20"
                      >
                        <div className="aspect-square relative overflow-hidden">
                          {/* Game cover */}
                          {game.cover?.url ? (
                            <img
                              src={formatCoverUrl(game.cover.url)}
                              alt={game.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-800/30">
                              <Ghost className="h-12 w-12 text-blue-500" />
                            </div>
                          )}
                          
                          {/* Rank indicator for top games */}
                          {!searchTerm && (
                            <div className="absolute top-2 left-2 bg-blue-800/80 backdrop-blur text-yellow-300 p-1 rounded-md text-xs font-bold">
                              #{index + 1}
                            </div>
                          )}
                        </div>
                        
                        <div className="p-3">
                          <h3 className="font-semibold text-sm truncate group-hover:text-yellow-300">{game.name}</h3>
                          <div className="flex items-center gap-1 mt-1">
                            <Trophy className="h-3 w-3 text-blue-500" />
                            <span className="text-[10px] text-blue-400">
                              {game.rating ? `${Math.round(game.rating)}%` : 'Unrated'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Only show Streamers if category is All or Streamers */}
            {(searchCategory === 'all' || searchCategory === 'streamers') && (
              <div className="mb-10">
                <h2 className="flex items-center text-lg text-yellow-300 font-bold mb-4 gap-2">
                  <Trophy className="h-5 w-5" />
                  {searchTerm ? 'STREAMER RESULTS' : 'TOP STREAMERS LEADERBOARD'}
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
                    <p className="text-blue-300 text-sm">No streamers found.</p>
                    <p className="text-blue-400 text-xs mt-2">Try a different search term or category.</p>
                  </div>
                )}
                
                {/* Streamers list with leaderboard styling */}
                {!streamersLoading && !topStreamersLoading && displayStreamers.length > 0 && (
                  <div className="bg-blue-950/60 rounded-lg overflow-hidden border-2 border-blue-800">
                    {/* Leaderboard header */}
                    <div className="grid grid-cols-8 bg-blue-900/80 p-2 border-b-2 border-blue-700">
                      <div className="col-span-1 text-blue-300 text-xs font-bold text-center">#</div>
                      <div className="col-span-2 text-blue-300 text-xs font-bold text-center">Avatar</div>
                      <div className="col-span-4 text-blue-300 text-xs font-bold">Streamer Name</div>
                      <div className="col-span-1 text-blue-300 text-xs font-bold text-center">Fans</div>
                    </div>
                    
                    {/* Leaderboard rows */}
                    {displayStreamers.map((streamer, index) => (
                      <div 
                        key={streamer.id}
                        onClick={() => handleStreamerClick(streamer.username)}
                        className={`grid grid-cols-8 items-center p-2 cursor-pointer hover:bg-blue-900/40 transition-all ${
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
                        
                        {/* Streamer avatar */}
                        <div className="col-span-2 flex justify-center">
                          <Avatar className="w-10 h-10 border-2 border-blue-700">
                            <AvatarImage src={streamer.avatar_url} alt={streamer.username} />
                            <AvatarFallback className="bg-blue-800 text-white">
                              {streamer.username?.substring(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        
                        {/* Streamer name */}
                        <div className="col-span-4 overflow-hidden">
                          <h3 className="text-sm text-yellow-300 truncate">{streamer.username || streamer.full_name}</h3>
                        </div>
                        
                        {/* Fans/Followers */}
                        <div className="col-span-1 text-center">
                          <div className="text-xs font-mono bg-blue-800/50 rounded py-1 px-2 inline-block">
                            {streamer.followers_count || '??'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
