import React, { useState, useEffect, useRef } from 'react';
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

      // Create shooting stars at intervals
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
      }, 4000);

      return () => {
        clearInterval(shootingStarInterval);
      };
    }
  }, [showSpaceBackground]);

  // Removed categories for bottom navigation as requested

  // Enhanced swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleNextPage(),
    onSwipedRight: () => handlePrevPage(),
    trackMouse: true,
    trackTouch: true,
    delta: 10,  // Lower threshold for swipe detection
    swipeDuration: 500  // Allow slightly longer swipes
  });

  // Function to handle navigation to game page
  const handleGameSelect = (gameId: string, gameName: string) => {
    navigate(`/game/${gameId}?name=${encodeURIComponent(gameName)}`);
  };

  // Page navigation handlers with horizontal scrolling support
  const handleNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(prevIndex => prevIndex + 1);
      
      // Scroll to next set of streamers if in horizontal streaming view
      const container = document.getElementById('streamer-scroll-container');
      if (container) {
        const scrollAmount = container.clientWidth;
        container.scrollBy({
          left: scrollAmount,
          behavior: 'smooth'
        });
      }
    } else {
      setCurrentPageIndex(0);
      
      // Scroll back to beginning
      const container = document.getElementById('streamer-scroll-container');
      if (container) {
        container.scrollTo({
          left: 0,
          behavior: 'smooth'
        });
      }
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prevIndex => prevIndex - 1);
      
      // Scroll to previous set of streamers
      const container = document.getElementById('streamer-scroll-container');
      if (container) {
        const scrollAmount = container.clientWidth;
        container.scrollBy({
          left: -scrollAmount,
          behavior: 'smooth'
        });
      }
    } else {
      setCurrentPageIndex(totalPages - 1);
      
      // Scroll to end
      const container = document.getElementById('streamer-scroll-container');
      if (container) {
        container.scrollTo({
          left: container.scrollWidth,
          behavior: 'smooth'
        });
      }
    }
  };

  // Handle touch events for better mobile experience
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touchX = e.touches[0].clientX;
      
      // Store initial touch position
      sessionStorage.setItem('touchStartX', touchX.toString());
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchStartX = Number(sessionStorage.getItem('touchStartX') || '0');
      const screenWidth = window.innerWidth;
      const swipeThreshold = screenWidth * 0.15; // 15% of screen width
      
      // Calculate swipe distance
      const swipeDistance = touchEndX - touchStartX;
      
      // Handle swipe based on distance
      if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0) {
          // Swipe right
          handlePrevPage();
        } else {
          // Swipe left
          handleNextPage();
        }
      }
    };

    // Add event listeners
    const contentElement = document.getElementById('discovery-content');
    if (contentElement) {
      contentElement.addEventListener('touchstart', handleTouchStart);
      contentElement.addEventListener('touchend', handleTouchEnd);
    }

    // Clean up
    return () => {
      if (contentElement) {
        contentElement.removeEventListener('touchstart', handleTouchStart);
        contentElement.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, []);

  // Initialize setup
  useEffect(() => {
    // Set trophies to 0 on the top Clipts page
    localStorage.setItem('clipt_trophies', '0');
    
    // Auto-play streams logic would be implemented here
    // In a real implementation, this would connect to a streaming service
    console.log('Auto-playing streams initialized');
  }, []);

  // Mock data for streamers and channels
  useEffect(() => {
    // This would be fetched from an API in a real app
    const mockStreamers: Streamer[] = [
      {
        id: '1',
        username: 'coolstreamer',
        display_name: 'Cool Streamer',
        avatar_url: 'https://placehold.co/400x400/121212/6F4CFF?text=CS',
        is_live: true,
        follower_count: 1200,
        game: 'Fortnite',
        clips: []
      },
      {
        id: '2',
        username: 'progamer',
        display_name: 'Pro Gamer',
        avatar_url: 'https://placehold.co/400x400/121212/FF4CFF?text=PG',
        is_live: true,
        follower_count: 5600,
        game: 'Call of Duty',
        clips: []
      },
      {
        id: '3',
        username: 'casualgamer',
        display_name: 'Casual Gamer',
        avatar_url: 'https://placehold.co/400x400/121212/4CFF4C?text=CG',
        is_live: false,
        follower_count: 890,
        game: 'Minecraft',
        clips: []
      },
      {
        id: '4',
        username: 'speedrunner',
        display_name: 'Speed Runner',
        avatar_url: 'https://placehold.co/400x400/121212/4CFFFF?text=SR',
        is_live: true,
        follower_count: 3400,
        game: 'Super Mario 64',
        clips: []
      },
      {
        id: '5',
        username: 'rpglover',
        display_name: 'RPG Lover',
        avatar_url: 'https://placehold.co/400x400/121212/FF4C4C?text=RL',
        is_live: true,
        follower_count: 2100,
        game: 'Final Fantasy XVI',
        clips: []
      },
      {
        id: '6',
        username: 'strategymastermind',
        display_name: 'Strategy Mastermind',
        avatar_url: 'https://placehold.co/400x400/121212/FFFF4C?text=SM',
        is_live: true,
        follower_count: 1800,
        game: 'Civilization VI',
        clips: []
      }
    ];

    setStreamers(mockStreamers);

    // Generate mock channels (4 pages of content)
    const mockChannels: Channel[] = [
      {
        id: '1',
        name: 'Late Night Gaming',
        description: 'Chill vibes and late night gaming sessions',
        thumbnail: 'https://placehold.co/640x360/151030/6F4CFF?text=Late+Night',
        type: 'chill',
        viewers: 1200
      },
      {
        id: '2',
        name: 'Competitive FPS',
        description: 'High-skill FPS gameplay',
        thumbnail: 'https://placehold.co/640x360/301510/FF4C4C?text=FPS',
        type: 'fps',
        viewers: 3500
      },
      {
        id: '3',
        name: 'Speedrunning',
        description: 'Fastest game completions',
        thumbnail: 'https://placehold.co/640x360/103015/4CFF4C?text=Speed',
        type: 'speed',
        viewers: 1800
      },
      {
        id: '4',
        name: 'Game Development',
        description: 'Watch games being made',
        thumbnail: 'https://placehold.co/640x360/101530/4C4CFF?text=Game+Dev',
        type: 'dev',
        viewers: 950
      },
      {
        id: '5',
        name: 'Battle Royale Pros',
        description: 'Competitive battle royale action',
        thumbnail: 'https://placehold.co/640x360/152030/6FFF4C?text=Battle+Royale',
        type: 'battle',
        viewers: 3200
      },
      {
        id: '6',
        name: 'RPG Quests',
        description: 'Epic role-playing adventures',
        thumbnail: 'https://placehold.co/640x360/301520/FF8C4C?text=RPG+Quests',
        type: 'rpg',
        viewers: 1450
      },
      {
        id: '7',
        name: 'Strategy Masters',
        description: 'Big brain strategy gameplay',
        thumbnail: 'https://placehold.co/640x360/253010/FFFF4C?text=Strategy',
        type: 'strategy',
        viewers: 1100
      },
      {
        id: '8',
        name: 'Fighting Games',
        description: 'Competitive fighting game tournaments',
        thumbnail: 'https://placehold.co/640x360/301025/FF4CFF?text=Fighting',
        type: 'fighting',
        viewers: 2200
      }
    ];
    
    setAllChannels(mockChannels);
    setChannels(mockChannels.slice(0, 4));
    setTotalPages(Math.ceil(mockChannels.length / 4));
  }, []);

  // Process streamer data when it changes
  useEffect(() => {
    // First filter by search term if provided
    let filtered = searchTerm.trim()
      ? streamers.filter(s => 
          s.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.game && s.game.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : streamers;
    
    // Then filter based on selected type
    if (selectedStreamType !== 'all') {
      filtered = filtered.filter(s => s.game && s.game.toLowerCase().includes(selectedStreamType));
    }
    
    // Always limit to 4 streamers maximum
    setFilteredStreamers(filtered.slice(0, 4));
  }, [streamers, selectedStreamType, searchTerm]);

  // Function to start the Tetris animation
  const startTetrisAnimation = () => {
    if (!streamers || streamers.length === 0) return;
    
    // Clear existing blocks
    setTetrisBlocks([]);
    setStacked([]);
    
    // Generate initial blocks
    generateNewBlocks();
    
    // Set up interval to continuously add new blocks
    if (tetrisIntervalRef.current) {
      clearInterval(tetrisIntervalRef.current);
    }
    
    tetrisIntervalRef.current = setInterval(() => {
      if (tetrisAnimation) {
        generateNewBlocks();
      }
    }, 2000); // Generate new blocks every 2 seconds
  };
  
  // Clean up animation when component unmounts or animation stops
  useEffect(() => {
    if (tetrisAnimation) {
      startTetrisAnimation();
    } else {
      if (tetrisIntervalRef.current) {
        clearInterval(tetrisIntervalRef.current);
        tetrisIntervalRef.current = null;
      }
    }
    
    return () => {
      if (tetrisIntervalRef.current) {
        clearInterval(tetrisIntervalRef.current);
        tetrisIntervalRef.current = null;
      }
    };
  }, [tetrisAnimation]);
  
  // Function to generate new blocks
  const generateNewBlocks = () => {
    if (!tetrisAnimation || !streamers || streamers.length === 0) return;
    
    const shapes = ['t-shape', 'l-shape', 'z-shape', 'square', 'i-shape'];
    const colors = [
      'linear-gradient(135deg, #6f4cff, #4c4cff)',
      'linear-gradient(135deg, #ff4cff, #b44cff)',
      'linear-gradient(135deg, #4cffc4, #4cffff)',
      'linear-gradient(135deg, #ff4c4c, #ff4c94)',
      'linear-gradient(135deg, #ffda4c, #ffa74c)'
    ];
    
    // Create 1-3 new blocks
    const numberOfBlocks = Math.floor(Math.random() * 3) + 1;
    const newBlocks: TetrisBlock[] = [];
    
    for (let i = 0; i < numberOfBlocks; i++) {
      // Select a random streamer
      const randomStreamerIndex = Math.floor(Math.random() * streamers.length);
      const randomStreamer = streamers[randomStreamerIndex];
      
      // Create a new block
      newBlocks.push({
        id: `block-${Date.now()}-${i}`,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        left: Math.random() * 80 + 10, // Position between 10% and 90% of screen width
        duration: Math.random() * 3 + 4, // Fall duration between 4-7 seconds
        delay: Math.random() * 0.5, // Small random delay
        rotate: Math.floor(Math.random() * 360), // Random rotation
        streamer: randomStreamer
      });
    }
    
    // Add new blocks to state
    setTetrisBlocks(prev => [...prev, ...newBlocks]);
  };
  
  // Function to shuffle existing blocks
  const shuffleBlocks = () => {
    setTetrisBlocks(prev => {
      return prev.map(block => ({
        ...block,
        left: Math.random() * 80 + 10, // New random position
        rotate: Math.floor(Math.random() * 360) // New random rotation
      }));
    });
  };
  
  // Function to handle when a block has landed
  const handleBlockLanded = (landedBlock: TetrisBlock) => {
    // Remove the block from falling blocks
    setTetrisBlocks(prev => prev.filter(block => block.id !== landedBlock.id));
    
    // Add the block to stacked blocks
    setStacked(prev => [
      ...prev,
      {
        id: landedBlock.id,
        shape: landedBlock.shape,
        color: landedBlock.color,
        position: landedBlock.left,
        streamer: landedBlock.streamer
      }
    ]);
    
    // Limit stacked blocks to 10 (optional)
    if (stacked.length > 10) {
      setStacked(prev => prev.slice(-10));
    }
  };

  // Handle search input change with debounce
  const handleSearch = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, 300);

  // Navigate to advanced search page
  const navigateToAdvancedSearch = () => {
    navigate('/search');
  };
          height: '100%',
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
                className="stream-block bg-gaming-800 rounded-md p-3 border border-purple-900/30 hover:border-purple-500/50 transition-all"
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
                animation: 'fallAnimation ' + block.duration + 's linear ' + block.delay + 's forwards',
                transform: `rotate(${block.rotate}deg)`
              }}
              onAnimationEnd={() => handleBlockLanded(block)}
            >
              <img 
                src={block.streamer.avatar_url} 
                alt={block.streamer.display_name} 
              />
              <div className="streamer-info">
                {block.streamer.display_name}
              </div>
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
                  background: block.color
                }}
              >
                <img 
                  src={block.streamer.avatar_url} 
                  alt={block.streamer.display_name} 
                />
                <div className="streamer-info">
                  {block.streamer.display_name}
                </div>
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
                  username: streamers.find(s => s.id === chatPartnerId)?.username || streamers[0]?.username || '',
                  displayName: streamers.find(s => s.id === chatPartnerId)?.display_name || streamers[0]?.display_name || '',
                  avatarUrl: streamers.find(s => s.id === chatPartnerId)?.avatar_url || streamers[0]?.avatar_url || ''
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
                        <span className="text-purple-400">{Math.floor(streamer.follower_count / 1000)}K</span> followers
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
    </div>
  );
};

export default DiscoveryNew;
