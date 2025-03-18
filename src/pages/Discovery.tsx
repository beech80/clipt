import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/ui/back-button";
import { Search, X, TrendingUp, Gamepad, Zap } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import GameCard from '@/components/GameCard';
import StreamerCard from '@/components/StreamerCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Discovery = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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

  // Fetch recent clips for the explore grid
  const { data: clips, isLoading: clipsLoading } = useQuery({
    queryKey: ['clips', 'explore'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          thumbnail_url,
          view_count,
          like_count, 
          created_at,
          profiles(id, username, avatar_url, display_name)
        `)
        .order('created_at', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !isSearchActive,
  });

  // Fetch top searched games
  const { data: topSearchedGames } = useQuery({
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
        .limit(3);
      
      if (error) throw error;
      
      // Transform data to fix the count object issue
      const transformedData = (data || []).map(game => ({
        ...game,
        post_count: typeof game.post_count === 'object' && game.post_count !== null 
          ? (Array.isArray(game.post_count) 
            ? (game.post_count.length > 0 && 'count' in game.post_count[0] ? game.post_count[0].count : 0) 
            : ('count' in game.post_count ? game.post_count.count : 0)) 
          : (typeof game.post_count === 'number' ? game.post_count : 0)
      }));
      
      return transformedData;
    },
  });

  // Games Search
  const { data: games, isLoading: gamesLoading, error: gamesError } = useQuery({
    queryKey: ['games', 'search', searchTerm],
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
        const { data, error } = await query.limit(20); // Increased limit from default 10
        
        if (error) {
          console.error('Supabase games query error:', error);
          throw error;
        }
        
        console.log('Supabase games search results:', data?.length || 0);
        
        // Transform data to fix the count object issue
        const transformedData = (data || []).map(game => ({
          ...game,
          post_count: typeof game.post_count === 'object' && game.post_count !== null 
            ? (Array.isArray(game.post_count) 
              ? (game.post_count.length > 0 && 'count' in game.post_count[0] ? game.post_count[0].count : 0) 
              : ('count' in game.post_count ? game.post_count.count : 0)) 
            : (typeof game.post_count === 'number' ? game.post_count : 0)
        }));
        
        // If no data from database, try fetching from IGDB
        if (transformedData.length === 0 && searchTerm.length > 0) {
          try {
            console.log('No games found in database, trying IGDB for:', searchTerm);
            const { igdbService } = await import('@/services/igdbService');
            const searchGames = await igdbService.searchGames(searchTerm, { limit: 20 }); // Increased limit
            
            console.log('IGDB search results:', searchGames?.length || 0);
            
            if (searchGames && searchGames.length > 0) {
              const mappedGames = searchGames.map((game: any) => {
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
                  post_count: 0,
                  genres: game.genres?.map((g: any) => g.name).join(', ') || '',
                  first_release_date: game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : null
                };
              });
              console.log('Mapped IGDB games:', mappedGames.length);
              return mappedGames;
            } else {
              console.log('No games found in IGDB either');
            }
          } catch (igdbError) {
            console.error('IGDB search failed:', igdbError);
          }
        }
        
        console.log('Returning transformed data:', transformedData.length);
        return transformedData;
      } catch (error) {
        console.error('Error in games query:', error);
        return [];
      }
    },
    enabled: isSearchActive || searchTerm.length > 0, // Always enable if there's a search term
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Clip Search
  const { data: searchClips, isLoading: searchClipsLoading } = useQuery({
    queryKey: ['clips', 'search', searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          thumbnail_url,
          view_count,
          like_count,
          created_at,
          profiles(id, username, avatar_url, display_name)
        `)
        .ilike('title', `%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    enabled: isSearchActive,
  });

  useEffect(() => {
    // Activate search mode when search term is entered
    if (searchTerm.length > 0) {
      setIsSearchActive(true);
    } else {
      setIsSearchActive(false);
    }
  }, [searchTerm]);

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setIsSearchActive(false);
  };

  // Rendering helpers
  const renderClipGrid = (clipsData: any[]) => {
    return (
      <div className="grid grid-cols-3 gap-1 md:gap-2">
        {clipsData.map((clip) => (
          <div 
            key={clip.id} 
            className="relative cursor-pointer overflow-hidden"
            onClick={() => navigate(`/post/${clip.id}`)}
          >
            <AspectRatio ratio={1}>
              {clip.thumbnail_url ? (
                <img 
                  src={clip.thumbnail_url} 
                  alt={clip.title} 
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-indigo-900/30 flex items-center justify-center">
                  <span className="text-xs text-indigo-300">No thumbnail</span>
                </div>
              )}
            </AspectRatio>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
              <div className="flex items-center space-x-1">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={clip.profiles?.avatar_url} alt={clip.profiles?.username} />
                  <AvatarFallback>{clip.profiles?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-white truncate">
                  {clip.profiles?.username}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSearchResults = () => {
    if (!isSearchActive) return null;

    if (games) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
          {games.map((game: any) => (
            <GameCard
              key={game.id}
              id={game.id.toString()}
              name={game.name}
              coverUrl={game.cover_url}
              postCount={game.post_count}
              onClick={() => navigate(`/game/${game.id}`)}
            />
          ))}
        </div>
      );
    }

    if (searchClips) {
      return renderClipGrid(searchClips);
    }

    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-indigo-300">No results found</p>
      </div>
    );
  };

  interface GameProps {
    id: string | number;
    name: string;
    cover_url?: string;
    post_count: number;
    genres?: string;
    first_release_date?: number | null;
    [key: string]: any;  // Allow for other properties
  }

  const isLoading = clipsLoading || 
    (isSearchActive && gamesLoading) ||
    (isSearchActive && searchClipsLoading);

  return (
    <div className="container mx-auto py-4 px-4 md:px-8">
      {/* Search Bar - Made more prominent */}
      <div 
        ref={searchContainerRef}
        className={`relative mb-8 transition-all duration-300 ${
          isSearchFocused ? 'scale-105' : 'scale-100'
        }`}
      >
        <div className={`
          flex items-center p-3 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 
          backdrop-blur-md rounded-2xl border 
          ${isSearchFocused ? 'border-purple-400 shadow-lg shadow-purple-500/20' : 'border-purple-800/30'}
          transition-all duration-300
        `}>
          <Search className="h-5 w-5 text-purple-400 mr-2 flex-shrink-0" />
          <Input
            ref={searchInputRef}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value.length > 0) {
                setIsSearchActive(true);
              }
            }}
            onFocus={() => setIsSearchFocused(true)}
            className="border-0 p-0 bg-transparent shadow-none h-8 placeholder:text-gray-500 focus-visible:ring-0 flex-1"
            placeholder="Find games, streamers, or clips..."
          />
          {searchTerm && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setIsSearchActive(false);
                if (searchInputRef.current) searchInputRef.current.focus();
              }}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results or Explore Content */}
      {isSearchActive || searchTerm ? (
        <div className="space-y-6">
          {/* Games Search Results */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Gamepad className="h-5 w-5 text-purple-400" />
              <h2 className="text-xl font-bold">Games</h2>
            </div>
            
            {gamesLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <AspectRatio ratio={3/4} className="bg-gray-800 rounded-lg mb-2" />
                    <div className="h-4 bg-gray-800 rounded w-3/4 mb-1" />
                    <div className="h-3 bg-gray-800 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : games && Array.isArray(games) && games.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {games.map((game: GameProps) => (
                  <GameCard 
                    key={game.id}
                    id={game.id ? game.id.toString() : 'unknown'}
                    name={game.name || 'Unknown Game'}
                    coverUrl={game.cover_url}
                    postCount={game.post_count || 0}
                    onClick={() => navigate(`/game/${game.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No games found matching "{searchTerm}"</p>
                {gamesError && (
                  <p className="text-red-400 text-sm mt-1">Error: {typeof gamesError === 'object' && gamesError !== null ? 
                    (gamesError as Error).message || JSON.stringify(gamesError) : 
                    String(gamesError)}</p>
                )}
                <p className="text-sm mt-2">Try a different search term or browse popular games below</p>
                
                {/* Debug info during development - can be removed in production */}
                {import.meta.env.DEV && (
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
          </div>
          
          {/* Streamers Search Results */}
          {/* ... */}
          
          {/* Clips Search Results */}
          {/* ... */}
        </div>
      ) : (
        <>
          {/* Trending Games Section - Enhanced with more visuals */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                <h2 className="text-xl font-bold">Trending Games</h2>
              </div>
              <Button 
                variant="link" 
                className="text-purple-400 hover:text-purple-300 p-0"
                onClick={() => navigate('/games')}
              >
                View All
              </Button>
            </div>
            
            {/* Top Searched Games */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topSearchedGames ? (
                topSearchedGames.map((game) => (
                  <div 
                    key={game.id}
                    onClick={() => navigate(`/game-streamers/${game.id}`)}
                    className="relative overflow-hidden rounded-xl aspect-square cursor-pointer group transform transition-transform hover:scale-[1.02]"
                  >
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-indigo-900/50 absolute inset-0 z-10" />
                    <div className="absolute inset-0 z-0">
                      {game.cover_url ? (
                        <img 
                          src={game.cover_url} 
                          alt={game.name}
                          className="w-full h-full object-cover transform transition-transform group-hover:scale-110 duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-800 to-indigo-900 flex items-center justify-center">
                          <Gamepad className="h-12 w-12 text-white/50" />
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-20">
                      <h3 className="text-lg font-bold text-white mb-1 drop-shadow-md">{game.name}</h3>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-purple-400" />
                        <span className="text-sm text-purple-300">{game.post_count} posts</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // Skeletons for loading state
                [...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-xl aspect-square bg-gray-800 animate-pulse" />
                ))
              )}
            </div>
          </div>
          
          {/* Recent Clips Grid */}
          {/* ... */}
        </>
      )}
    </div>
  );
};

export default Discovery;
