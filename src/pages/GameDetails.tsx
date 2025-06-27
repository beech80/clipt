import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gamepad2, Users, Search, X, Bell, Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostsGrid from '@/components/PostsGrid';
import StreamerCard from '@/components/StreamerCard';
import { Input } from '@/components/ui/input';
import GameSearchResult from '@/components/GameSearchResult';
import NotificationButton from '@/components/layout/NotificationButton';
import NotificationsPanel from '@/components/notifications/NotificationsPanel';
import GameBoyControls from "@/components/GameBoyControls";
import '../styles/rainbow-clipt-buttons.css';

// Add a declaration for the window object to include our searchTimeout
declare global {
  interface Window {
    searchTimeout: ReturnType<typeof setTimeout> | null;
  }
}

interface Game {
  id: string;
  name: string;
  cover_url?: string;
  external?: boolean;
  created_at?: string;
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
  display_name: string;
  avatar_url: string | null;
  is_live: boolean;
  current_game?: string;
}

const GameDetailsPage = () => {
  // GameBoy Controller states for visibility
  const [dpadVisible] = useState(true);
  const [actionButtonsVisible] = useState(true);
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Mock user ID for demo purposes - in a real app, this would come from auth context
  const userId = "user-123";

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
      console.log('Searching for games with term:', term);
      
      // First try searching in our database - use a more comprehensive approach
      const { data: dbData, error: dbError } = await supabase
        .from('games')
        .select('id, name, created_at')
        .or(`name.ilike.%${term}%, name.eq.${term}`)
        .order('created_at', { ascending: false }) // Show most recent games first
        .limit(50); // Increased limit significantly for more comprehensive results
        
      if (dbError) {
        console.error('Database search error:', dbError);
        throw dbError;
      }
      
      console.log('Database search results:', dbData?.length || 0);
      
      // Store the results we found in our DB
      const dbResults = dbData || [];
      
      // If we have few results or specifically want to augment with IGDB results
      if (dbResults.length < 15) {
        try {
          // Import IGDB service dynamically
          const { igdbService } = await import('@/services/igdbService');
          
          console.log('Searching IGDB for:', term);
          // Search for games in IGDB
          const igdbResults = await igdbService.searchGames(term);
          console.log('IGDB search results:', igdbResults?.length || 0);
          
          // Process IGDB results to match our format
          const processedIgdbResults = igdbResults.map((game: any) => {
            return {
              id: `igdb-${game.id}`,
              name: game.name,
              external: true // Mark as external for navigation handling
            };
          });
          
          // Create a set of existing game names (case insensitive) to avoid duplicates
          const existingNames = new Set(dbResults.map(game => game.name.toLowerCase()));
          
          // Filter out duplicates and combine results
          const uniqueIgdbResults = processedIgdbResults.filter(
            (game: any) => !existingNames.has(game.name.toLowerCase())
          );
          
          console.log('Unique IGDB results:', uniqueIgdbResults.length);
          
          // Combine and set results - putting DB results first as they're already in our system
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
    
    // Start search with just 2 characters to be more responsive
    if (term.trim().length >= 2) {
      // Clear any existing timeout
      if (window.searchTimeout) {
        clearTimeout(window.searchTimeout);
      }
      
      // Set a shorter debounce for better responsiveness
      window.searchTimeout = setTimeout(() => {
        searchGames(term);
      }, 200);
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
        
        // Log the game name to verify it's being loaded correctly
        console.log('Game loaded successfully:', gameData.name);
        setGame(gameData);
        
        // Fetch posts for this game
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at,
            user_id,
            image_url,
            video_url,
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
          profiles: post.profiles as {
            username?: string;
            display_name?: string;
            avatar_url?: string;
          },
          game_id: id
        }));
        
        setPosts(transformedPosts);

        // Fetch streamers playing this game
        try {
          const { data: streamersData, error: streamersError } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url, is_live, current_game');
            
          // Use more specific typing and handle errors
          if (streamersError) {
            console.error('Error fetching streamers:', streamersError);
            setStreamers([]);
          } else {
            // Filter streamers who are playing this game
            const relevantStreamers = (streamersData || [])
              .filter(streamer => streamer.current_game === id)
              .map(streamer => ({
                id: String(streamer.id),
                username: String(streamer.username || ''),
                display_name: String(streamer.display_name || ''),
                avatar_url: streamer.avatar_url,
                is_live: Boolean(streamer.is_live),
                current_game: streamer.current_game
              }));
            
            setStreamers(relevantStreamers);
          }
        } catch (streamerErr) {
          console.error('Error processing streamers:', streamerErr);
          setStreamers([]);
        }
        
      } catch (err) {
        console.error('Error fetching game details:', err);
        setError('Failed to load game details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Get page title dynamically based on loading/error state
  const getPageTitle = () => {
    if (loading) return 'Loading Game Clipts...';
    if (error || !game) return 'Game Clipts';
    return `${game.name} Clipts`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-blue-950 text-white">
        <div className="p-4 fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-gradient-to-r from-indigo-950 to-purple-900 backdrop-blur-md border-b border-indigo-800 shadow-lg">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Loading Game Clipts...</h1>
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
        <div className="p-4 fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-gradient-to-r from-indigo-950 to-purple-900 backdrop-blur-md border-b border-indigo-800 shadow-lg">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Game Clipts</h1>
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
        
        {/* Game controls with rainbow borders and joystick */}
        <GameBoyControls />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-blue-950 text-white relative">
      {/* Cosmic GameBoy Controller UI - enhanced visual design */}
      <div className="cosmic-gameboy-controller fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        {/* D-Pad Controller - positioned at bottom left */}
        <div className="gamepad-dpad fixed bottom-[25px] left-[30px] z-50 pointer-events-auto">
          <motion.div 
            className="dpad-container" 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              boxShadow: [
                '0 0 5px #FF5500, 0 0 10px #FF5500',
                '0 0 10px #FF5500, 0 0 20px #FF5500',
                '0 0 5px #FF5500, 0 0 10px #FF5500'
              ] 
            }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
          >
            <div className="dpad">
              <div className="dpad-up dpad-button" onClick={() => console.log('Up pressed')}/>
              <div className="dpad-right dpad-button" onClick={() => console.log('Right pressed')}/>
              <div className="dpad-down dpad-button" onClick={() => console.log('Down pressed')}/>
              <div className="dpad-left dpad-button" onClick={() => console.log('Left pressed')}/>
              <div className="dpad-center">
                <motion.div 
                  className="dpad-center-dot"
                  animate={{ 
                    backgroundColor: ['#FF5500', '#FF7700', '#FF5500']
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Buttons - positioned at bottom right */}
        <div className="gamepad-buttons fixed bottom-[25px] right-[30px] z-50 pointer-events-auto">
          <motion.div 
            className="action-buttons-container"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              boxShadow: [
                '0 0 5px #FF5500, 0 0 10px #FF5500',
                '0 0 10px #FF5500, 0 0 20px #FF5500',
                '0 0 5px #FF5500, 0 0 10px #FF5500'
              ] 
            }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
          >
            <div className="action-buttons">
              <motion.div 
                className="action-button action-button-a"
                style={{ backgroundColor: '#FF5500' }}
                whileTap={{ scale: 0.9, backgroundColor: '#FF7700' }}
                whileHover={{ scale: 1.1 }}
                onClick={() => console.log('A button pressed')}
              >
                A
              </motion.div>
              <motion.div 
                className="action-button action-button-b"
                style={{ backgroundColor: '#FF7700' }}
                whileTap={{ scale: 0.9, backgroundColor: '#FF5500' }}
                whileHover={{ scale: 1.1 }}
                onClick={() => console.log('B button pressed')}
              >
                B
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      {/* Header */}
      <div className="p-4 fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-gradient-to-r from-indigo-950 to-purple-900 backdrop-blur-md border-b border-indigo-800 shadow-lg">
        {/* Empty div for left side spacing */}
        <div className="w-10"></div>
        
        {/* Center section with game title */}
        <div className="text-center flex-1">
          <motion.h1 
            className="text-3xl font-bold" 
            initial={{ opacity: 0, y: -10 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              textShadow: [
                '0 0 4px rgba(255, 85, 85, 0.7), 0 0 8px rgba(255, 85, 85, 0.5)', 
                '0 0 8px rgba(131, 56, 236, 0.7), 0 0 16px rgba(131, 56, 236, 0.5)', 
                '0 0 4px rgba(255, 85, 85, 0.7), 0 0 8px rgba(255, 85, 85, 0.5)'
              ]
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity, 
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          >
            <span className="inline-flex items-center">
              <Gamepad2 className="h-6 w-6 mr-2 text-orange-400" />
              <span className="bg-gradient-to-r from-orange-400 via-purple-400 to-blue-400 bg-clip-text text-transparent"> 
                {game ? `${game.name} Clipts` : 'Game Clipts'}
              </span>
            </span>
          </motion.h1>
        </div>
        
        {/* Notification bell */}
        <div className="flex items-center">
          <NotificationButton 
            userId={userId} 
            onOpenNotifications={() => setNotificationsPanelOpen(true)} 
          />
        </div>
      </div>
      
      {/* Notifications Panel */}
      {notificationsPanelOpen && (
        <NotificationsPanel 
          userId={userId} 
          onClose={() => setNotificationsPanelOpen(false)} 
        />
      )}

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
                className="w-full pr-10 pl-4 py-2 bg-indigo-950/60 border-indigo-600/40 text-white rounded-lg"
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
              <div className="absolute w-full z-20 mt-1 bg-indigo-950 border border-indigo-600/40 rounded-md shadow-lg max-h-96 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-4 text-center text-sm">
                    <div className="animate-pulse flex space-x-4 justify-center">
                      <div className="h-3 w-3 bg-indigo-400 rounded-full"></div>
                      <div className="h-3 w-3 bg-indigo-400 rounded-full"></div>
                      <div className="h-3 w-3 bg-indigo-400 rounded-full"></div>
                    </div>
                    <p className="mt-2">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
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

        {/* Game Name - Perfectly centered with cosmic gradient text */}
        <div className="py-8 text-center mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-orange-400 bg-clip-text text-transparent animate-gradient-x">{game.name}</h1>
          <p className="text-yellow-400 mt-2 text-lg">Streams & Clipts</p>
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
                    isLive={streamer.is_live}
                    game={streamer.current_game}
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

        {/* Rainbow Border Clipt Buttons - matching Clipts page exactly */}
        {/* D-Pad Controller with rainbow borders */}
        <div className="clipt-dpad-container">
          <button 
            className="clipt-button up-button clipt-dpad-up" 
            onClick={() => {
              window.scrollBy(0, -300);
            }}
          />
          <button 
            className="clipt-button right-button clipt-dpad-right" 
            onClick={() => {
              setActiveTab('streamers');
            }}
          />
          <button 
            className="clipt-button down-button clipt-dpad-down" 
            onClick={() => {
              window.scrollBy(0, 300);
            }}
          />
          <button 
            className="clipt-button left-button clipt-dpad-left" 
            onClick={() => {
              setActiveTab('clips');
            }}
          />
          <div className="clipt-dpad-center">
            <div className="clipt-dpad-center-dot" />
          </div>
        </div>

        {/* Action Buttons with rainbow borders */}
        <div className="clipt-action-buttons">
          <button 
            className="clipt-button a-button" 
            onClick={() => {
              // Like the current game or post
              if (posts.length > 0) {
                toast({
                  title: "Liked!",
                  description: "You liked this content",
                  duration: 2000,
                });
              }
            }}
          >
            A
          </button>
          <button 
            className="clipt-button b-button" 
            onClick={() => navigate(-1)}
          >
            B
          </button>
        </div>

        {/* Controller Legend with rainbow border */}
        <div className="clipt-controller-legend">
          <span><span className="key">A:</span> Like</span>
          <span><span className="key">B:</span> Back</span>
        </div>
      </div>
    </div>
  );
};

export default GameDetailsPage;
