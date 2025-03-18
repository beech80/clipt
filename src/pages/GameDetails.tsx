import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gamepad2, Users, Search, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostsGrid from '@/components/PostsGrid';
import StreamerCard from '@/components/StreamerCard';
import { Input } from '@/components/ui/input';

const GameDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<any | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [streamers, setStreamers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('clips');
  
  // Search functionality
  const [searchMode, setSearchMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Game search function
  const searchGames = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('games')
        .select('id, name, cover_url')
        .ilike('name', `%${term}%`)
        .order('name')
        .limit(10);
        
      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching games:', error);
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
  const navigateToGame = (gameId: string) => {
    navigate(`/game/${gameId}`);
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
          .select('id, username, display_name, avatar_url, streaming_url, follower_count, is_live')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-blue-950 text-white">
        <div className="p-4 fixed top-0 left-0 right-0 z-50 flex items-center bg-indigo-950/80 backdrop-blur-sm">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-white">
            <ArrowLeft className="h-5 w-5 mr-2" />
          </Button>
          <h1 className="text-xl font-bold">Game Details</h1>
        </div>
        <div className="pt-16 flex justify-center items-center h-[60vh]">
          <div className="animate-pulse">Loading...</div>
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
          <h1 className="text-xl font-bold">Game Details</h1>
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
        <h1 className="text-xl font-bold">Game Details</h1>
        
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
            
            {/* Search results */}
            {searchTerm.trim().length > 0 && (
              <div className="absolute w-full z-20 mt-1 bg-indigo-950 border border-indigo-600/40 rounded-md shadow-lg max-h-80 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-4 text-center text-sm">Searching...</div>
                ) : searchResults.length > 0 ? (
                  <div>
                    {searchResults.map(game => (
                      <div
                        key={game.id}
                        className="p-3 hover:bg-indigo-900/50 cursor-pointer flex items-center"
                        onClick={() => navigateToGame(game.id)}
                      >
                        {game.cover_url && (
                          <div className="w-10 h-10 mr-3 bg-indigo-800 rounded overflow-hidden">
                            <img
                              src={game.cover_url}
                              alt={game.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="font-medium">{game.name}</div>
                      </div>
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
          <h1 className="text-3xl font-bold text-white">{game.name}</h1>
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
