import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Search, X, Ghost, Trophy, Gamepad2, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { BackButton } from '@/components/ui/back-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { igdbService } from '@/services/igdbService';

const RetroSearchPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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
      
      // Mock data for popular games when API fails
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
            
            // If API returns results, use them
            if (games && games.length > 0) {
              return games.map(game => ({ id: game.id, name: game.name, cover: game.cover }));
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
            
            // If we got results, use them
            if (popularGames && popularGames.length > 0) {
              return popularGames.map(game => ({ id: game.id, name: game.name, cover: game.cover }));
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
      }));
    },
  });

  // Query for top streamers
  const { data: topStreamers, isLoading: streamersLoading } = useQuery({
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
        `)
        .not('streaming_url', 'is', null);
      
      // Apply search filter if provided
      if (searchTerm) {
        query = query.or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('follower_count', { ascending: false }).limit(3); // Only fetch top 3
      
      if (error) throw error;
      return data || [];
    },
  });

  // For display purposes, combine IGDB and database games
  const displayGames = searchTerm && igdbGames?.length ? igdbGames : 
                      (igdbGames?.length ? igdbGames : topGames);
  const gamesLoading = searchTerm ? igdbGamesLoading : topGamesLoading;

  // Debug logging for search functionality
  useEffect(() => {
    console.log('Search term:', searchTerm);
    console.log('IGDB games available:', igdbGames);
    console.log('Top games from DB:', topGames);
    console.log('Games being displayed:', displayGames);
  }, [searchTerm, igdbGames, topGames, displayGames]);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle search submission
  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/discovery?q=${encodeURIComponent(searchTerm)}`);
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

  // Handle game click
  const handleGameClick = (game: any) => {
    // For IGDB games, first check if we have this game in our database
    if (game.id && typeof game.id === 'number') {
      // This is an IGDB game, we should navigate using the IGDB ID
      navigate(`/game/${game.id}`);
    } else {
      // This is a database game
      navigate(`/games/${game.id}`);
    }
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

      {/* Search header */}
      <div className="sticky top-0 z-50 p-4 bg-black/80 backdrop-blur-lg border-b-4 border-blue-600">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmitSearch} className="flex items-center gap-2">
            <BackButton className="text-yellow-300 hover:text-yellow-100" onClick={() => navigate('/discovery')} />
            <div className="relative flex-1" ref={searchContainerRef}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-yellow-300" />
              </div>
              <Input
                type="text"
                placeholder="SEARCH GAMES OR STREAMERS..."
                className="pl-10 pr-10 py-3 bg-blue-950/50 border-4 border-blue-600 text-yellow-300 placeholder:text-yellow-500/60 w-full font-['Press_Start_2P',monospace] text-xs md:text-sm"
                value={searchTerm}
                onChange={handleSearch}
                onFocus={() => setIsSearchFocused(true)}
                ref={searchInputRef}
                autoFocus
              />
              {searchTerm && (
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4 text-yellow-300" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      
      {/* Content */}
      <div className="pt-6 pb-16 max-w-4xl mx-auto px-4 md:px-8">
        <div className="flex justify-center mb-6">
          <h1 className="text-xl md:text-3xl text-yellow-300 font-['Press_Start_2P',monospace] text-center relative">
            {searchTerm ? "SEARCH RESULTS" : "HIGH SCORES"}
            <span className="absolute -top-6 -right-8 hidden md:block">
              <Ghost className="h-6 w-6 text-pink-500" />
            </span>
          </h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          {/* Top Games Leaderboard */}
          <div className="bg-blue-950/30 border-4 border-blue-600 p-4">
            <div className="flex items-center gap-2 mb-4 border-b-4 border-blue-600 pb-2">
              <Gamepad2 className="h-5 w-5 text-yellow-300" />
              <h2 className="text-sm md:text-lg text-yellow-300">
                {searchTerm ? "GAMES" : "TOP GAMES"}
              </h2>
            </div>
            
            <div className="space-y-2">
              {!gamesLoading && displayGames?.length === 0 && (
                <div className="p-3 text-center text-yellow-500 text-xs md:text-sm">
                  NO GAMES FOUND
                </div>
              )}
              
              {displayGames?.map((game, index) => (
                <div 
                  key={game.id}
                  className="flex items-center gap-3 p-2 hover:bg-blue-900/40 cursor-pointer border-b border-dotted border-blue-600/50"
                  onClick={() => handleGameClick(game)}
                >
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-600 flex items-center justify-center text-yellow-300 font-bold text-xs md:text-sm">
                    {index + 1}
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0 relative">
                    <div className="absolute inset-0 border-2 border-yellow-300"></div>
                    <img 
                      src={formatCoverUrl(game)} 
                      alt={game.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/img/games/default.jpg';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-yellow-300 text-xs block truncate">
                      {game.name}
                    </span>
                  </div>
                  {!searchTerm && index < 3 && (
                    <div className="text-yellow-300 hidden md:block">
                      <Trophy className="h-5 w-5" />
                    </div>
                  )}
                </div>
              ))}
              
              {gamesLoading && (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 border-b border-dotted border-blue-600/50">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-600/50 animate-pulse"></div>
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600/50 animate-pulse"></div>
                    <div className="flex-1 h-6 bg-blue-600/50 animate-pulse"></div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Top Streamers Leaderboard */}
          <div className="bg-blue-950/30 border-4 border-blue-600 p-4">
            <div className="flex items-center gap-2 mb-4 border-b-4 border-blue-600 pb-2">
              <Users className="h-5 w-5 text-red-500" />
              <h2 className="text-sm md:text-lg text-yellow-300">
                {searchTerm ? "STREAMERS" : "TOP STREAMERS"}
              </h2>
            </div>
            
            <div className="space-y-2">
              {!streamersLoading && topStreamers?.length === 0 && (
                <div className="p-3 text-center text-yellow-500 text-xs md:text-sm">
                  NO STREAMERS FOUND
                </div>
              )}
              
              {topStreamers?.map((streamer, index) => (
                <div 
                  key={streamer.id}
                  className="flex items-center gap-3 p-2 hover:bg-blue-900/40 cursor-pointer border-b border-dotted border-blue-600/50"
                  onClick={() => navigate(`/profile/${streamer.username}`)}
                >
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-red-600 flex items-center justify-center text-yellow-300 font-bold text-xs md:text-sm">
                    {index + 1}
                  </div>
                  <Avatar className="w-8 h-8 md:w-10 md:h-10 border-2 border-yellow-300">
                    <AvatarImage src={streamer.avatar_url} />
                    <AvatarFallback className="bg-red-800 text-yellow-300">
                      {streamer.display_name?.[0] || streamer.username?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <span className="text-yellow-300 text-xs block truncate">
                      {streamer.display_name || streamer.username}
                    </span>
                    <span className="text-blue-300 text-[10px] md:text-xs block">
                      {streamer.follower_count || 0} FOLLOWERS
                    </span>
                  </div>
                  {!searchTerm && index < 3 && (
                    <div className="text-yellow-300 hidden md:block">
                      <Trophy className="h-5 w-5" />
                    </div>
                  )}
                </div>
              ))}
              
              {streamersLoading && (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 border-b border-dotted border-blue-600/50">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-red-600/50 animate-pulse"></div>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-red-600/50 animate-pulse"></div>
                    <div className="flex-1 h-6 bg-red-600/50 animate-pulse"></div>
                  </div>
                ))
              )}
            </div>
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
  );
};

export default RetroSearchPage;
