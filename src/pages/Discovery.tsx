import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/ui/back-button";
import { Search, X, Filter, Gamepad, Users } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import GameCard from '@/components/GameCard';
import StreamerCard from '@/components/StreamerCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Discovery = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilter, setSearchFilter] = useState<'games' | 'streamers' | 'clips'>('clips');
  const [isSearchActive, setIsSearchActive] = useState(false);

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

  // Games Search
  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ['games', 'search', searchTerm],
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
        
        if (error) throw error;
        
        // Transform data to fix the count object issue
        const transformedData = (data || []).map(game => ({
          ...game,
          post_count: typeof game.post_count === 'object' && game.post_count !== null 
            ? Number(game.post_count.count || 0) 
            : (typeof game.post_count === 'number' ? game.post_count : 0)
        }));
        
        // If no data from database, try fetching from IGDB
        if (transformedData.length === 0 && searchTerm.length > 0) {
          try {
            console.log('No games found in database, trying IGDB');
            const { igdbService } = await import('@/services/igdbService');
            const searchGames = await igdbService.searchGames(searchTerm, { limit: 10 });
            
            if (searchGames && searchGames.length > 0) {
              return searchGames.map((game: any) => ({
                id: `igdb-${game.id}`,
                name: game.name,
                cover_url: game.cover?.url ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : undefined,
                post_count: 0
              }));
            }
          } catch (igdbError) {
            console.error('IGDB search failed:', igdbError);
          }
        }
        
        return transformedData;
      } catch (error) {
        console.error('Error in games query:', error);
        return [];
      }
    },
    enabled: isSearchActive && searchFilter === 'games',
  });

  // Streamers Search
  const { data: streamers, isLoading: streamersLoading } = useQuery({
    queryKey: ['streamers', 'search', searchTerm],
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
    enabled: isSearchActive && searchFilter === 'streamers',
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
    enabled: isSearchActive && searchFilter === 'clips',
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

    if (searchFilter === 'games' && games) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
          {games.map((game: any) => (
            <GameCard
              key={game.id}
              id={game.id}
              name={game.name}
              coverUrl={game.cover_url}
              postCount={game.post_count}
              onClick={() => navigate(`/games/${game.id}`)}
            />
          ))}
        </div>
      );
    }

    if (searchFilter === 'streamers' && streamers) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
          {streamers.map((streamer: any) => (
            <StreamerCard
              key={streamer.id}
              id={streamer.id}
              username={streamer.username}
              displayName={streamer.display_name || streamer.username}
              avatarUrl={streamer.avatar_url}
              streamingUrl={streamer.streaming_url}
              isLive={streamer.is_live}
              onClick={() => navigate(`/profile/${streamer.username}`)}
            />
          ))}
        </div>
      );
    }

    if (searchFilter === 'clips' && searchClips) {
      return renderClipGrid(searchClips);
    }

    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-indigo-300">No results found</p>
      </div>
    );
  };

  const isLoading = clipsLoading || 
    (isSearchActive && searchFilter === 'games' && gamesLoading) ||
    (isSearchActive && searchFilter === 'streamers' && streamersLoading) ||
    (isSearchActive && searchFilter === 'clips' && searchClipsLoading);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1f3c] to-[#0d0f1e]">
      {/* Header with Search */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/60 backdrop-blur-lg border-b border-indigo-500/20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <BackButton className="text-indigo-400 hover:text-indigo-300" />
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-indigo-400" />
              </div>
              <Input
                type="text"
                placeholder="Search clips, games, or streamers..."
                className="pl-10 pr-10 py-2 bg-indigo-950/50 border-indigo-500/40 text-indigo-100 placeholder:text-indigo-400/60 w-full"
                value={searchTerm}
                onChange={handleSearch}
              />
              {searchTerm && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4 text-indigo-400" />
                </button>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="bg-indigo-950/50 border-indigo-500/40">
                  <Filter className="h-4 w-4 text-indigo-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-indigo-950 border-indigo-500/40">
                <DropdownMenuItem 
                  className={`flex items-center gap-2 ${searchFilter === 'clips' ? 'bg-indigo-900/40' : ''}`}
                  onClick={() => setSearchFilter('clips')}
                >
                  <Search className="h-4 w-4" />
                  <span>Clips</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={`flex items-center gap-2 ${searchFilter === 'games' ? 'bg-indigo-900/40' : ''}`}
                  onClick={() => setSearchFilter('games')}
                >
                  <Gamepad className="h-4 w-4" />
                  <span>Games</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={`flex items-center gap-2 ${searchFilter === 'streamers' ? 'bg-indigo-900/40' : ''}`}
                  onClick={() => setSearchFilter('streamers')}
                >
                  <Users className="h-4 w-4" />
                  <span>Streamers</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="pt-20 pb-24 max-w-4xl mx-auto">
        {isLoading ? (
          // Loading grid skeleton
          <div className="grid grid-cols-3 gap-1 md:gap-2 p-2">
            {Array(12).fill(0).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full bg-indigo-950/60" />
            ))}
          </div>
        ) : (
          <>
            {isSearchActive ? (
              renderSearchResults()
            ) : (
              // Instagram-style Explore grid
              <>
                <h2 className="text-lg font-semibold text-indigo-300 px-4 pb-2">Explore</h2>
                {clips && clips.length > 0 ? renderClipGrid(clips) : (
                  <div className="flex items-center justify-center h-40">
                    <p className="text-indigo-300">No clips found</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Discovery;
