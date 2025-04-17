import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Trophy as TrophyIcon, Users as UsersIcon, Gamepad2, 
  Sparkles, Camera, VideoIcon, Eye, ChevronLeft, ChevronRight, 
  ArrowLeft, ArrowRight, MessageSquare, User, Medal, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useSwipeable } from 'react-swipeable';
import BackButton from '@/components/BackButton';
import RealtimeChat from '@/components/messages/RealtimeChat';
import { transformPostsFromDb, transformGamesFromDb, transformStreamersFromDb } from '@/utils/transformers';

// Import the retro styles
import '../styles/discovery-retro.css';

// Additional CSS for trophy board styling
const trophyBoardStyles = `
  .retro-trophy-board {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .retro-trophy-item {
    display: flex;
    align-items: center;
    padding: 16px;
    border-radius: 12px;
    background: rgba(30, 31, 48, 0.7);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    border: 2px solid rgba(90, 90, 150, 0.3);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    overflow: hidden;
  }
  
  .retro-trophy-item:hover {
    transform: translateY(-4px);
    border-color: rgba(90, 120, 220, 0.5);
    box-shadow: 0 8px 30px rgba(90, 120, 220, 0.2);
  }
  
  .retro-trophy-item.rank-1 {
    background: linear-gradient(135deg, rgba(40, 40, 60, 0.8), rgba(30, 30, 50, 0.8));
    border: 2px solid rgba(255, 215, 0, 0.4);
    box-shadow: 0 8px 30px rgba(255, 215, 0, 0.2);
  }
  
  .retro-trophy-item.rank-2 {
    background: linear-gradient(135deg, rgba(35, 35, 55, 0.8), rgba(25, 25, 45, 0.8));
    border: 2px solid rgba(192, 192, 192, 0.4);
  }
  
  .retro-trophy-item.rank-3 {
    background: linear-gradient(135deg, rgba(30, 30, 50, 0.8), rgba(20, 20, 40, 0.8));
    border: 2px solid rgba(205, 127, 50, 0.4);
  }
  
  .rank-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: 24px;
    font-weight: bold;
    margin-right: 16px;
    background: rgba(50, 50, 80, 0.7);
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }
  
  .rank-number.rank-1 {
    background: linear-gradient(135deg, #ffb700, #ff9500);
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
    color: #222;
    font-size: 28px;
  }
  
  .rank-number.rank-2 {
    background: linear-gradient(135deg, #e0e0e0, #b0b0b0);
    box-shadow: 0 0 10px rgba(192, 192, 192, 0.5);
    color: #222;
    font-size: 26px;
  }
  
  .rank-number.rank-3 {
    background: linear-gradient(135deg, #dd9f5c, #c27d3a);
    box-shadow: 0 0 10px rgba(205, 127, 50, 0.5);
    color: #222;
    font-size: 24px;
  }
  
  .retro-trophy-content {
    display: flex;
    flex: 1;
    align-items: center;
  }
  
  .retro-game-cover img, .retro-avatar-placeholder {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 8px;
  }
  
  .retro-streamer-avatar img, .retro-avatar-placeholder {
    width: 48px;
    height: 48px;
    object-fit: cover;
    border-radius: 100%;
    border: 2px solid rgba(111, 76, 255, 0.5);
  }
  
  .retro-game-info, .retro-streamer-info {
    margin-left: 16px;
    flex: 1;
  }
  
  .retro-game-name, .retro-streamer-name {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 4px;
    color: white;
    text-shadow: 0 0 10px rgba(111, 76, 255, 0.5);
    display: flex;
    align-items: center;
  }
  
  .retro-trophy-score {
    display: flex;
    align-items: center;
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
  }
  
  .live-dot {
    background: #ff5252;
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: bold;
    animation: pulse 1.5s infinite;
  }
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.6; }
    100% { opacity: 1; }
  }
`;

interface Game {
  id: string;
  name: string;
  cover_url: string;
  post_count: any;
}

interface Streamer {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  streaming_url: string;
  current_game: string;
  is_live: boolean;
  follower_count?: number;
  clipts?: any[];
  description?: string;
}

