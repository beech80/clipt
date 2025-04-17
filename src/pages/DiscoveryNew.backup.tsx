import React, { useState, useEffect, useRef, useCallback } from 'react';
import { css } from 'styled-components';
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const tetrisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showSpaceBackground, setShowSpaceBackground] = useState(true);
  const [stars, setStars] = useState<{id: number, size: number, top: number, left: number, duration: number}[]>([]);
  const [shootingStars, setShootingStars] = useState<{id: number, top: number, left: number, angle: number, duration: number, delay: number}[]>([]);
  
  // State management
  const [activeTab, setActiveTab] = useState('discover');
  const [showChat, setShowChat] = useState(false);
  const [chatPartnerId, setChatPartnerId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // Ensure searchTerm is always a string
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
  
  // Tetris animation states
  const [tetrisAnimation, setTetrisAnimation] = useState(false);
  const [animatingBlocks, setAnimatingBlocks] = useState(false);
  const [tetrisBlocks, setTetrisBlocks] = useState<TetrisBlock[]>([]);
  const [stacked, setStacked] = useState<StackedBlock[]>([]);
  
  // Add mobile styles to head
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = mobileStyles;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Initialize space background
  useEffect(() => {
    if (showSpaceBackground) {
      // Create stars
      const newStars = [];
      for (let i = 0; i < 100; i++) {
        newStars.push({
          id: i,
          size: Math.random() * 3 + 1,
          top: Math.random() * 100,
          left: Math.random() * 100,
          duration: Math.random() * 3 + 2
        });
      }
      setStars(newStars);

      // Create shooting stars periodically
      const shootingStarInterval = setInterval(() => {
        const newShootingStar = {
          id: Date.now(),
          top: Math.random() * 70,
          left: Math.random() * 30,
          angle: Math.random() * 20 - 10,
          duration: Math.random() * 2 + 1,
          delay: Math.random() * 0.5
        };
        setShootingStars(prev => [...prev.slice(-4), newShootingStar]);
      }, 3000);

      return () => {
        clearInterval(shootingStarInterval);
      };
    }
  }, [showSpaceBackground]);

  // Enhanced swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleNextPage(),
    onSwipedRight: () => handlePrevPage(),
  });

  // Initialize streamers and channel data
  useEffect(() => {
    // Mock data for streamers
    const mockStreamers: Streamer[] = Array.from({ length: 24 }, (_, i) => ({
      id: `streamer-${i}`,
      username: `gamer${i}`,
      display_name: `Pro Gamer ${i}`,
      avatar_url: `https://randomuser.me/api/portraits/${i % 2 ? 'men' : 'women'}/${i + 1}.jpg`,
      is_live: Math.random() > 0.5,
      follower_count: Math.floor(Math.random() * 50000),
      bio: `I'm a professional gamer specializing in FPS and RPG games.`,
      game: ['Fortnite', 'Minecraft', 'Call of Duty', 'Apex Legends', 'Valorant'][Math.floor(Math.random() * 5)]
    }));
    setStreamers(mockStreamers);
    setFilteredStreamers(mockStreamers);

    // Mock data for channels
    const mockChannels: Channel[] = Array.from({ length: 20 }, (_, i) => ({
      id: `channel-${i}`,
      name: `Gaming Channel ${i}`,
      description: `This is a channel about gaming, streaming, and having fun with friends.`,
      thumbnail: `https://picsum.photos/300/200?random=${i}`,
      type: ['gameplay', 'tutorial', 'review', 'livestream'][Math.floor(Math.random() * 4)],
      viewers: Math.floor(Math.random() * 10000)
    }));
    setChannels(mockChannels);
    setAllChannels(mockChannels);
    
    // Set total pages based on mock data length
    setTotalPages(Math.ceil(mockStreamers.length / 8));
    
    // Add touch event listeners for mobile scrolling
    const contentElement = document.getElementById('streamer-scroll-container');
    if (contentElement) {
      contentElement.addEventListener('touchstart', handleTouchStart);
      contentElement.addEventListener('touchend', handleTouchEnd);
    }
    
    return () => {
      if (contentElement) {
        contentElement.removeEventListener('touchstart', handleTouchStart);
        contentElement.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, []);

  // Function to handle navigation to game page
  const handleGameSelect = (gameId: string, gameName: string) => {
    navigate(`/game/${gameId}?name=${encodeURIComponent(gameName)}`);
  };

  // Page navigation handlers with horizontal scrolling support
  const handleNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      const container = containerRef.current;
      if (container) {
        // Store current scroll position
        const currentScroll = container.scrollLeft;
        
        // Add smooth scrolling class
        container.classList.add('smooth-scroll');
        
        // Scroll to next page
        container.scrollLeft = currentScroll + container.clientWidth;
        
        // Remove smooth scrolling after animation
        setTimeout(() => {
          container.classList.remove('smooth-scroll');
        }, 500);
      }
      
      setCurrentPageIndex(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      const container = containerRef.current;
      if (container) {
        // Store current scroll position
        const currentScroll = container.scrollLeft;
        
        // Add smooth scrolling class
        container.classList.add('smooth-scroll');
        
        // Scroll to previous page
        container.scrollLeft = currentScroll - container.clientWidth;
        
        // Remove smooth scrolling after animation
        setTimeout(() => {
          container.classList.remove('smooth-scroll');
        }, 500);
      }
      
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  // Touch event handlers for mobile swipe
  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const startX = touch.clientX;
      const startY = touch.clientY;
      
      (e.currentTarget as HTMLDivElement).dataset.touchStartX = startX.toString();
      (e.currentTarget as HTMLDivElement).dataset.touchStartY = startY.toString();
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;
      
      const startX = parseInt((e.currentTarget as HTMLDivElement).dataset.touchStartX || '0');
      const startY = parseInt((e.currentTarget as HTMLDivElement).dataset.touchStartY || '0');
      
      const diffX = endX - startX;
      const diffY = endY - startY;
      
      // If horizontal swipe is greater than vertical swipe and exceeds threshold
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
          // Swipe right
          handlePrevPage();
        } else {
          // Swipe left
          handleNextPage();
        }
      }
    }
  };

  // Effect to start tetris animation on component mount
  useEffect(() => {
    setTimeout(() => {
      // Uncomment to auto-start animation
      // startTetrisAnimation();
    
    setCurrentPageIndex(prev => prev + 1);
  }
};

const handlePrevPage = () => {
  if (currentPageIndex > 0) {
    const container = containerRef.current;
    if (container) {
      // Store current scroll position
      const currentScroll = container.scrollLeft;
      
      // Add smooth scrolling class
      container.classList.add('smooth-scroll');
      
      // Scroll to previous page
      container.scrollLeft = currentScroll - container.clientWidth;
      
      // Remove smooth scrolling after animation
      setTimeout(() => {
        container.classList.remove('smooth-scroll');
      }, 500);
    }
    
    setCurrentPageIndex(prev => prev - 1);
  }
};

// Touch event handlers for mobile swipe
const handleTouchStart = (e: TouchEvent) => {
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    
    (e.currentTarget as HTMLDivElement).dataset.touchStartX = startX.toString();
    (e.currentTarget as HTMLDivElement).dataset.touchStartY = startY.toString();
  }
};

const handleTouchEnd = (e: TouchEvent) => {
  if (e.changedTouches.length === 1) {
    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    
    const startX = parseInt((e.currentTarget as HTMLDivElement).dataset.touchStartX || '0');
    const startY = parseInt((e.currentTarget as HTMLDivElement).dataset.touchStartY || '0');
    
    const diffX = endX - startX;
    const diffY = endY - startY;
    
    // If horizontal swipe is greater than vertical swipe and exceeds threshold
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        // Swipe right
        handlePrevPage();
      } else {
        // Swipe left
        handleNextPage();
      }
    }
  }
};

