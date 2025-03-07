import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Search, X, Ghost, Trophy, Gamepad2, Users, Sparkles, Star, SearchX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { BackButton } from '@/components/ui/back-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { igdbService } from '@/services/igdbService';

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

  // Query for games based on search term using IGDB API with backup local data
  const { data: igdbGames, isLoading: igdbGamesLoading } = useQuery({
    queryKey: ['igdb', 'games', 'search', searchTerm],
    queryFn: async () => {
      console.log('Searching for games with term:', searchTerm);
      
      // Mock data for popular games when API fails - limit to exactly 3
      const mockPopularGames = [
        {
          id: 1942,
          name: 'The Last of Us Part II',
          cover: {
            id: 101,
            url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r0o.jpg'
          }
        },
        {
          id: 1877,
          name: 'Cyberpunk 2077',
          cover: {
            id: 102,
            url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4hk8.jpg'
          }
        },
        {
          id: 732,
          name: 'Grand Theft Auto V',
          cover: {
            id: 103,
            url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1l8z.jpg'
          }
        }
      ];
      
      // Mock data for search results
      const getMockSearchResults = (term: string) => {
        const searchTermLower = term.toLowerCase();
        return mockPopularGames.filter(game => 
          game.name.toLowerCase().includes(searchTermLower)
        );
      };
      
      try {
        // Don't search if search term is too short but not empty
        if (searchTerm.length < 2 && searchTerm.length > 0) return [];
        
        if (searchTerm) {
          console.log('Using IGDB search for term:', searchTerm);
          try {
            // First try the API
            const games = await igdbService.searchGames(searchTerm, {
              sort: 'rating desc',
              limit: 20
            });
            
            console.log('IGDB API returned games:', games);
            
            // If API returns results, use them (limited to 3)
            if (games && games.length > 0) {
              return games.slice(0, 3).map(game => ({ id: game.id, name: game.name, cover: game.cover }));
            }
            
            // Fallback to mock data if API returns no results
            console.log('IGDB API returned no results, using mock data');
            return getMockSearchResults(searchTerm);
          } catch (apiError) {
            // If API fails, use local mock data
            console.error('IGDB API search failed:', apiError);
            return getMockSearchResults(searchTerm);
          }
        } else {
          // For initial load or empty search, use popular games
          console.log('Fetching popular IGDB games');
          try {
            const popularGames = await igdbService.getPopularGames();
            
            // If we got results, use them (limited to 3)
            if (popularGames && popularGames.length > 0) {
              return popularGames.slice(0, 3).map(game => ({ id: game.id, name: game.name, cover: game.cover }));
            }
            
            // Fallback to mock data
            console.log('IGDB API returned no popular games, using mock data');
            return mockPopularGames;
          } catch (apiError) {
            // If API fails, use mock data
            console.error('IGDB API popular games failed:', apiError);
            return mockPopularGames;
          }
        }
      } catch (error) {
        console.error('Overall error in game search:', error);
        return searchTerm ? getMockSearchResults(searchTerm) : mockPopularGames;
      }
    },
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
    enabled: searchTerm && (searchCategory === 'all' || searchCategory === 'streamers'), // Only enabled for appropriate categories
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
    enabled: !searchTerm || (searchCategory !== 'all' && searchCategory !== 'streamers'), // Only run when not searching or when not in the correct category
  });

  // Process the search results with better handling
  const getFilteredGames = () => {
    if (searchTerm && igdbGames?.length) {
      // When searching, use IGDB results - strictly limit to 3
      return (igdbGames || []).slice(0, 3);
    } else if (igdbGames?.length) {
      // When not searching but have IGDB results - strictly limit to 3
      return (igdbGames || []).slice(0, 3);
    } else if (topGames?.length) {
      // Fallback to top games - strictly limit to 3
      return (topGames || []).slice(0, 3);
    }
    // Default empty array
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
        // If search term is not empty, invalidate queries to refresh data
        if (searchCategory === 'games' || searchCategory === 'all') {
          // Use the correct query keys that match the ones defined above
          queryClient.invalidateQueries(['igdb', 'games', 'search', value.trim()]);
        }
        if (searchCategory === 'streamers' || searchCategory === 'all') {
          queryClient.invalidateQueries(['streamers', 'search', value.trim()]);
        }
      } else {
        // If search term is empty, invalidate the top games and streamers queries
        console.log('Invalidating top queries for empty search');
        queryClient.invalidateQueries(['games', 'top-searched']);
        queryClient.invalidateQueries(['streamers', 'top']);
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
    
    if (searchTerm.trim().length === 0) {
      return;
    }
    
    // Create a smooth transition by showing loading state
    if (searchCategory === 'games' || searchCategory === 'all') {
      setGamesLoading(true);
    }
    if (searchCategory === 'streamers' || searchCategory === 'all') {
      setStreamersLoading(true);
    }
    
    // Invalidate queries to force refresh
    if (searchCategory === 'games' || searchCategory === 'all') {
      queryClient.invalidateQueries(['igdb', 'games', 'search', searchTerm.trim()]);
    }
    if (searchCategory === 'streamers' || searchCategory === 'all') {
      queryClient.invalidateQueries(['streamers', 'search', searchTerm.trim()]);
    }
    
    // Small delay before navigating to improve perceived UX
    setTimeout(() => {
      // Blur the search input to hide keyboard on mobile
      if (searchInputRef.current) {
        searchInputRef.current.blur();
      }
    }, 200);
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

  // Update game click handler to improve user experience
  const handleGameClick = (game: any) => {
    // Create a smooth transition by animating the click
    const gameElement = document.getElementById(`game-${game.id}`);
    if (gameElement) {
      gameElement.classList.add('scale-95', 'opacity-75');
      setTimeout(() => {
        gameElement.classList.remove('scale-95', 'opacity-75');
      }, 150);
    }
    
    // Navigate after a short delay for better UX
    setTimeout(() => {
      // For IGDB games, first check if we have this game in our database
      if (game.id && typeof game.id === 'number') {
        // This is an IGDB game, we should navigate using the IGDB ID
        navigate(`/game/${game.id}`);
      } else {
        // This is a database game
        navigate(`/games/${game.id}`);
      }
    }, 200);
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
    <div className="min-h-screen bg-black text-yellow-300 font-['Press_Start_2P',monospace] overflow-hidden">
      {/* Pac-Man maze border */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-4 bg-blue-600 flex">
          <div className="w-full h-full border-b-8 border-dotted border-white opacity-70"></div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-blue-600 flex">
          <div className="w-full h-full border-t-8 border-dotted border-white opacity-70"></div>
        </div>
        <div className="absolute top-4 left-0 bottom-4 w-4 bg-blue-600 flex">
          <div className="w-full h-full border-r-8 border-dotted border-white opacity-70"></div>
        </div>
        <div className="absolute top-4 right-0 bottom-4 w-4 bg-blue-600 flex">
          <div className="w-full h-full border-l-8 border-dotted border-white opacity-70"></div>
        </div>
      </div>

      {/* Cool Explore Header */}
      <div className="pt-8 pb-4 bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 border-b-4 border-yellow-500">
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

      {/* Search header */}
      <div className="container px-4 pt-16 pb-20 mx-auto relative z-10">
        <BackButton className="mb-4" />

        {/* Stylish Explore header with animated stars */}
        <div className="mb-6 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg opacity-40"></div>
          <div className="absolute -top-2 -left-2 animate-pulse">
            <Star className="h-5 w-5 text-yellow-300" />
          </div>
          <div className="absolute -top-1 -right-2 animate-pulse delay-75">
            <Star className="h-4 w-4 text-yellow-300" />
          </div>
          <div className="absolute bottom-0 left-1/4 animate-pulse delay-150">
            <Star className="h-3 w-3 text-yellow-300" />
          </div>
          <div className="absolute bottom-2 right-1/4 animate-pulse delay-300">
            <Sparkles className="h-4 w-4 text-yellow-300" />
          </div>
          <div className="py-4 px-2 relative">
            <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-100">
              EXPLORE
            </h1>
            <p className="text-xs text-blue-300 mt-1">Discover games & streamers</p>
          </div>
        </div>

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

            {/* Updated category tabs with better visual feedback */}
            <div className="flex justify-center gap-2 mt-3 bg-blue-950/50 p-2 rounded-md border border-blue-800">
              <button
                type="button"
                className={`flex items-center gap-1 text-[10px] px-3 py-1.5 rounded-md transition-all duration-200 ${
                  searchCategory === 'all'
                    ? 'bg-blue-700 text-yellow-300 shadow-[0_0_8px_rgba(29,78,216,0.3)]'
                    : 'hover:bg-blue-800/70 text-blue-400'
                }`}
                onClick={() => handleTabClick('all')}
              >
                <Gamepad2 className="h-3 w-3" />
                ALL
              </button>
              <button
                type="button"
                className={`flex items-center gap-1 text-[10px] px-3 py-1.5 rounded-md transition-all duration-200 ${
                  searchCategory === 'games'
                    ? 'bg-blue-700 text-yellow-300 shadow-[0_0_8px_rgba(29,78,216,0.3)]'
                    : 'hover:bg-blue-800/70 text-blue-400'
                }`}
                onClick={() => handleTabClick('games')}
              >
                <Gamepad2 className="h-3 w-3" />
                GAMES
              </button>
              <button
                type="button"
                className={`flex items-center gap-1 text-[10px] px-3 py-1.5 rounded-md transition-all duration-200 ${
                  searchCategory === 'streamers'
                    ? 'bg-blue-700 text-yellow-300 shadow-[0_0_8px_rgba(29,78,216,0.3)]'
                    : 'hover:bg-blue-800/70 text-blue-400'
                }`}
                onClick={() => handleTabClick('streamers')}
              >
                <Users className="h-3 w-3" />
                STREAMERS
              </button>
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
              <div className="bg-blue-950/30 border-4 border-blue-600 p-4">
                <div className="flex items-center gap-2 mb-4 border-b-4 border-blue-600 pb-2">
                  <Gamepad2 className="h-5 w-5 text-yellow-300" />
                  <h2 className="text-sm md:text-lg text-yellow-300">
                    {searchTerm ? "GAMES" : "TOP GAMES"}
                  </h2>
                </div>
                
                <div className="space-y-2">
                  {/* Show loading skeleton */}
                  {isGamesLoading && (
                    <>
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-2 border-b border-dotted border-blue-600/50">
                          <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-600/50 animate-pulse"></div>
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600/50 animate-pulse"></div>
                          <div className="flex-1 h-6 bg-blue-600/50 animate-pulse"></div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* No games found state with improved styling */}
                  {!isGamesLoading && (!displayGames || displayGames.length === 0) && (
                    <div className="py-8 px-4 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-900/50 mb-4">
                        <SearchX className="h-6 w-6 text-yellow-300" />
                      </div>
                      <p className="text-yellow-500 text-xs md:text-sm font-bold mb-1">NO GAMES FOUND</p>
                      <p className="text-blue-400 text-xs">
                        {searchTerm 
                          ? "Try a different search term or category"
                          : "Check back later for top games"}
                      </p>
                    </div>
                  )}
                  
                  {/* First game (index 0) */}
                  {!isGamesLoading && displayGames && displayGames.length > 0 && (
                    <div 
                      id={`game-${displayGames[0].id}`}
                      key={displayGames[0].id}
                      className="flex items-center gap-3 p-2 hover:bg-blue-900/40 cursor-pointer border-b border-dotted border-blue-600/50 transition-all duration-150"
                      onClick={() => handleGameClick(displayGames[0])}
                    >
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-600 flex items-center justify-center text-yellow-300 font-bold text-xs md:text-sm">
                        1
                      </div>
                      <div className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0 relative">
                        <div className="absolute inset-0 border-2 border-yellow-300"></div>
                        <img 
                          src={formatCoverUrl(displayGames[0])} 
                          alt={displayGames[0].name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/img/games/default.jpg';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-yellow-300 text-xs block truncate">
                          {displayGames[0].name}
                        </span>
                      </div>
                      {!searchTerm && (
                        <div className="text-yellow-300 hidden md:block">
                          <Trophy className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Second game (index 1) */}
                  {!isGamesLoading && displayGames && displayGames.length > 1 && (
                    <div 
                      id={`game-${displayGames[1].id}`}
                      key={displayGames[1].id}
                      className="flex items-center gap-3 p-2 hover:bg-blue-900/40 cursor-pointer border-b border-dotted border-blue-600/50 transition-all duration-150"
                      onClick={() => handleGameClick(displayGames[1])}
                    >
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-600 flex items-center justify-center text-yellow-300 font-bold text-xs md:text-sm">
                        2
                      </div>
                      <div className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0 relative">
                        <div className="absolute inset-0 border-2 border-yellow-300"></div>
                        <img 
                          src={formatCoverUrl(displayGames[1])} 
                          alt={displayGames[1].name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/img/games/default.jpg';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-yellow-300 text-xs block truncate">
                          {displayGames[1].name}
                        </span>
                      </div>
                      {!searchTerm && (
                        <div className="text-yellow-300 hidden md:block">
                          <Trophy className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Third game (index 2) */}
                  {!isGamesLoading && displayGames && displayGames.length > 2 && (
                    <div 
                      id={`game-${displayGames[2].id}`}
                      key={displayGames[2].id}
                      className="flex items-center gap-3 p-2 hover:bg-blue-900/40 cursor-pointer border-b border-dotted border-blue-600/50 transition-all duration-150"
                      onClick={() => handleGameClick(displayGames[2])}
                    >
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-600 flex items-center justify-center text-yellow-300 font-bold text-xs md:text-sm">
                        3
                      </div>
                      <div className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0 relative">
                        <div className="absolute inset-0 border-2 border-yellow-300"></div>
                        <img 
                          src={formatCoverUrl(displayGames[2])} 
                          alt={displayGames[2].name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/img/games/default.jpg';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-yellow-300 text-xs block truncate">
                          {displayGames[2].name}
                        </span>
                      </div>
                      {!searchTerm && (
                        <div className="text-yellow-300 hidden md:block">
                          <Trophy className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Only show Streamers if category is All or Streamers */}
            {(searchCategory === 'all' || searchCategory === 'streamers') && (
              <div className="bg-blue-950/30 border-4 border-blue-600 p-4">
                <div className="flex items-center gap-2 mb-4 border-b-4 border-blue-600 pb-2">
                  <Users className="h-5 w-5 text-yellow-300" />
                  <h2 className="text-sm md:text-lg text-yellow-300">
                    {searchTerm ? "STREAMERS" : "TOP STREAMERS"}
                  </h2>
                </div>
                
                <div className="space-y-2">
                  {/* Loading skeleton */}
                  {isStreamersLoading && (
                    <>
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-2 border-b border-dotted border-blue-600/50">
                          <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-600/50 animate-pulse rounded-full"></div>
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600/50 animate-pulse rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-blue-600/50 animate-pulse w-24"></div>
                            <div className="h-3 mt-1 bg-blue-600/50 animate-pulse w-16"></div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* No streamers found with improved styling */}
                  {!isStreamersLoading && (!displayStreamers || displayStreamers.length === 0) && (
                    <div className="py-8 px-4 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-900/50 mb-4">
                        <SearchX className="h-6 w-6 text-yellow-300" />
                      </div>
                      <p className="text-yellow-500 text-xs md:text-sm font-bold mb-1">NO STREAMERS FOUND</p>
                      <p className="text-blue-400 text-xs">
                        {searchTerm 
                          ? "Try a different search term or category"
                          : "Check back later for top streamers"}
                      </p>
                    </div>
                  )}
                  
                  {/* First streamer (index 0) */}
                  {!isStreamersLoading && displayStreamers && displayStreamers.length > 0 && (
                    <div 
                      id={`streamer-${displayStreamers[0].username}`}
                      key={displayStreamers[0].id}
                      className="flex items-center gap-3 p-2 hover:bg-blue-900/40 cursor-pointer border-b border-dotted border-blue-600/50 transition-all duration-150"
                      onClick={() => handleStreamerClick(displayStreamers[0].username)}
                    >
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-600 flex items-center justify-center text-yellow-300 font-bold text-xs md:text-sm">
                        1
                      </div>
                      <Avatar className="w-8 h-8 md:w-10 md:h-10 border-2 border-yellow-300">
                        <AvatarImage 
                          src={displayStreamers[0].avatar_url || ''} 
                          alt={displayStreamers[0].display_name || displayStreamers[0].username} 
                        />
                        <AvatarFallback className="bg-blue-800 text-blue-300">
                          {displayStreamers[0].display_name?.[0]?.toUpperCase() || 
                           displayStreamers[0].username?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <span className="text-yellow-300 text-xs block truncate">
                          {displayStreamers[0].display_name || displayStreamers[0].username}
                        </span>
                        <span className="text-blue-300 text-xs opacity-70 block truncate">
                          @{displayStreamers[0].username}
                        </span>
                      </div>
                      {!searchTerm && (
                        <div className="text-yellow-300 hidden md:block">
                          <Trophy className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Second streamer (index 1) */}
                  {!isStreamersLoading && displayStreamers && displayStreamers.length > 1 && (
                    <div 
                      id={`streamer-${displayStreamers[1].username}`}
                      key={displayStreamers[1].id}
                      className="flex items-center gap-3 p-2 hover:bg-blue-900/40 cursor-pointer border-b border-dotted border-blue-600/50 transition-all duration-150"
                      onClick={() => handleStreamerClick(displayStreamers[1].username)}
                    >
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-600 flex items-center justify-center text-yellow-300 font-bold text-xs md:text-sm">
                        2
                      </div>
                      <Avatar className="w-8 h-8 md:w-10 md:h-10 border-2 border-yellow-300">
                        <AvatarImage 
                          src={displayStreamers[1].avatar_url || ''} 
                          alt={displayStreamers[1].display_name || displayStreamers[1].username} 
                        />
                        <AvatarFallback className="bg-blue-800 text-blue-300">
                          {displayStreamers[1].display_name?.[0]?.toUpperCase() || 
                           displayStreamers[1].username?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <span className="text-yellow-300 text-xs block truncate">
                          {displayStreamers[1].display_name || displayStreamers[1].username}
                        </span>
                        <span className="text-blue-300 text-xs opacity-70 block truncate">
                          @{displayStreamers[1].username}
                        </span>
                      </div>
                      {!searchTerm && (
                        <div className="text-yellow-300 hidden md:block">
                          <Trophy className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Third streamer (index 2) */}
                  {!isStreamersLoading && displayStreamers && displayStreamers.length > 2 && (
                    <div 
                      id={`streamer-${displayStreamers[2].username}`}
                      key={displayStreamers[2].id}
                      className="flex items-center gap-3 p-2 hover:bg-blue-900/40 cursor-pointer border-b border-dotted border-blue-600/50 transition-all duration-150"
                      onClick={() => handleStreamerClick(displayStreamers[2].username)}
                    >
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-600 flex items-center justify-center text-yellow-300 font-bold text-xs md:text-sm">
                        3
                      </div>
                      <Avatar className="w-8 h-8 md:w-10 md:h-10 border-2 border-yellow-300">
                        <AvatarImage 
                          src={displayStreamers[2].avatar_url || ''} 
                          alt={displayStreamers[2].display_name || displayStreamers[2].username} 
                        />
                        <AvatarFallback className="bg-blue-800 text-blue-300">
                          {displayStreamers[2].display_name?.[0]?.toUpperCase() || 
                           displayStreamers[2].username?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <span className="text-yellow-300 text-xs block truncate">
                          {displayStreamers[2].display_name || displayStreamers[2].username}
                        </span>
                        <span className="text-blue-300 text-xs opacity-70 block truncate">
                          @{displayStreamers[2].username}
                        </span>
                      </div>
                      {!searchTerm && (
                        <div className="text-yellow-300 hidden md:block">
                          <Trophy className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
    </div>
  );
};

export default RetroSearchPage;