interface CategoryTab {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const Discovery = () => {
  const navigate = useNavigate();
  
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
      opacity: 1
    }
  };
  
  // Tab state
  const [activeTab, setActiveTab] = useState('games');
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState(false);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  
  // Navigation for streamers
  const [currentStreamerIndex, setCurrentStreamerIndex] = useState(0);
  
  const handleNextStreamer = () => {
    if (streamers && streamers.length > 0) {
      setCurrentStreamerIndex((prev) => (prev + 1) % streamers.length);
    }
  };
  
  const handlePreviousStreamer = () => {
    if (streamers && streamers.length > 0) {
      setCurrentStreamerIndex((prev) => (prev - 1 + streamers.length) % streamers.length);
    }
  };
  
  // Posts data fetching function
  const fetchPostsData = async () => {
    setPostsLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .limit(10);
      
      if (error) throw error;
      setPosts(data || []);
      setPostsError(false);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setPostsError(true);
    } finally {
      setPostsLoading(false);
    }
  };
  
  // Initial data loading
  useEffect(() => {
    fetchPostsData();
  }, []);

  // Add trophy board styles to document head
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = trophyBoardStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Database query helper function
  const queryFn = async (table: string, select: string) => {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .limit(20);
    
    if (error) throw error;
    
    if (table === 'games') {
      return transformGamesFromDb(data);
    } else if (table === 'streamers') {
      return transformStreamersFromDb(data);
    }
    
    return data;
  };
  
  // Set up queries for games, streamers, and posts
  const {
    data: games = [],
    isLoading: gamesLoading,
    isError: gamesError,
    refetch: refetchGames
  } = useQuery<Game[]>({
    queryKey: ['games'],
    queryFn: () => queryFn('games', 'name, id, cover_url')
  });

  const {
    data: streamers = [],
    isLoading: streamersLoading,
    isError: streamersError,
    refetch: refetchStreamers
  } = useQuery<Streamer[]>({
    queryKey: ['streamers'],
    queryFn: () => queryFn('streamers', 'id, username, display_name, avatar_url, streaming_url, current_game, is_live, follower_count, description')
  });

  // Use swipeable to handle left/right swipes for streamer navigation
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleNextStreamer(),
    onSwipedRight: () => handlePreviousStreamer(),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  // Navigation functions
  const navigateToGame = (gameId) => {
    navigate(`/game/${gameId}`);
  };

  const navigateToUser = (userId) => {
    navigate(`/profile/${userId}`);
  };

  // Search handling
  const handleInputChange = (event) => {
    setSearchTerm(event.target.value);
    if (event.target.value.trim().length > 0) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  };

  const handleSearchFocus = () => {
    setIsSearchMode(true);
  };

  const handleCloseSearch = () => {
    setIsSearchMode(false);
    setIsSearching(false);
    setSearchTerm('');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setIsSearchMode(true);
      setIsSearching(true);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setIsSearchMode(false);
  };

  return (
    <div className="discovery-container">
      {/* Fixed header */}
      <div className="discovery-header fixed top-0 left-0 right-0 z-10 bg-gradient-to-r from-indigo-950 to-purple-900 backdrop-blur-md border-b border-indigo-800 shadow-lg">
        <div className="container mx-auto px-4 py-3 flex flex-col items-center justify-center max-w-2xl">
          <header className="retro-header mb-2 w-full flex flex-col items-center">  
            <div className="w-full flex justify-start">
              <BackButton className="retro-back-button" />
            </div>
            <h1 className="retro-title text-5xl tracking-wider glow-text mt-2 mb-4 pixel-font">DISCOVERY</h1>
          </header>
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md mx-auto">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-indigo-400" />
            <input
              placeholder="Search games or streamers..."
              className="discovery-search"
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={handleSearchFocus}
            />
          </form>
        </div>
      </div>

      {/* Main content */}
      <div className="discovery-content container mx-auto px-4 pt-24 pb-32 max-w-2xl">
        <div className="retro-tabs mb-6">
          <button 
            className={`retro-tab ${activeTab === 'games' ? 'active' : ''}`}
            onClick={() => setActiveTab('games')}
          >
            <Gamepad2 size={16} className="mr-2" />
            GAMES
          </button>
          <button 
            className={`retro-tab ${activeTab === 'streamers' ? 'active' : ''}`}
            onClick={() => setActiveTab('streamers')}
          >
            <UsersIcon size={16} className="mr-2" />
            STREAMERS
          </button>
          <button 
            className={`retro-tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <VideoIcon size={16} className="mr-2" />
            CLIPTS
          </button>
        </div>
        {/* Top Games Section - Retro Arcade Style */}
        <div className={activeTab === 'games' ? '' : 'hidden'}>
          <h2 className="text-3xl font-bold text-center mb-6 arcade-title glow-text">
            <Gamepad2 size={28} className="inline-block mr-2 text-green-400" />
            TOP ARCADE GAMES
          </h2>
          
          {gamesLoading ? (
            <div className="retro-loading">
              <div className="pixel-loader"></div>
              <p className="text-center mt-4 text-cyan-400 blink">LOADING GAMES...</p>
            </div>
          ) : gamesError ? (
            <div className="text-center p-8 retro-error">
              <p className="text-red-400 blink">ERROR LOADING GAMES</p>
              <button 
                onClick={() => refetchGames()}
                className="retro-button mt-4"
              >
                INSERT COIN TO TRY AGAIN
              </button>
            </div>
          ) : games && games.length > 0 ? (
            <motion.div 
              className="retro-trophy-board"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {games.slice(0, 3).map((game, index) => (
                <motion.div key={game.id} variants={itemVariants} className="mb-4">
                  <div 
                    className={`retro-trophy-item rank-${index + 1}`} 
                    onClick={() => navigateToGame(game.id)}
                  >
                    <div className={`rank-number rank-${index + 1}`}>{index + 1}</div>
                    <div className="retro-trophy-content">
                      <div className="retro-game-cover">
                        {game.cover_url ? (
                          <img src={game.cover_url} alt={game.name} className="rounded-lg border-2 border-indigo-500/50 shadow-lg shadow-indigo-900/20" />
                        ) : (
                          <div className="retro-placeholder"><Gamepad2 size={48} /></div>
                        )}
                      </div>
                      <div className="retro-game-info">
                        <div className="retro-game-name">
                          <span className="game-name-text">{game.name}</span>
                        </div>
                        <div className="retro-trophy-score">
                          <TrophyIcon size={14} className={`inline mr-1 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : 'text-amber-600'}`} />
                          <span>{(Math.random() * 1000).toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center p-8 retro-card">
              <p className="text-yellow-400 blink">NO GAMES FOUND</p>
              <p className="text-cyan-300 mt-2">INSERT COIN TO CONTINUE</p>
            </div>
          )}
        </div>
        
        {/* Top Streamers Section - Retro Arcade Style */}
        <div className={activeTab === 'streamers' ? '' : 'hidden'}>
          <h2 className="text-3xl font-bold text-center mb-6 arcade-title glow-text">
            <UsersIcon size={28} className="inline-block mr-2 text-cyan-400" />
            TOP STREAMERS
          </h2>
          
          {streamersLoading ? (
            <div className="retro-loading">
              <div className="pixel-loader"></div>
              <p className="text-center mt-4 text-cyan-400 blink">LOADING STREAMERS...</p>
            </div>
          ) : streamersError ? (
            <div className="text-center p-8 retro-error">
              <p className="text-red-400 blink">ERROR LOADING STREAMERS</p>
              <button 
                onClick={() => refetchStreamers()}
                className="retro-button mt-4"
              >
                INSERT COIN TO TRY AGAIN
              </button>
            </div>
          ) : streamers && streamers.length > 0 ? (
            <motion.div 
              className="retro-trophy-board"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {streamers.slice(0, 3).map((streamer, index) => (
                <motion.div key={streamer.id} variants={itemVariants} className="mb-4">
                  <div 
                    className={`retro-trophy-item rank-${index + 1}`} 
                    onClick={() => navigateToUser(streamer.id)}
                  >
                    <div className={`rank-number rank-${index + 1}`}>{index + 1}</div>
                    <div className="retro-trophy-content">
                      <div className="retro-streamer-avatar">
                        {streamer.avatar_url ? (
                          <img src={streamer.avatar_url} alt={streamer.display_name || streamer.username} className="rounded-full size-12 border-2 border-indigo-500/50 shadow-lg shadow-indigo-900/20" />
                        ) : (
                          <div className="retro-avatar-placeholder"><UsersIcon size={24} /></div>
                        )}
                      </div>
                      <div className="retro-streamer-info">
                        <div className="retro-streamer-name">
                          <span className="streamer-name-text">{streamer.display_name || streamer.username}</span>
                          {streamer.is_live && (
                            <span className="live-dot ml-2">LIVE</span>
                          )}
                        </div>
                        <div className="retro-trophy-score">
                          <TrophyIcon size={14} className={`inline mr-1 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : 'text-amber-600'}`} />
                          <span>{streamer.follower_count || (Math.random() * 1000).toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center p-8 retro-card">
              <p className="text-yellow-400 blink">NO STREAMERS FOUND</p>
              <p className="text-cyan-300 mt-2">INSERT COIN TO CONTINUE</p>
            </div>
          )}
        </div>
        
        {/* Top Clipts Section */}
        <div className={activeTab === 'posts' ? '' : 'hidden'}>
          <h2 className="text-3xl font-bold text-center mb-6 arcade-title glow-text">
            <VideoIcon size={28} className="inline-block mr-2 text-yellow-400" />
            TOP CLIPTS
          </h2>
          
          {postsLoading ? (
            <div className="retro-loading">
              <div className="pixel-loader"></div>
              <p className="text-center mt-4 text-cyan-400 blink">LOADING HIGH SCORES...</p>
            </div>
          ) : postsError ? (
            <div className="text-center p-8 retro-error">
              <p className="text-red-400 blink">ERROR LOADING SCORES</p>
              <button 
                onClick={fetchPostsData}
                className="retro-button mt-4"
              >
                INSERT COIN TO TRY AGAIN
              </button>
            </div>
          ) : posts.length > 0 ? (
            <motion.div 
              className="retro-scores-list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {posts.slice(0, 10).map((post, index) => (
                <motion.div key={post.id || index} variants={itemVariants}>
                  <div className="retro-score-item">
                    <div className={`retro-rank rank-${index < 3 ? index + 1 : 4}`}>{index + 1}</div>
                    <div className="retro-score-title">
                      <VideoIcon size={16} className="inline mr-2" />
                      CLIPT #{post.id ? post.id.substring(0, 4) : '0000'}
                    </div>
                    <div className="retro-trophy-score">
                      <TrophyIcon size={14} className="inline mr-1 text-yellow-400" />
                      <span>1200</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center p-8 retro-card">
              <p className="text-yellow-400 blink">NO HIGH SCORES</p>
              <p className="text-cyan-300 mt-2">BE THE FIRST TO SET A RECORD!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Discovery;
