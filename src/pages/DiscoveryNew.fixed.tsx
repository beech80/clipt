import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RealtimeChat from '@/components/messages/RealtimeChat';
import { useAuth } from '@/contexts/AuthContext';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';
import '../styles/discovery-retro.css';
import '../styles/tetris-animation.css';
import '../styles/discovery-enhanced.css';
import { getSafeSearchTerm } from '@/utils/SearchUtils';

// Mobile-specific styles
const mobileStyles = `
  @media (max-width: 640px) {
    .channel-card {
      min-height: 180px;
    }
    .channel-title {
      font-size: 0.8rem;
    }
    .live-dot {
      font-size: 0.6rem;
      padding: 2px 4px;
    }
  }
`;

interface Streamer {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  is_live: boolean;
  follower_count: number;
  bio?: string;
  game?: string;
  clips?: any[];
}

interface Channel {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  type: string;
  viewers: number;
}

// Define Tetris block interface
interface TetrisBlock {
  id: string;
  shape: string;
  color: string;
  left: number;
  duration: number;
  delay: number;
  rotate: number;
  streamer: Streamer;
}

// Define Stacked block interface
interface StackedBlock {
  id: string;
  shape: string;
  color: string;
  position: number;
  streamer: Streamer;
}

const DiscoveryNew: React.FC = () => {
  // ----- Basic Hooks & State Management -----
  const navigate = useNavigate();
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // ----- State for Tetris animation -----
  const tetrisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showSpaceBackground, setShowSpaceBackground] = useState(true);
  const [stars, setStars] = useState<{id: number, size: number, top: number, left: number, duration: number}[]>([]);
  const [shootingStars, setShootingStars] = useState<{id: number, top: number, left: number, angle: number, duration: number, delay: number}[]>([]);
  
  // ----- Main State Management -----
  const [activeTab, setActiveTab] = useState('discover');
  const [showChat, setShowChat] = useState(false);
  const [chatPartnerId, setChatPartnerId] = useState('');
  
  // ----- IMPORTANT: Safe SearchTerm Handling -----
  // Initialize with empty string to prevent undefined
  const [searchTerm, setSearchTerm] = useState('');
  // Ensure searchTerm is always a string, never undefined
  const effectiveSearchTerm = searchTerm || '';
  
  const [currentStreamerIndex, setCurrentStreamerIndex] = useState(0);
  const [currentChannelIndex, setCurrentChannelIndex] = useState(0);
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [selectedStreamType, setSelectedStreamType] = useState('all');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [view, setView] = useState('channel'); // Default to channel view with 4 streams
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [filteredStreamers, setFilteredStreamers] = useState<Streamer[]>([]);
  const [searchResults, setSearchResults] = useState<{
    users: Streamer[];
    games: { id: string; name: string; cover_url: string }[];
  }>({ users: [], games: [] });
  
  // ----- Tetris Animation States -----
  const [tetrisAnimation, setTetrisAnimation] = useState(false);
  const [animatingBlocks, setAnimatingBlocks] = useState(false);
  const [tetrisBlocks, setTetrisBlocks] = useState<TetrisBlock[]>([]);
  const [stacked, setStacked] = useState<StackedBlock[]>([]);
  
  // ----- Add mobile styles to head -----
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = mobileStyles;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // ----- Initialize space background -----
  useEffect(() => {
    if (showSpaceBackground) {
      // Create stars
      const newStars = [];
      for (let i = 0; i < 100; i++) {
        newStars.push({
          id: i,
          size: Math.random() * 2 + 1,
          top: Math.random() * 100,
          left: Math.random() * 100,
          duration: Math.random() * 5 + 2
        });
      }
      setStars(newStars);
      
      // Create shooting stars (fewer)
      const newShootingStars = [];
      for (let i = 0; i < 5; i++) {
        newShootingStars.push({
          id: i,
          top: Math.random() * 50,
          left: Math.random() * 100,
          angle: Math.random() * 60 - 30, // -30 to +30 degrees
          duration: Math.random() * 2 + 1,
          delay: Math.random() * 15
        });
      }
      setShootingStars(newShootingStars);
    }
  }, [showSpaceBackground]);

  // ----- Mock data initialization -----
  useEffect(() => {
    // Mock streamers data
    const mockStreamers: Streamer[] = Array.from({ length: 20 }, (_, i) => ({
      id: `streamer-${i + 1}`,
      username: `gamer${i + 1}`,
      display_name: `Pro Gamer ${i + 1}`,
      avatar_url: `https://picsum.photos/100/100?random=${i + 1}`,
      is_live: Math.random() > 0.5,
      follower_count: Math.floor(Math.random() * 10000),
      game: ['Fortnite', 'Valorant', 'Apex Legends', 'Call of Duty', 'Minecraft'][Math.floor(Math.random() * 5)]
    }));
    
    setStreamers(mockStreamers);
    setFilteredStreamers(mockStreamers);
    
    // Mock channels data
    const mockChannels: Channel[] = Array.from({ length: 12 }, (_, i) => ({
      id: `channel-${i + 1}`,
      name: `Gaming Channel ${i + 1}`,
      description: `Description for channel ${i + 1}`,
      thumbnail: `https://picsum.photos/300/200?random=${i + 10}`,
      type: ['game', 'stream', 'highlights'][Math.floor(Math.random() * 3)],
      viewers: Math.floor(Math.random() * 1000)
    }));
    
    setChannels(mockChannels);
    setAllChannels(mockChannels);
    setTotalPages(Math.ceil(mockChannels.length / 4));
  }, []);

  // ----- Swiper handlers -----
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleNextPage(),
    onSwipedRight: () => handlePrevPage(),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  // ----- Game selection handler -----
  const handleGameSelect = (gameId: string, gameName: string) => {
    navigate(`/game/${gameId}?name=${encodeURIComponent(gameName)}`);
  };

  // ----- Navigation handlers -----
  const handleNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(prev => prev + 1);
      
      // Animate scroll right
      if (containerRef.current) {
        containerRef.current.scrollBy({
          left: window.innerWidth,
          behavior: 'smooth'
        });
      }
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
      
      // Animate scroll left
      if (containerRef.current) {
        containerRef.current.scrollBy({
          left: -window.innerWidth,
          behavior: 'smooth'
        });
      }
    }
  };

  // ----- Touch event handlers for mobile swipe -----
  const handleTouchStart = (e: TouchEvent) => {
    // Record the starting touch position
    const touchStartX = e.touches[0].clientX;
    // @ts-ignore - Storing temporary data on the DOM element
    containerRef.current.touchStartX = touchStartX;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!containerRef.current) return;
    
    // @ts-ignore - Accessing temporary data from the DOM element
    const touchStartX = containerRef.current.touchStartX;
    const touchEndX = e.changedTouches[0].clientX;
    const touchDiffX = touchEndX - touchStartX;
    
    // Determine swipe direction and navigate accordingly
    // Only trigger if a significant swipe distance
    if (Math.abs(touchDiffX) > 50) {
      if (touchDiffX > 0) {
        // Swiped right, go to previous page
        handlePrevPage();
      } else {
        // Swiped left, go to next page
        handleNextPage();
      }
    }
  };

  // ----- Effect to handle search and filtering -----
  useEffect(() => {
    // Wrap in try-catch to prevent any errors
    try {
      // Use the globally defined effectiveSearchTerm from above
      const safeSearchTerm = effectiveSearchTerm;
      
      if (safeSearchTerm.length >= 2) {
        // Simulate API search with delay
        setSearchLoading(true);
        
        const timeoutId = setTimeout(() => {
          // Filter streamers by search term
          const filtered = streamers.filter(
            (streamer) =>
              streamer.display_name.toLowerCase().includes(safeSearchTerm.toLowerCase()) ||
              (streamer.game && streamer.game.toLowerCase().includes(safeSearchTerm.toLowerCase()))
          );
          
          // Mock search results
          const gameResults = [
            { id: 'game1', name: 'Valorant', cover_url: 'https://picsum.photos/100/100?random=1' },
            { id: 'game2', name: 'Fortnite', cover_url: 'https://picsum.photos/100/100?random=2' },
            { id: 'game3', name: 'Apex Legends', cover_url: 'https://picsum.photos/100/100?random=3' },
            { id: 'game4', name: 'Call of Duty', cover_url: 'https://picsum.photos/100/100?random=4' },
            { id: 'game5', name: 'Minecraft', cover_url: 'https://picsum.photos/100/100?random=5' },
          ].filter(game => game.name.toLowerCase().includes(safeSearchTerm.toLowerCase()));
          
          setSearchResults({
            users: filtered.slice(0, 5),
            games: gameResults
          });
          
          setFilteredStreamers(filtered);
          setSearchLoading(false);
        }, 500);
        
        return () => clearTimeout(timeoutId);
      } else {
        setFilteredStreamers(streamers);
        setSearchResults({ users: [], games: [] });
      }
    } catch (error) {
      console.error('Error in search effect:', error);
      // Safe fallback
      setFilteredStreamers(streamers);
      setSearchResults({ users: [], games: [] });
    }
  }, [searchTerm, streamers]);

  // ----- Search Input Handler -----
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Always ensure we have a string, never undefined
    const value = e.target.value || '';
    setSearchTerm(value);
  };

  // ----- Debounced Search Function -----
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      // Ensure term is never undefined
      const safeTerm = term || '';
      if (!safeTerm || safeTerm.length < 2) {
        setSearchResults({ users: [], games: [] });
        setSearchLoading(false);
        return;
      }

      // Simulate API search with delay
      setSearchLoading(true);

      const timeoutId = setTimeout(() => {
        // Filter streamers by search term
        const filtered = streamers.filter(
          (streamer) =>
            streamer.display_name.toLowerCase().includes(safeTerm.toLowerCase()) ||
            (streamer.game && streamer.game.toLowerCase().includes(safeTerm.toLowerCase()))
        );

        // Mock search results
        const gameResults = [
          { id: 'game1', name: 'Valorant', cover_url: 'https://picsum.photos/100/100?random=1' },
          { id: 'game2', name: 'Fortnite', cover_url: 'https://picsum.photos/100/100?random=2' },
          { id: 'game3', name: 'Apex Legends', cover_url: 'https://picsum.photos/100/100?random=3' },
          { id: 'game4', name: 'Call of Duty', cover_url: 'https://picsum.photos/100/100?random=4' },
          { id: 'game5', name: 'Minecraft', cover_url: 'https://picsum.photos/100/100?random=5' },
        ].filter(game => game.name.toLowerCase().includes(safeTerm.toLowerCase()));

        setSearchResults({
          users: filtered.slice(0, 5),
          games: gameResults
        });

        setFilteredStreamers(filtered);
        setSearchLoading(false);
      }, 500);

      return () => clearTimeout(timeoutId);
    }, 500),
    [streamers]
  );

  // JSX Return Statement
  return (
    <div className="discovery-container">
      {showSpaceBackground && (
        <div className="space-background" style={{
          position: "fixed", 
          top: 0, 
          left: 0, 
          width: "100%", 
          height: "100%", 
          zIndex: -1
        }}>
          {/* Stars */}
          {stars.map(star => (
            <div 
              key={`star-${star.id}`}
              className="star"
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                top: `${star.top}%`,
                left: `${star.left}%`,
                '--twinkle-duration': `${star.duration}s`
              } as React.CSSProperties}
            />
          ))}
          
          {/* Shooting stars */}
          {shootingStars.map(star => (
            <div 
              key={`shooting-${star.id}`}
              className="shooting-star"
              style={{
                top: `${star.top}%`,
                left: `${star.left}%`,
                '--angle': `${star.angle}deg`,
                '--duration': `${star.duration}s`,
                '--delay': `${star.delay}s`
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="discovery-content p-4">
        <h1 className="text-2xl font-bold mb-6 text-center gradient-text py-2">
          Discovery Page
        </h1>
        
        <div className="mb-6">
          <div className="search-bar-container">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-orange-400" />
              </div>
              <Input
                type="search"
                placeholder="Search games, streamers..."
                className="pl-10 pr-10 py-6 bg-gaming-900/60 text-lg border-orange-800 focus:border-orange-500 search-glow"
                value={effectiveSearchTerm}
                onChange={handleSearchInputChange}
              />
              {effectiveSearchTerm.length > 0 && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-white" />
                </button>
              )}
            </div>
          </div>
          
          {searchLoading ? (
            <div className="flex justify-center my-4">
              <div className="loader-orange"></div>
            </div>
          ) : (
            effectiveSearchTerm.length >= 2 && (
              <div className="search-results mt-4">
                {searchResults.games.length > 0 && (
                  <div className="games-results mb-6">
                    <h3 className="text-lg font-medium mb-3 text-orange-400">Games</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {searchResults.games.map(game => (
                        <div
                          key={game.id}
                          className="game-card p-2 bg-gaming-800/60 rounded-lg cursor-pointer hover:bg-gaming-700/60 transition-all"
                          onClick={() => handleGameSelect(game.id, game.name)}
                        >
                          <div className="relative aspect-square mb-2 overflow-hidden rounded">
                            <img
                              src={game.cover_url}
                              alt={game.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-sm font-medium truncate text-center">{game.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {searchResults.users.length > 0 && (
                  <div className="streamers-results">
                    <h3 className="text-lg font-medium mb-3 text-orange-400">Streamers</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {searchResults.users.map(streamer => (
                        <div
                          key={streamer.id}
                          className="streamer-card p-2 bg-gaming-800/60 rounded-lg cursor-pointer hover:bg-gaming-700/60 transition-all"
                          onClick={() => {
                            setChatPartnerId(streamer.id);
                            setShowChat(true);
                          }}
                        >
                          <div className="relative aspect-square mb-2 overflow-hidden rounded-full mx-auto w-4/5">
                            <img
                              src={streamer.avatar_url}
                              alt={streamer.display_name}
                              className="w-full h-full object-cover"
                            />
                            {streamer.is_live && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 rounded-full border border-gaming-900"></div>
                            )}
                          </div>
                          <p className="text-sm font-medium truncate text-center">{streamer.display_name}</p>
                          {streamer.game && (
                            <p className="text-xs text-orange-400 truncate text-center">{streamer.game}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {searchResults.games.length === 0 && searchResults.users.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    No results found for "{effectiveSearchTerm}"
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* Tetris Animation */}
      {tetrisAnimation && (
        <div className="tetris-container">
          {/* Falling blocks with streamers */}
          {tetrisBlocks.map((block) => (
            <div
              key={block.id}
              className={`tetris-block ${block.shape}`}
              style={{
                left: `${block.left}%`,
                animationDuration: `${block.duration}s`,
                animationDelay: `${block.delay}s`,
                transform: `rotate(${block.rotate}deg)`,
                backgroundColor: block.color
              }}
            >
              <img src={block.streamer.avatar_url} alt={block.streamer.display_name} />
            </div>
          ))}

          {/* Base platform */}
          <div className="tetris-base"></div>

          {/* Clipt Logo */}
          <div className="tetris-logo">CLIPT</div>

          {/* Stacked blocks at bottom */}
          <div className="final-stack">
            {stacked.map((block) => (
              <div
                key={block.id}
                className={`tetris-block ${block.shape}`}
                style={{
                  left: `${block.position}%`,
                  backgroundColor: block.color
                }}
              >
                <img src={block.streamer.avatar_url} alt={block.streamer.display_name} />
                <div className="streamer-info">{block.streamer.display_name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Chat overlay with AnimatePresence */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-full h-full max-w-md mx-auto">
              <RealtimeChat
                partnerId={chatPartnerId || streamers[0]?.id || ''}
                partnerInfo={{
                  id: chatPartnerId || streamers[0]?.id || '',
                  username: streamers.find((s) => s.id === chatPartnerId)?.username || streamers[0]?.username || '',
                  displayName: streamers.find((s) => s.id === chatPartnerId)?.display_name || streamers[0]?.display_name || '',
                  avatarUrl: streamers.find((s) => s.id === chatPartnerId)?.avatar_url || streamers[0]?.avatar_url || '',
                }}
                onClose={() => setShowChat(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Live Streamers Section */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-3 flex items-center">
          <Sparkles size={16} className="mr-2 text-yellow-400" />
          <span className="gradient-text">Live Streamers</span>
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {streamers.slice(0, 6).map((streamer, index) => (
            <div
              key={`streamer-${streamer.id}`}
              className="channel-card rounded-lg overflow-hidden cursor-pointer"
              onClick={() => {
                setChatPartnerId(streamer.id);
                setShowChat(true);
              }}
            >
              <div className="relative flex flex-col justify-end" 
                style={{
                  backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.9), transparent), url(${streamer.avatar_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  height: '180px'
                }}>
                <div className="absolute top-2 right-2">
                  {streamer.is_live && (
                    <div className="audio-visualizer">
                      {[...Array(3)].map((_, i) => (
                        <div 
                          key={`viz-streamer-${streamer.id}-${i}`} 
                          className="audio-bar" 
                          style={{
                            '--index': i,
                            '--height': `${Math.floor(Math.random() * 15) + 5}px`,
                            '--speed': Math.random() * 1.2 + 0.3
                          } as React.CSSProperties}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="font-bold truncate">{streamer.display_name}</div>
                  <div className="text-xs text-gray-400 flex items-center justify-between">
                    <div>
                      {streamer.game && <span className="text-cyan-400 mr-1">{streamer.game}</span>}
                    </div>
                    <div>
                      <span className="text-orange-400">{Math.floor(streamer.follower_count / 1000)}K</span> followers
                    </div>
                  </div>
                  {streamer.is_live && (
                    <div className="mt-1 bg-red-500 text-white text-xs py-0.5 px-2 rounded flex items-center w-fit">
                      <div className="w-2 h-2 rounded-full bg-white mr-1 animate-pulse"></div>
                      LIVE
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiscoveryNew;
