import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gamepad2, Users, Search, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostsGrid from '@/components/PostsGrid';
import StreamerCard from '@/components/StreamerCard';
import { Input } from '@/components/ui/input';
import GameSearchResult from '@/components/GameSearchResult';

interface Game {
  id: string;
  name: string;
  cover_url?: string | null;
}

interface Post {
  id: string;
  created_at: string;
  user_id: string;
  media_url?: string;
  profiles?: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  game_id: string;
}

interface Streamer {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  streaming_url?: string;
  is_live?: boolean;
}

const GameDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('clips');
  
  // Search functionality
  const [searchMode, setSearchMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Game[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Game search function
  const searchGames = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      // First try searching in our database
      const { data: dbData, error: dbError } = await supabase
        .from('games')
        .select('id, name')
        .ilike('name', `%${term}%`)
        .order('name')
        .limit(10);
        
      if (dbError) throw dbError;
      
      // Store the results we found in our DB
      const dbResults = dbData || [];
      
      // If we have few results, try to augment with IGDB results
      if (dbResults.length < 5) {
        try {
          // Import IGDB service dynamically
          const { igdbService } = await import('@/services/igdbService');
          
          // Search for games in IGDB
          const igdbResults = await igdbService.searchGames(term);
          
          // Process IGDB results to match our format
          const processedIgdbResults = igdbResults.map((game: any) => {
            return {
              id: `igdb-${game.id}`,
              name: game.name,
              external: true // Mark as external for navigation handling
            };
          });
          
          // Create a set of existing game names to avoid duplicates
          const existingNames = new Set(dbResults.map(game => game.name.toLowerCase()));
          
          // Filter out duplicates and combine results
          const uniqueIgdbResults = processedIgdbResults.filter(
            (game: any) => !existingNames.has(game.name.toLowerCase())
          );
          
          setSearchResults([...dbResults, ...uniqueIgdbResults]);
        } catch (igdbError) {
          console.error('IGDB search failed:', igdbError);
          // Still show database results if IGDB fails
          setSearchResults(dbResults);
        }
      } else {
        // If we have enough results from DB, just use those
        setSearchResults(dbResults);
      }
    } catch (error) {
      console.error('Error searching games:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim().length > 2) {
      const debounce = setTimeout(() => {
        searchGames(term);
      }, 300);
      
      return () => clearTimeout(debounce);
    } else {
      setSearchResults([]);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setSearchMode(false);
  };

  // Navigate to a different game
  const navigateToGame = (gameId: string, isExternal = false) => {
    if (isExternal) {
      // For IGDB results, we need to create the game first
      // This would normally be done server-side, but for our demo
      // we'll just navigate back to discover with the search term
      navigate(`/discovery?search=${encodeURIComponent(searchTerm)}`);
    } else {
      navigate(`/game/${gameId}`);
    }
    clearSearch();
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('Game ID is missing');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Handle IGDB IDs
        if (id.startsWith('igdb-')) {
          setError('This game is not yet in our database');
          setLoading(false);
          return;
        }

        // Fetch game details from Supabase
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('id', id)
          .single();
          
        if (gameError) {
          console.error('Error fetching game:', gameError);
          setError('Game not found');
          setLoading(false);
          return;
        }
        
        setGame(gameData);
        
        // Fetch posts for this game
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            id, image_url, video_url, created_at, user_id,
            profiles (username, display_name, avatar_url)
          `)
          .eq('game_id', id)
          .order('created_at', { ascending: false });
          
        if (postsError) {
          console.error('Error fetching posts:', postsError);
          throw postsError;
        }
        
        // Transform posts data to match PostsGrid component expectations
        const transformedPosts = (postsData || []).map(post => ({
          id: post.id,
          created_at: post.created_at,
          user_id: post.user_id,
          media_url: post.video_url || post.image_url,
          profiles: post.profiles,
          game_id: id
        }));
        
        setPosts(transformedPosts);

        // Fetch streamers playing this game
        const { data: streamersData, error: streamersError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, streaming_url, is_live')
          .eq('current_game', id)
          .eq('is_live', true)
          .order('follower_count', { ascending: false });

        if (streamersError) {
          console.error('Error fetching streamers:', streamersError);
          throw streamersError;
        }

        setStreamers(streamersData || []);
        
      } catch (err) {
        console.error('Error fetching game details:', err);
        setError('Failed to load game details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const getPageTitle = () => {
    if (loading) return 'Loading Game Clipts...';
    if (error || !game) return 'Game Clipts';
    return `${game.name} Clipts`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-blue-950 text-white">
        <div className="p-4 fixed top-0 left-0 right-0 z-50 flex items-center bg-indigo-950/80 backdrop-blur-sm">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-white">
            <ArrowLeft className="h-5 w-5 mr-2" />
          </Button>
          <h1 className="text-xl font-bold">Loading Game Clipts...</h1>
        </div>
        <div className="pt-16 flex justify-center items-center h-[60vh]">
          <div className="animate-pulse">Loading game details...</div>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-blue-950 text-white">
        <div className="p-4 fixed top-0 left-0 right-0 z-50 flex items-center bg-indigo-950/80 backdrop-blur-sm">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-white">
            <ArrowLeft className="h-5 w-5 mr-2" />
          </Button>
          <h1 className="text-xl font-bold">Game Clipts</h1>
        </div>
        <div className="pt-16 p-4">
          <div className="bg-red-900/20 text-red-300 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p>{error || 'Failed to load game details'}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-blue-950 text-white">
      {/* Header */}
      <div className="p-4 fixed top-0 left-0 right-0 z-50 flex items-center bg-indigo-950/80 backdrop-blur-sm">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-white">
          <ArrowLeft className="h-5 w-5 mr-2" />
        </Button>
        <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
        
        {/* Search button */}
        <div className="ml-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSearchMode(!searchMode)}
            className="text-white"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="pt-16 pb-20 px-4">
        {/* Search bar */}
        {searchMode && (
          <div className="my-4 relative">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search for games..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pr-10 pl-4 py-2 bg-indigo-950/60 border-indigo-600/40 text-white"
                autoFocus
              />
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Search results - only showing game names */}
            {searchTerm.trim().length > 0 && (
              <div className="absolute w-full z-20 mt-1 bg-indigo-950 border border-indigo-600/40 rounded-md shadow-lg max-h-80 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-4 text-center text-sm">Searching...</div>
                ) : searchResults.length > 0 ? (
                  <div>
                    {searchResults.map(game => (
                      <GameSearchResult
                        key={game.id}
                        id={game.id}
                        name={game.name}
                        external={!!game.external}
                        onClick={navigateToGame}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm">No games found</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Game Name */}
        <div className="py-6 text-center">
          <h1 className="text-3xl font-bold">{game.name}</h1>
          <p className="text-yellow-400 mt-2">Clips & Streamers</p>
        </div>

        {/* Tabs for Clips and Streamers */}
        <Tabs defaultValue="clips" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
            <TabsTrigger value="clips" className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              Clips
            </TabsTrigger>
            <TabsTrigger value="streamers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Streamers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clips">
            {posts.length > 0 ? (
              <PostsGrid posts={posts} />
            ) : (
              <div className="text-center py-10 bg-indigo-900/20 rounded-lg">
                <p className="text-lg text-gray-300">No clips available for this game yet</p>
                <p className="text-sm text-gray-400 mt-2">Be the first to share a clip!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="streamers">
            {streamers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {streamers.map((streamer) => (
                  <StreamerCard
                    key={streamer.id}
                    id={streamer.id}
                    username={streamer.username}
                    displayName={streamer.display_name}
                    avatarUrl={streamer.avatar_url}
                    streamingUrl={streamer.streaming_url}
                    isLive={streamer.is_live}
                    game={game.name}
                    onClick={() => navigate(`/profile/${streamer.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-indigo-900/20 rounded-lg">
                <p className="text-lg text-gray-300">No streamers are playing this game right now</p>
                <p className="text-sm text-gray-400 mt-2">Check back later!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GameDetailsPage;