// Effect to start tetris animation on component mount
useEffect(() => {
  setTimeout(() => {
    // Uncomment to auto-start animation
    // startTetrisAnimation();
  }, 1000);
  
  return () => {
    if (tetrisIntervalRef.current) {
      clearInterval(tetrisIntervalRef.current);
      tetrisIntervalRef.current = null;
    }
  };
}, []);

// Effect to handle search and filtering
useEffect(() => {
  // Use the globally defined effectiveSearchTerm from above, no need to redefine
  if (effectiveSearchTerm.length >= 2) {
    // Simulate API search with delay
    setSearchLoading(true);
    
    const timeoutId = setTimeout(() => {
      // Filter streamers by search term
      const filtered = streamers.filter(
        (streamer) =>
          streamer.display_name.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
          (streamer.game && streamer.game.toLowerCase().includes(effectiveSearchTerm.toLowerCase()))
      );
      
      // Mock search results
      const gameResults = [
        { id: 'game1', name: 'Valorant', cover_url: 'https://picsum.photos/100/100?random=1' },
        { id: 'game2', name: 'Fortnite', cover_url: 'https://picsum.photos/100/100?random=2' },
        { id: 'game3', name: 'Apex Legends', cover_url: 'https://picsum.photos/100/100?random=3' },
        { id: 'game4', name: 'Call of Duty', cover_url: 'https://picsum.photos/100/100?random=4' },
        { id: 'game5', name: 'Minecraft', cover_url: 'https://picsum.photos/100/100?random=5' },
      ].filter(game => game.name.toLowerCase().includes(effectiveSearchTerm.toLowerCase()));
      
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
}, [searchTerm, streamers]);

const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value || '';
  setSearchTerm(value);
};

// Debounce search to avoid excessive API calls
const debouncedSearch = useCallback(
  debounce(async (term) => {
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
                '--delay': `${star.delay}s`,
                '--rotate': `rotate(${star.angle}deg)`
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="discovery-content p-4">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="streamer-scroll-container">
          {filteredStreamers && filteredStreamers.length > 0 ? (
            filteredStreamers.map(streamer => (
              <div 
                key={streamer.id} 
                className="stream-block bg-gaming-800 rounded-md p-3 border border-orange-900/30 hover:border-orange-500/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gaming-700 flex items-center justify-center overflow-hidden">
                      {streamer.avatar_url ? (
                        <img src={streamer.avatar_url} alt={streamer.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{streamer.display_name.charAt(0)}</span>
                      )}
                    </div>
                    {streamer.is_live && (
                      <div className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full border border-gaming-800"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-md font-semibold">{streamer.display_name}</h3>
                    <p className="text-xs text-gray-400">{streamer.game}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-8 text-gray-400">
              No streamers found matching your criteria
            </div>
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
                background: block.color,
                animation: `fallAnimation ${block.duration}s linear ${block.delay}s forwards`,
                transform: `rotate(${block.rotate}deg)`,
              }}
              onAnimationEnd={() => handleBlockLanded(block)}
            >
              <img src={block.streamer.avatar_url} alt={block.streamer.display_name} />
              <div className="streamer-info">{block.streamer.display_name}</div>
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
                  bottom: '8px',
                  background: block.color,
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
