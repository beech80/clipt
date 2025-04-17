import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Trophy, Users as UsersIcon, Star, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase'; 
import GameCard from '@/components/GameCard';
import StreamerCard from '@/components/StreamerCard';
import { allGames } from '@/data/gamesList';
import '@/styles/retro-animations.css';

interface Game {
  id: string;
  name: string;
  cover_url: string;
  post_count: number;
}

interface Streamer {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  streaming_url: string;
  current_game: string;
  is_live: boolean;
  follower_count: number;
}

const Explore = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    },
    hover: {
      scale: 1.05,
      boxShadow: '0 0 15px rgba(92, 225, 255, 0.5)',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10
      }
    },
    tap: { scale: 0.95 }
  };

  const glowVariants = {
    initial: { opacity: 0.5 },
    animate: {
      opacity: [0.5, 1, 0.5],
      transition: {
        repeat: Infinity,
        duration: 2,
        ease: 'easeInOut'
      }
    }
  };
  
  const navigate = useNavigate();
  const [topGames, setTopGames] = useState<Game[]>([]);
  const [topStreamers, setTopStreamers] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{games: Game[], streamers: Streamer[]}>({games: [], streamers: []});
  const [isSearching, setIsSearching] = useState(false);

  // This function will be used in the future when tracking is implemented
  const trackUserActivity = async (type: 'search' | 'view', itemId: string, itemType: 'game' | 'user') => {
    try {
      console.log(`[FUTURE TRACKING] User ${type}ed ${itemType} ${itemId}`);
      
      // In the future, this will insert a record into analytics table
      /*
      const { error } = await supabase
        .from('analytics')
        .insert({
          user_id: currentUserId,
          activity_type: type,
          item_id: itemId,
          item_type: itemType,
          timestamp: new Date()
        });
        
      if (error) {
        console.error('Error tracking user activity:', error);
      }
      */
    } catch (error) {
      console.error('Error in tracking:', error);
    }
  };
  
  // This function will be used in the future to fetch live data for the top games section
  const fetchTopGames = async () => {
    try {
      /*
      const { data, error } = await supabase
        .from('games')
        .select('id, name, cover_url')
        .order('view_count', { ascending: false })
        .limit(3);
        
      if (error) throw error;
      
      return data.map(game => ({
        ...game,
        post_count: 0
      }));
      */
      return getFallbackGames();
    } catch (error) {
      console.error('Error fetching top games:', error);
      return getFallbackGames();
    }
  };
  
  // This function will be used in the future to fetch live data for the top users section
  const fetchTopUsers = async () => {
    try {
      /*
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, current_game')
        .order('follower_count', { ascending: false })
        .limit(3);
        
      if (error) throw error;
      
      return data.map(user => ({
        ...user,
        streaming_url: '',
        is_live: false,
        follower_count: 0
      }));
      */
      return getFallbackStreamers();
    } catch (error) {
      console.error('Error fetching top users:', error);
      return getFallbackStreamers();
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setTopGames(getFallbackGames());
        setTopStreamers(getFallbackStreamers());
        setLoading(false);
      } catch (error) {
        console.error('Error loading explore page data:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Fallback data for top games
  const getFallbackGames = (): Game[] => {
    return [
      {
        id: 'game1',
        name: 'Coming Soon',
        cover_url: 'https://i.imgur.com/zUwHCoQ.jpeg',
        post_count: 0
      },
      {
        id: 'game2',
        name: 'Coming Soon',
        cover_url: 'https://i.imgur.com/zUwHCoQ.jpeg',
        post_count: 0
      },
      {
        id: 'game3',
        name: 'Coming Soon',
        cover_url: 'https://i.imgur.com/zUwHCoQ.jpeg',
        post_count: 0
      }
    ];
  };
  
  // Fallback data for top streamers
  const getFallbackStreamers = (): Streamer[] => {
    return [
      {
        id: 'user1',
        username: 'gamer1',
        display_name: 'Pro Gamer',
        avatar_url: '',
        streaming_url: '',
        current_game: 'Coming Soon',
        is_live: false,
        follower_count: 0
      },
      {
        id: 'user2',
        username: 'gamer2',
        display_name: 'Elite Player',
        avatar_url: '',
        streaming_url: '',
        current_game: 'Coming Soon',
        is_live: false,
        follower_count: 0
      },
      {
        id: 'user3',
        username: 'gamer3',
        display_name: 'Game Master',
        avatar_url: '',
        streaming_url: '',
        current_game: 'Coming Soon',
        is_live: false,
        follower_count: 0
      }
    ];
  };
  
  // Completely rewritten search function with expanded game list and app-specific users
  const handleSearch = (query: string) => {
    setIsSearching(true);
    
    // Simple debounce for search
    const timer = setTimeout(() => {
      try {
        // Filter games from the complete games list
        const filteredGames = allGames
          .filter(game => 
            game.name.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 5)
          .map(game => ({
            id: game.id,
            name: game.name,
            cover_url: game.cover_url || '',
            post_count: 0
          }));
        
        // Mock user search for now - in the future this will query Supabase
        const mockUsers = [
          {
            id: 'user1',
            username: 'progamer',
            display_name: 'Pro Gamer',
            avatar_url: '',
            streaming_url: '',
            current_game: 'Fortnite',
            is_live: false,
            follower_count: 0
          },
          {
            id: 'user2',
            username: 'streamqueen',
            display_name: 'Stream Queen',
            avatar_url: '',
            streaming_url: '',
            current_game: 'Apex Legends',
            is_live: false,
            follower_count: 0
          },
          {
            id: 'user3',
            username: 'gamemaster',
            display_name: 'Game Master',
            avatar_url: '',
            streaming_url: '',
            current_game: 'Minecraft',
            is_live: false,
            follower_count: 0
          }
        ];
        
        const filteredUsers = mockUsers.filter(user => 
          user.username.toLowerCase().includes(query.toLowerCase()) ||
          user.display_name.toLowerCase().includes(query.toLowerCase())
        );
        
        setSearchResults({
          games: filteredGames,
          streamers: filteredUsers
        });
      } catch (error) {
        console.error('Error during search:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  };

  return (
    <motion.div 
      className="bg-[#080a1f] min-h-screen py-6 text-white scanlines"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="container mx-auto px-4 max-w-4xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="flex items-center justify-between mb-6"
          variants={itemVariants}
        >
          <motion.h1 
            className="text-3xl font-bold text-[#5ce1ff] pixel-font retro-text-shadow text-glow-blue"
            initial={{ x: -50 }}
            animate={{ x: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 15
            }}
          >EXPLORE</motion.h1>
          
          <motion.div 
            className="relative"
            variants={itemVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <div className="flex items-center bg-[#1a1c42] rounded-full pr-3 border-2 border-[#4a4dff] focus-within:border-[#5ce1ff] transition-colors">
              <input
                type="text"
                placeholder="Search games or users..."
                className="bg-transparent py-2 pl-4 pr-10 text-white outline-none w-[200px] sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (e.target.value) {
                    handleSearch(e.target.value);
                  } else {
                    setIsSearching(false);
                    setSearchResults({games: [], streamers: []});
                  }
                }}
              />
              <motion.div
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <Search className="text-[#5ce1ff] w-5 h-5" />
              </motion.div>
            </div>
            
            <AnimatePresence>
              {isSearching && (
                <motion.div 
                  className="absolute top-full mt-2 w-full bg-[#1a1c42] border-2 border-[#4a4dff] rounded-lg shadow-xl z-10 max-h-[70vh] overflow-y-auto"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: "spring", damping: 20 }}
                >
                  <motion.div 
                    className="sticky top-0 bg-[#262966] p-2 text-center"
                    animate={{ backgroundColor: ["#262966", "#313aa3", "#262966"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <motion.p 
                      className="text-sm text-gray-300"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      Searching...
                    </motion.p>
                  </motion.div>
                  
                  {searchResults.games.length > 0 && (
                    <div className="p-2">
                      <h3 className="px-2 py-1 text-[#5ce1ff] font-bold">Games</h3>
                      <div className="divide-y divide-[#4a4dff]/30">
                        {searchResults.games.map(game => (
                          <div 
                            key={game.id}
                            onClick={() => navigate(`/game/${game.id}`)}
                            className="flex items-center p-2 hover:bg-[#262966] cursor-pointer"
                          >
                            <span className="px-2 py-1">{game.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {searchResults.streamers.length > 0 && (
                    <div className="p-2">
                      <h3 className="px-2 py-1 text-[#ff66c4] font-bold">Users</h3>
                      <div className="divide-y divide-[#ff66c4]/30">
                        {searchResults.streamers.map(streamer => (
                          <div 
                            key={streamer.id}
                            onClick={() => navigate(`/profile/${streamer.id}`)}
                            className="flex items-center p-2 hover:bg-[#262966] cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                              {streamer.avatar_url ? (
                                <img src={streamer.avatar_url} alt={streamer.username} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-purple-900 flex items-center justify-center">
                                  <UsersIcon className="w-5 h-5 text-purple-300" />
                                </div>
                              )}
                            </div>
                            <span>{streamer.display_name || streamer.username}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {searchResults.games.length === 0 && searchResults.streamers.length === 0 && !isSearching && (
                    <div className="p-4 text-center text-gray-400">
                      No results found
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
        
        {loading ? (
          <motion.div 
            className="flex flex-col items-center justify-center py-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div 
              className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full pixel-spinner"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            ></motion.div>
            <motion.p 
              className="mt-4 text-xl text-[#5ce1ff] pixel-font"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Loading awesome content...
            </motion.p>
          </motion.div>
        ) : (
          <>
            <motion.div 
              className="mb-10"
              variants={itemVariants}
            >
              <motion.div 
                className="flex items-center mb-6"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  whileHover={{ rotate: 15 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <Gamepad2 className="w-8 h-8 mr-3 text-[#5ce1ff]" />
                </motion.div>
                <motion.h2 
                  className="text-2xl font-bold text-[#5ce1ff] pixel-font retro-text-shadow text-glow-blue"
                >
                  TOP GAMES
                </motion.h2>
              </motion.div>
              
              <motion.div 
                className="bg-[#1a1c42] border-4 border-[#4a4dff] rounded-lg p-2 shadow-[0_6px_0_0_#000] mb-4 arcade-cabinet"
                whileHover={{
                  boxShadow: "0 12px 0 0 #000, 0 0 20px 0 rgba(74, 77, 255, 0.8)",
                  y: -5
                }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <motion.div 
                  className="bg-[#0f112a] p-4 rounded text-center overflow-hidden gradient-bg"
                >
                  <motion.p 
                    className="text-xl text-[#5ce1ff] pixel-font mb-6"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Coming Soon!
                  </motion.p>
                  <motion.p 
                    className="text-sm text-gray-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    Stay tuned for the most popular games on the platform.
                  </motion.p>
                </motion.div>
              </motion.div>
            </motion.div>
            
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
            >
              <motion.div 
                className="flex items-center mb-6"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div
                  whileHover={{ rotate: 15 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <UsersIcon className="w-8 h-8 mr-3 text-[#ff66c4]" />
                </motion.div>
                <motion.h2 
                  className="text-2xl font-bold text-[#ff66c4] pixel-font retro-text-shadow text-glow-pink"
                >
                  TOP USERS
                </motion.h2>
              </motion.div>
              
              <motion.div 
                className="bg-[#1a1c42] border-4 border-[#ff66c4] rounded-lg p-2 shadow-[0_6px_0_0_#000] arcade-cabinet"
                whileHover={{
                  boxShadow: "0 12px 0 0 #000, 0 0 20px 0 rgba(255, 102, 196, 0.8)",
                  y: -5
                }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <motion.div 
                  className="bg-[#0f112a] p-4 rounded text-center overflow-hidden gradient-bg"
                >
                  <motion.p 
                    className="text-xl text-[#ff66c4] pixel-font mb-6"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Coming Soon!
                  </motion.p>
                  <motion.p 
                    className="text-sm text-gray-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    Follow your favorite content creators when we launch.
                  </motion.p>
                </motion.div>
              </motion.div>
            </motion.div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Explore;
