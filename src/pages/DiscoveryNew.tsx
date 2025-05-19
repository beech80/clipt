import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown, 
  MessageCircle, 
  Heart, 
  Share2, 
  Sparkles, 
  Gamepad, 
  Zap, 
  DollarSign, 
  UserPlus, 
  Scissors, 
  Monitor, 
  Tv, 
  Maximize2, 
  Camera, 
  Video, 
  Star, 
  Rocket, 
  Gift, 
  Award, 
  ArrowLeft 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import RealtimeChat from '@/components/messages/RealtimeChat';
import { debounce } from 'lodash';
import '../styles/discovery-retro.css';

// Define interfaces for our data types
interface Streamer {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  stream_url?: string; // For video source
  is_live: boolean;
  follower_count: number;
  bio?: string;
  game?: string;
  viewer_count?: number;
}

interface Game {
  id: string;
  name: string;
  cover_url: string;
  popularity?: number;
}

interface Clipt {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  game?: string;
  like_count: number;
  view_count: number;
  created_at: string;
}

const DiscoveryNew: React.FC = () => {
  const navigate = useNavigate();
  const swipeContainerRef = useRef<HTMLDivElement>(null);
  
  // Basic state management
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<'all' | 'users' | 'games'>('all');
  const [searchResults, setSearchResults] = useState<{
    users: Array<{
      id: string;
      username: string;
      display_name: string;
      avatar_url: string;
      followers: number;
      isLive?: boolean;
      is_live?: boolean;
      game?: string;
    }>;
    games: Array<{
      id: string;
      name: string;
      cover_url: string;
      viewers: number;
    }>;
  }>({users: [], games: []});
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Function to navigate to search page
  const goToSearchPage = () => {
    console.log("Navigating to search page");
    navigate('/search');
  };
  
  // Content states
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [clipts, setClipts] = useState<Clipt[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Mixed feed for game-specific content
  const [gameContent, setGameContent] = useState<(Streamer | Clipt)[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isGameView, setIsGameView] = useState(false);
  
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatPartnerId, setChatPartnerId] = useState<string>('');
  const [showSubscriptionTiers, setShowSubscriptionTiers] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showClipModal, setShowClipModal] = useState(false);
  const [clipDuration, setClipDuration] = useState(60); // Default to 60 seconds
  const [clipTitle, setClipTitle] = useState('');
  const [isClipping, setIsClipping] = useState(false);
  const [clipPreviewUrl, setClipPreviewUrl] = useState('');
  const [clipId, setClipId] = useState('');
  const [sendToChat, setSendToChat] = useState(true);
  const [donationAmount, setDonationAmount] = useState(5);
  const [donationMessage, setDonationMessage] = useState('');

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setSearchQuery(newSearchTerm);
    
    if (newSearchTerm.length >= 2) {
      setSearchLoading(true);
      setIsSearching(true);
      // Simulate search API call
      setTimeout(() => {
        // Filter games by name
        const filteredGames = games.filter(game => 
          game.name.toLowerCase().includes(newSearchTerm.toLowerCase())
        );
        
        // Filter streamers by name or username
        const filteredStreamers = streamers.filter(streamer => 
          streamer.display_name.toLowerCase().includes(newSearchTerm.toLowerCase()) ||
          streamer.username.toLowerCase().includes(newSearchTerm.toLowerCase())
        ).map(streamer => ({
          ...streamer,
          isLive: streamer.is_live
        }));
        
        setSearchResults({
          games: filteredGames,
          users: filteredStreamers
        });
        
        setSearchLoading(false);
        setIsSearching(false);
      }, 500); // Simulate network delay
    }
  };

  // Debounced search function
  const debouncedSearch = useRef(
    debounce((term: string) => {
      if (term.length >= 2) {
        setSearchLoading(true);
        // Simulate search API call
        setTimeout(() => {
          const filteredGames = games.filter(game =>
            game.name.toLowerCase().includes(term.toLowerCase())
          );
          const filteredStreamers = streamers.filter(
            streamer =>
              streamer.display_name.toLowerCase().includes(term.toLowerCase()) ||
              (streamer.game && streamer.game.toLowerCase().includes(term.toLowerCase()))
          );
          
          setSearchResults({
            users: filteredStreamers,
            games: filteredGames
          });
          setSearchLoading(false);
        }, 500);
      }
    }, 300)
  ).current;

  // Handle game selection for dedicated game feed
  const handleGameSelect = (gameId: string, gameName: string) => {
    const selectedGame = games.find(g => g.id === gameId) || {
      id: gameId,
      name: gameName,
      cover_url: ''
    };
    
    setSelectedGame(selectedGame);
    
    // Create mixed content feed of streamers and clipts for this game
    const gameStreamers = streamers.filter(s => s.game?.toLowerCase() === gameName.toLowerCase());
    const gameClipts = clipts.filter(c => c.game?.toLowerCase() === gameName.toLowerCase());
    
    // Interleave streamers and clipts
    const mixedContent: (Streamer | Clipt)[] = [];
    const maxLength = Math.max(gameStreamers.length, gameClipts.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (i < gameStreamers.length) mixedContent.push(gameStreamers[i]);
      if (i < gameClipts.length) mixedContent.push(gameClipts[i]);
    }
    
    setGameContent(mixedContent);
    setIsGameView(true);
    setSearchModalOpen(false);
    setCurrentIndex(0);
  };
  
  // Handle swipe gestures
  const handleSwipe = (direction: number) => {
    const contentArray = isGameView ? gameContent : streamers;
    if (contentArray.length === 0) return;
    
    let newIndex = currentIndex + direction;
    
    // Loop back to start/end when reaching the boundaries
    if (newIndex < 0) newIndex = contentArray.length - 1;
    if (newIndex >= contentArray.length) newIndex = 0;
    
    setCurrentIndex(newIndex);
  };
  
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: {offset: {x: number}}) => {
    if (Math.abs(info.offset.x) > 100) {
      if (info.offset.x > 0) {
        handleSwipe(-1); // Swipe right, previous item
      } else {
        handleSwipe(1); // Swipe left, next item
      }
    }
  };

  // Load sample data
  useEffect(() => {
    // Sample streamers with video URLs
    const sampleStreamers: Streamer[] = [
      {
        id: '1',
        username: 'progamer',
        display_name: 'ProGamer',
        avatar_url: 'https://picsum.photos/200/200?random=1',
        stream_url: 'https://assets.mixkit.co/videos/preview/mixkit-gaming-arcade-160.mp4',
        is_live: true,
        follower_count: 5300,
        viewer_count: 1200,
        game: 'Fortnite'
      },
      {
        id: '2',
        username: 'streamer2',
        display_name: 'Epic Gamer',
        avatar_url: 'https://picsum.photos/200/200?random=2',
        stream_url: 'https://assets.mixkit.co/videos/preview/mixkit-animation-of-futuristic-devices-99786.mp4',
        is_live: true,
        follower_count: 12800,
        viewer_count: 3500,
        game: 'Minecraft'
      },
      {
        id: '3',
        username: 'gamer3',
        display_name: 'GameMaster',
        avatar_url: 'https://picsum.photos/200/200?random=3',
        stream_url: 'https://assets.mixkit.co/videos/preview/mixkit-top-aerial-shot-of-seashore-with-rocks-1090.mp4',
        is_live: true,
        follower_count: 7600,
        viewer_count: 890,
        game: 'Call of Duty'
      },
      {
        id: '4',
        username: 'streamer4',
        display_name: 'LegendPlayer',
        avatar_url: 'https://picsum.photos/200/200?random=4',
        stream_url: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-playing-a-racing-video-game-143.mp4',
        is_live: true,
        follower_count: 9400,
        viewer_count: 2200,
        game: 'League of Legends'
      },
      {
        id: '5',
        username: 'gamer5',
        display_name: 'ProStreamer',
        avatar_url: 'https://picsum.photos/200/200?random=5',
        stream_url: 'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4',
        is_live: true,
        follower_count: 15200,
        viewer_count: 4100,
        game: 'Valorant'
      },
      {
        id: '6',
        username: 'player6',
        display_name: 'TopPlayer',
        avatar_url: 'https://picsum.photos/200/200?random=6',
        stream_url: 'https://assets.mixkit.co/videos/preview/mixkit-man-playing-games-with-a-pad-controller-54-large.mp4',
        is_live: true,
        follower_count: 4800,
        viewer_count: 740,
        game: 'Among Us'
      }
    ];

    // Sample games
    const sampleGames: Game[] = [
      {
        id: 'game1',
        name: 'Fortnite',
        cover_url: 'https://picsum.photos/200/300?random=10',
        popularity: 95
      },
      {
        id: 'game2',
        name: 'Minecraft',
        cover_url: 'https://picsum.photos/200/300?random=11',
        popularity: 92
      },
      {
        id: 'game3',
        name: 'Call of Duty',
        cover_url: 'https://picsum.photos/200/300?random=12',
        popularity: 89
      },
      {
        id: 'game4',
        name: 'League of Legends',
        cover_url: 'https://picsum.photos/200/300?random=13',
        popularity: 87
      },
      {
        id: 'game5',
        name: 'Valorant',
        cover_url: 'https://picsum.photos/200/300?random=14',
        popularity: 85
      },
      {
        id: 'game6',
        name: 'Among Us',
        cover_url: 'https://picsum.photos/200/300?random=15',
        popularity: 80
      }
    ];
    
    // Sample clipts
    const sampleClipts: Clipt[] = [
      {
        id: 'clipt1',
        title: 'Amazing Fortnite Victory Royale!',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-playing-a-game-console-having-fun-4010.mp4',
        thumbnail_url: 'https://picsum.photos/200/300?random=20',
        user: {
          id: '1',
          username: 'progamer',
          display_name: 'ProGamer',
          avatar_url: 'https://picsum.photos/200/200?random=1',
        },
        game: 'Fortnite',
        like_count: 1250,
        view_count: 45000,
        created_at: '2025-04-10T14:30:00Z'
      },
      {
        id: 'clipt2',
        title: 'Minecraft Epic Build Complete!',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-excited-young-man-playing-video-games-42420.mp4',
        thumbnail_url: 'https://picsum.photos/200/300?random=21',
        user: {
          id: '2',
          username: 'streamer2',
          display_name: 'Epic Gamer',
          avatar_url: 'https://picsum.photos/200/200?random=2',
        },
        game: 'Minecraft',
        like_count: 982,
        view_count: 32000,
        created_at: '2025-04-11T10:15:00Z'
      },
      {
        id: 'clipt3',
        title: 'Call of Duty Killstreak!',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-playing-a-game-with-a-console-1829.mp4',
        thumbnail_url: 'https://picsum.photos/200/300?random=22',
        user: {
          id: '3',
          username: 'gamer3',
          display_name: 'GameMaster',
          avatar_url: 'https://picsum.photos/200/200?random=3',
        },
        game: 'Call of Duty',
        like_count: 750,
        view_count: 28000,
        created_at: '2025-04-12T09:45:00Z'
      },
      {
        id: 'clipt4',
        title: 'League of Legends Pentakill!',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-excited-woman-playing-a-video-game-on-tv-4008.mp4',
        thumbnail_url: 'https://picsum.photos/200/300?random=23',
        user: {
          id: '4',
          username: 'streamer4',
          display_name: 'LegendPlayer',
          avatar_url: 'https://picsum.photos/200/200?random=4',
        },
        game: 'League of Legends',
        like_count: 1050,
        view_count: 38000,
        created_at: '2025-04-09T18:20:00Z'
      },
      {
        id: 'clipt5',
        title: 'Valorant Ace Clutch!',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-gamer-playing-on-a-tv-4026.mp4',
        thumbnail_url: 'https://picsum.photos/200/300?random=24',
        user: {
          id: '5',
          username: 'gamer5',
          display_name: 'ProStreamer',
          avatar_url: 'https://picsum.photos/200/200?random=5',
        },
        game: 'Valorant',
        like_count: 890,
        view_count: 31000,
        created_at: '2025-04-08T21:10:00Z'
      },
      {
        id: 'clipt6',
        title: 'Among Us Perfect Imposter Play!',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-young-man-playing-a-racing-video-game-144.mp4',
        thumbnail_url: 'https://picsum.photos/200/300?random=25',
        user: {
          id: '6',
          username: 'player6',
          display_name: 'TopPlayer',
          avatar_url: 'https://picsum.photos/200/200?random=6',
        },
        game: 'Among Us',
        like_count: 620,
        view_count: 22000,
        created_at: '2025-04-07T15:35:00Z'
      }
    ];

    setStreamers(sampleStreamers);
    setGames(sampleGames);
    setClipts(sampleClipts);

    // Simulate search results
    setSearchResults({
      users: sampleStreamers.slice(0, 3),
      games: sampleGames.slice(0, 3)
    });

  }, []);

  // Effect to trigger search
  useEffect(() => {
    if (searchTerm.length >= 2) {
      debouncedSearch(searchTerm);
    }
  }, [searchTerm, debouncedSearch]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handleSwipe(-1);
      } else if (e.key === 'ArrowRight') {
        handleSwipe(1);
      } else if (e.key === 'Escape') {
        setSearchModalOpen(false);
        setShowChat(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isGameView]);

  return (
    <div className="discovery-container">
      {/* Subtle Background Effects */}
      <div className="scanlines"></div>
      <div className="crt-effect"></div>
      
      {/* Main Content - TikTok-style full screen swipeable content */}
      <div className="discovery-feed-container">
        {/* Header with search icon */}
        <div className="discovery-header">
          <div className="discovery-header-content" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            {isGameView && (
              <button
                className="back-button"
                onClick={() => {
                  setIsGameView(false);
                  setSelectedGame(null);
                }}
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
            )}
            <h1 className="discovery-title" style={{ textAlign: 'center', margin: '0 auto' }}>
              {isGameView ? `${selectedGame?.name} CLIPTS` : 'DISCOVERY'}
            </h1>
          </div>
          <button 
            className="search-button" 
            onClick={goToSearchPage}
            style={{ 
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
          >
            <Search size={20} color="#FF7700" />
          </button>
        </div>
        
        {/* Swipeable Video Feed */}
        <motion.div 
          className="video-feed"
          ref={swipeContainerRef}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
        >
          {/* Current Video - Full Screen */}
          <div className="video-container">
            {isGameView ? (
              // Game-specific mixed content (clipts and streams)
              gameContent.length > 0 && currentIndex < gameContent.length ? (
                'stream_url' in gameContent[currentIndex] ? (
                  // It's a streamer
                  <div className="stream-wrapper">
                    <video 
                      src={(gameContent[currentIndex] as Streamer).stream_url} 
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                      className="stream-video"
                    />
                    <div className="streamer-info">
                      <div className="streamer-profile">
                        <img 
                          src={(gameContent[currentIndex] as Streamer).avatar_url} 
                          alt={(gameContent[currentIndex] as Streamer).display_name}
                          className="profile-avatar"
                        />
                        <div className="streamer-details">
                          <h3>{(gameContent[currentIndex] as Streamer).display_name}</h3>
                          <p>{(gameContent[currentIndex] as Streamer).game}</p>
                          <div className="view-count">
                            {(gameContent[currentIndex] as Streamer).viewer_count?.toLocaleString()} viewers
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // It's a clipt
                  <div className="clipt-wrapper">
                    <video 
                      src={(gameContent[currentIndex] as Clipt).video_url} 
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                      className="clipt-video"
                    />
                    <div className="clipt-info">
                      <div className="user-profile">
                        <img 
                          src={(gameContent[currentIndex] as Clipt).user.avatar_url} 
                          alt={(gameContent[currentIndex] as Clipt).user.display_name}
                          className="profile-avatar"
                        />
                        <div className="user-details">
                          <h3>{(gameContent[currentIndex] as Clipt).user.display_name}</h3>
                          <p>{(gameContent[currentIndex] as Clipt).title}</p>
                          <div className="view-count">
                            {(gameContent[currentIndex] as Clipt).view_count.toLocaleString()} views
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="empty-content">
                  <div className="empty-message">
                    <p>No content found for {selectedGame?.name}</p>
                  </div>
                </div>
              )
            ) : (
              // General discovery feed (streamers only for now)
              streamers.length > 0 && currentIndex < streamers.length ? (
                <div className="stream-wrapper">
                  <video 
                    src={streamers[currentIndex].stream_url} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="stream-video"
                  />
                  <div className="streamer-info">
                    <div className="streamer-profile">
                      <img 
                        src={streamers[currentIndex].avatar_url} 
                        alt={streamers[currentIndex].display_name}
                        className="profile-avatar"
                      />
                      <div className="streamer-details">
                        <h3>{streamers[currentIndex].display_name}</h3>
                        <p>{streamers[currentIndex].game}</p>
                        <div className="view-count">
                          {streamers[currentIndex].viewer_count?.toLocaleString()} viewers
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-content">
                  <div className="empty-message">
                    <p>No streams available</p>
                  </div>
                </div>
              )
            )}
            
            {/* Navigation arrows */}
            <button 
              className="nav-arrow left"
              onClick={() => handleSwipe(-1)}
              aria-label="Previous content"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            
            <button 
              className="nav-arrow right"
              onClick={() => handleSwipe(1)}
              aria-label="Next content"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          </div>
          
          {/* Space-themed bottom buttons removed from here */}
        </motion.div>
      </div>
      
      {/* Search Modal */}
      {/* Render the search modal regardless of open state but control visibility with CSS */}
      <div 
        className={`fixed top-0 left-0 right-0 bottom-0 z-50 flex flex-col p-0 bg-black ${searchModalOpen ? 'block' : 'hidden'}`}
        style={{ 
          backgroundImage: 'radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%)',
          backgroundSize: 'cover'
        }}
      >

          {/* Top Header */}
          <div className="p-4 flex items-center border-b border-gray-800" 
            style={{ backgroundColor: 'rgba(15, 15, 26, 0.8)' }}
          >
            <button 
              className="mr-3 text-gray-400 hover:text-white"
              onClick={() => {
                toggleSearchModal();
                setSearchQuery('');
                setSearchResults({users: [], games: []});
              }}
            >
              <ArrowLeft size={24} />
            </button>

            {/* Search Input with Modern Icon */}
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <div style={{
                  position: 'relative',
                  width: '18px',
                  height: '18px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    border: '2px solid #FF7700',
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }} />
                  <div style={{
                    width: '2px',
                    height: '7px',
                    backgroundColor: '#FF7700',
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    transform: 'rotate(-45deg) translate(1px, -1px)',
                    transformOrigin: 'bottom right'
                  }} />
                </div>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                placeholder="Search users, games, or content..."
                className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="px-4 py-2 border-b border-gray-800 overflow-x-auto whitespace-nowrap flex gap-2">
            <button 
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                searchCategory === 'all' ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setSearchCategory('all')}
            >
              All Results
            </button>
            <button 
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                searchCategory === 'users' ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setSearchCategory('users')}
            >
              Users
            </button>
            <button 
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                searchCategory === 'games' ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setSearchCategory('games')}
            >
              Games
            </button>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto p-4">
            {searchQuery.length <= 2 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="mb-4">
                  <div style={{
                    position: 'relative',
                    width: '64px',
                    height: '64px',
                    margin: '0 auto'
                  }}>
                    <div style={{
                      width: '45px',
                      height: '45px',
                      borderRadius: '50%',
                      border: '3px solid #FF7700',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      opacity: 0.6
                    }} />
                    <div style={{
                      width: '3px',
                      height: '28px',
                      backgroundColor: '#FF7700',
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      transform: 'rotate(-45deg) translate(4px, -4px)',
                      transformOrigin: 'bottom right',
                      opacity: 0.6
                    }} />
                  </div>
                </div>
                <h3 className="text-xl font-medium text-gray-300 mb-2">Start searching</h3>
                <p className="text-gray-500 max-w-md">
                  Search for your favorite streamers, games, or content creators. Type at least 3 characters to begin.
                </p>
              </div>
            ) : searchResults.users.length === 0 && searchResults.games.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No results found for "{searchQuery}"</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Users Section */}
                {(searchCategory === 'all' || searchCategory === 'users') && searchResults.users.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">Users</h3>
                    <div className="space-y-3">
                      {searchResults.users.map(user => (
                        <div key={user.id} className="flex items-center bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors">
                          <div className="relative">
                            <img 
                              src={user.avatar_url} 
                              alt={user.display_name} 
                              className="w-16 h-16 object-cover"
                            />
                            {user.isLive && (
                              <div className="absolute top-1 left-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded">
                                LIVE
                              </div>
                            )}
                          </div>
                          <div className="flex-1 p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-white">{user.display_name}</p>
                                <p className="text-gray-400 text-sm">@{user.username}</p>
                              </div>
                              <div className="text-xs text-gray-400">
                                {user.followers.toLocaleString()} followers
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button className="w-full text-center py-2 text-orange-500 hover:text-orange-400 text-sm font-medium">
                        See all users
                      </button>
                    </div>
                  </div>
                )}

                {/* Games Section */}
                {(searchCategory === 'all' || searchCategory === 'games') && searchResults.games.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">Games</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {searchResults.games.map(game => (
                        <div key={game.id} className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors">
                          <div className="relative aspect-video">
                            <img 
                              src={game.cover_url} 
                              alt={game.name} 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                              <p className="font-medium text-white text-sm">{game.name}</p>
                            </div>
                          </div>
                          <div className="p-2 flex justify-between items-center">
                            <div className="flex items-center text-xs text-gray-400">
                              <Users size={12} className="mr-1" />
                              {game.viewers.toLocaleString()}
                            </div>
                            <button className="text-xs text-orange-500 hover:text-orange-400 font-medium">
                              Browse
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="w-full text-center py-2 mt-3 text-orange-500 hover:text-orange-400 text-sm font-medium">
                      See all games
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Orange Button Menu - without Game Menu button, no animations */}
      <div className="orange-button-menu" style={{
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        gap: '10px',
        padding: '10px',
        zIndex: 50,
        backgroundColor: '#111'
      }}>
        {/* Sub Button */}
        <button 
          className="menu-button" 
          style={{
            backgroundColor: '#FF6600',
            border: 'none',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            flex: 1,
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          onClick={() => setShowSubscriptionTiers(true)}
        >
          <Star size={20} />
          <span>Sub</span>
        </button>

        {/* Chat Button */}
        <button 
          className="menu-button" 
          style={{
            backgroundColor: '#FF6600',
            border: 'none',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            flex: 1,
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          onClick={() => {
            setChatPartnerId(isGameView && 'user' in gameContent[currentIndex] 
              ? (gameContent[currentIndex] as Clipt).user.id 
              : (isGameView ? (gameContent[currentIndex] as Streamer).id : streamers[currentIndex].id));
            setShowChat(true);
          }}
        >
          <MessageCircle size={20} />
          <span>Chat</span>
        </button>

        {/* Donate Button */}
        <button 
          className="menu-button" 
          style={{
            backgroundColor: '#FF6600',
            border: 'none',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            flex: 1,
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          onClick={() => {
            setShowDonationModal(true);
          }}
        >
          <Gift size={20} />
          <span>Donate</span>
        </button>

        {/* Clipt Button - with clip functionality */}
        <button 
          className="menu-button" 
          style={{
            backgroundColor: '#FF6600',
            border: 'none',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            flex: 1,
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          onClick={() => {
            setShowClipModal(true);
            // Set default title based on current content
            const streamerName = isGameView && 'user' in gameContent[currentIndex] 
              ? (gameContent[currentIndex] as Clipt).user.display_name || 'Streamer'
              : (isGameView 
                  ? (gameContent[currentIndex] as Streamer).display_name || 'Streamer'
                  : streamers[currentIndex]?.display_name || 'Streamer');
            setClipTitle(`Epic moment from ${streamerName}'s stream`);
            
            // Set a random preview URL from the current content source
            setClipPreviewUrl(
              isGameView && 'thumbnail_url' in gameContent[currentIndex] 
                ? (gameContent[currentIndex] as Clipt).thumbnail_url || "https://picsum.photos/seed/clipt/800/450" 
                : (isGameView 
                    ? (gameContent[currentIndex] as Streamer).thumbnail_url || "https://picsum.photos/seed/clipt/800/450" 
                    : streamers[currentIndex]?.thumbnail_url || "https://picsum.photos/seed/clipt/800/450")
            );
          }}
        >
          <Scissors size={20} />
          <span>Clipt</span>
        </button>

        {/* Share Button */}
        <button 
          className="menu-button" 
          style={{
            backgroundColor: '#FF6600',
            border: 'none',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            flex: 1,
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          onClick={() => {
            setShowShareModal(true);
          }}
        >
          <Share2 size={20} />
          <span>Share</span>
        </button>
      </div>
      
      {/* Subscription Tiers Modal - No animations */}
      {showSubscriptionTiers && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSubscriptionTiers(false)}
        >
          <div 
            className="bg-gray-900 border border-orange-500 rounded-lg w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Choose Subscription Tier</h2>
                <button 
                  className="text-gray-400 hover:text-white"
                  onClick={() => setShowSubscriptionTiers(false)}
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Tiers */}
              <div className="space-y-4">
                {/* Free Tier */}
                <div className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg cursor-pointer"
                  onClick={() => {
                    toast.success('Free tier selected');
                    setShowSubscriptionTiers(false);
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-white font-bold">Free</h3>
                    <span className="text-green-400 font-bold">$0.00/month</span>
                  </div>
                  <p className="text-gray-300 text-sm">Basic features with limited token earning.</p>
                </div>
                
                {/* Pro Tier */}
                <div className="bg-gradient-to-r from-orange-800 to-orange-600 hover:from-orange-700 hover:to-orange-500 p-4 rounded-lg cursor-pointer relative overflow-hidden"
                  onClick={() => {
                    toast.success('Pro tier selected - $4.99/month');
                    setShowSubscriptionTiers(false);
                  }}
                >
                  <div className="flex justify-between items-center mb-2 relative z-10">
                    <h3 className="text-white font-bold flex items-center gap-2">
                      <Rocket size={18} /> Pro
                    </h3>
                    <span className="text-white font-bold">$4.99/month</span>
                  </div>
                  <p className="text-white text-sm relative z-10">Enhanced token earnings, ad-free experience, bonus tokens daily.</p>
                  <div className="absolute top-0 right-0 bg-yellow-500 text-xs px-2 py-1 font-bold">POPULAR</div>
                </div>
                
                {/* Maxed Tier */}
                <div className="bg-gradient-to-r from-purple-900 to-orange-700 hover:from-purple-800 hover:to-orange-600 p-4 rounded-lg cursor-pointer"
                  onClick={() => {
                    toast.success('Maxed tier selected - $14.99/month');
                    setShowSubscriptionTiers(false);
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-white font-bold flex items-center gap-2">
                      <Award size={18} /> Maxed
                    </h3>
                    <span className="text-white font-bold">$14.99/month</span>
                  </div>
                  <p className="text-white text-sm">Maximum token earnings, exclusive content, priority features, free boosts.</p>
                </div>
              </div>
              
              <div className="mt-6 text-center text-sm text-gray-400">
                Subscription can be canceled anytime. View <span className="text-orange-500 cursor-pointer">Terms and Conditions</span>.
              </div>
            </div>
          </div>
        )}

      {/* Donation Modal */}
      {showDonationModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDonationModal(false)}
        >
          <div 
            className="bg-gray-900 border border-orange-500 rounded-lg w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Donate to Streamer</h2>
              <button 
                className="text-gray-400 hover:text-white"
                onClick={() => setShowDonationModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Current Streamer Info */}
              <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-md">
                <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden">
                  <img 
                    src={isGameView && 'user' in gameContent[currentIndex] 
                      ? (gameContent[currentIndex] as Clipt).user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=cosmic' 
                      : (isGameView 
                          ? (gameContent[currentIndex] as Streamer).avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=cosmic' 
                          : streamers[currentIndex]?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=cosmic')}
                    alt="Streamer Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-white font-bold">
                    {isGameView && 'user' in gameContent[currentIndex] 
                      ? (gameContent[currentIndex] as Clipt).user.display_name || 'Streamer'
                      : (isGameView 
                          ? (gameContent[currentIndex] as Streamer).display_name || 'Streamer'
                          : streamers[currentIndex]?.display_name || 'Streamer')}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {isGameView && 'user' in gameContent[currentIndex] 
                      ? (gameContent[currentIndex] as Clipt).user.username || '@username'
                      : (isGameView 
                          ? (gameContent[currentIndex] as Streamer).username || '@username'
                          : streamers[currentIndex]?.username || '@username')}
                  </p>
                </div>
              </div>

              {/* Amount Selector */}
              <div>
                <label className="block text-white font-medium mb-2">Donation Amount</label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 5, 10, 25, 50].map(amount => (
                    <button
                      key={amount}
                      className={`py-2 rounded-md ${donationAmount === amount ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-300'}`}
                      onClick={() => setDonationAmount(amount)}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
                <div className="mt-3 relative">
                  <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                  <input
                    type="number"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(parseInt(e.target.value) || 1)}
                    className="bg-gray-800 text-white rounded-md w-full py-2 pl-8 pr-3"
                    min="1"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-white font-medium mb-2">Message (optional)</label>
                <textarea
                  value={donationMessage}
                  onChange={(e) => setDonationMessage(e.target.value)}
                  placeholder="Say something nice..."
                  className="bg-gray-800 text-white rounded-md w-full p-3 min-h-[80px]"
                />
              </div>

              {/* Payment Methods */}
              <div>
                <p className="text-white font-medium mb-2">Payment Method</p>
                <div className="bg-gray-800 rounded-md p-3 mb-2 flex items-center gap-3">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                  </div>
                  <span className="text-white">Clipt Coins (Balance: 2540)</span>
                </div>
                <div className="bg-gray-800 rounded-md p-3 flex items-center gap-3 opacity-60">
                  <div className="w-6 h-6 border border-gray-600 rounded-full"></div>
                  <span className="text-white">Credit Card</span>
                </div>
              </div>

              {/* Donate Button */}
              <button
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-md font-bold mt-4"
                onClick={() => {
                  setShowDonationModal(false);
                  toast.success(`Donated $${donationAmount} to ${isGameView && 'user' in gameContent[currentIndex] 
                    ? (gameContent[currentIndex] as Clipt).user.display_name 
                    : (isGameView 
                        ? (gameContent[currentIndex] as Streamer).display_name 
                        : streamers[currentIndex]?.display_name || 'Streamer')}`);
                }}
              >
                Donate ${donationAmount}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Clip Modal - for creating clips */}
      {showClipModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowClipModal(false)}
        >
          <div 
            className="bg-gray-900 border border-orange-500 rounded-lg w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Create Clip</h2>
              <button 
                className="text-gray-400 hover:text-white"
                onClick={() => setShowClipModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Stream Preview */}
              <div className="relative">
                <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                  <img 
                    src={clipPreviewUrl}
                    alt="Stream preview"
                    className="w-full h-full object-cover"
                  />
                  {isClipping && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                      <div className="w-16 h-16 border-4 border-t-transparent border-orange-500 rounded-full animate-spin mb-4"></div>
                      <p className="text-white font-bold">Creating your clip...</p>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-4 left-4 bg-red-600 text-white text-xs px-2 py-1 rounded-md font-bold flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                  LIVE
                </div>
              </div>

              {/* Clip Title */}
              <div>
                <label className="block text-white font-medium mb-2">Clip Title</label>
                <input
                  type="text"
                  value={clipTitle}
                  onChange={(e) => setClipTitle(e.target.value)}
                  placeholder="Add a title to your clip"
                  className="bg-gray-800 text-white rounded-md w-full p-3"
                  maxLength={100}
                />
              </div>

              {/* Clip Duration */}
              <div>
                <label className="block text-white font-medium mb-2">Clip Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 120].map(seconds => (
                    <button
                      key={seconds}
                      className={`py-2 rounded-md ${clipDuration === seconds ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-300'}`}
                      onClick={() => setClipDuration(seconds)}
                    >
                      {seconds === 60 ? '1 min' : seconds < 60 ? `${seconds} sec` : `${seconds/60} min`}
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-gray-400 text-xs mb-1">
                    <span>30s</span>
                    <span>1m</span>
                    <span>2m</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="120"
                    step="10"
                    value={clipDuration}
                    onChange={(e) => setClipDuration(parseInt(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                </div>
              </div>

              {/* Current Time Point */}
              <div className="bg-gray-800 p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">From current point</p>
                    <p className="text-gray-400 text-sm">Capturing last {clipDuration} seconds</p>
                  </div>
                  <span className="text-orange-500 font-bold">{clipDuration}s</span>
                </div>
              </div>

              {/* Share in Chat Option */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="share-in-chat"
                  checked={sendToChat}
                  onChange={(e) => setSendToChat(e.target.checked)}
                  className="w-4 h-4 accent-orange-500"
                />
                <label htmlFor="share-in-chat" className="text-white cursor-pointer">
                  Share in chat when clip is ready
                </label>
              </div>

              {/* Create Button */}
              <button
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-md font-bold disabled:opacity-50 mt-4"
                disabled={isClipping}
                onClick={() => {
                  setIsClipping(true);
                  // Simulate clip creation process
                  setTimeout(() => {
                    // Generate a random clip ID
                    const newClipId = `clip-${Math.random().toString(36).substring(2, 10)}`;
                    setClipId(newClipId);
                    setIsClipping(false);
                    setShowClipModal(false);
                    
                    // Handle chat sharing if enabled
                    if (sendToChat) {
                      // Get streamer info
                      const streamerName = isGameView && 'user' in gameContent[currentIndex] 
                        ? (gameContent[currentIndex] as Clipt).user.display_name || 'Streamer'
                        : (isGameView 
                            ? (gameContent[currentIndex] as Streamer).display_name || 'Streamer'
                            : streamers[currentIndex]?.display_name || 'Streamer');
                      
                      // Open chat if not already open
                      if (!showChat) {
                        setChatPartnerId(isGameView && 'user' in gameContent[currentIndex] 
                          ? (gameContent[currentIndex] as Clipt).user.id 
                          : (isGameView ? (gameContent[currentIndex] as Streamer).id : streamers[currentIndex].id));
                        setShowChat(true);
                      }
                      
                      // Show success message with chat info
                      toast({
                        title: "Clip Created and Shared!",
                        description: `Your ${clipDuration}-second clip has been shared in the chat with ${streamerName}.`,
                        duration: 5000,
                        action: {
                          label: "View in Chat",
                          onClick: () => {
                            if (!showChat) {
                              setChatPartnerId(isGameView && 'user' in gameContent[currentIndex] 
                                ? (gameContent[currentIndex] as Clipt).user.id 
                                : (isGameView ? (gameContent[currentIndex] as Streamer).id : streamers[currentIndex].id));
                              setShowChat(true);
                            }
                          }
                        }
                      });
                    } else {
                      // Regular success message
                      toast({
                        title: "Clip Created!",
                        description: `Your ${clipDuration}-second clip has been saved to your library.`,
                        duration: 5000,
                        action: {
                          label: "View",
                          onClick: () => navigate('/clips')
                        }
                      });
                    }
                  }, 2500);
                }}
              >
                {isClipping ? 'Processing...' : 'Create Clip'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowShareModal(false)}
        >
          <div 
            className="bg-gray-900 border border-orange-500 rounded-lg w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Share</h2>
              <button 
                className="text-gray-400 hover:text-white"
                onClick={() => setShowShareModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Content to Share */}
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-700 overflow-hidden">
                  <img 
                    src={isGameView && 'video_url' in gameContent[currentIndex] 
                      ? (gameContent[currentIndex] as Clipt).thumbnail_url || "https://picsum.photos/seed/clipt/800/450" 
                      : (isGameView 
                          ? (gameContent[currentIndex] as Streamer).thumbnail_url || "https://picsum.photos/seed/clipt/800/450" 
                          : streamers[currentIndex]?.thumbnail_url || "https://picsum.photos/seed/clipt/800/450")}
                    alt="Content thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-white font-medium truncate">
                    {isGameView && 'title' in gameContent[currentIndex] 
                      ? (gameContent[currentIndex] as Clipt).title || 'Epic gaming moment!'
                      : (isGameView 
                          ? `${(gameContent[currentIndex] as Streamer).display_name}'s stream` 
                          : `${streamers[currentIndex]?.display_name || 'Streamer'}'s stream`)}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {isGameView && 'user' in gameContent[currentIndex] 
                      ? (gameContent[currentIndex] as Clipt).user.username || '@username'
                      : (isGameView 
                          ? (gameContent[currentIndex] as Streamer).username || '@username'
                          : streamers[currentIndex]?.username || '@username')}
                  </p>
                </div>
              </div>

              {/* Share with Clipt Users */}
              <div>
                <h3 className="text-white font-medium mb-3">Share with Clipt Users</h3>
                <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-md mb-2 cursor-pointer hover:bg-gray-700">
                  <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=alex" alt="User" className="w-full h-full" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white">Alex Johnson</p>
                    <p className="text-gray-400 text-sm">@alexj</p>
                  </div>
                  <button className="bg-orange-600 text-white text-sm px-3 py-1 rounded-full">
                    Send
                  </button>
                </div>
                <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-md mb-2 cursor-pointer hover:bg-gray-700">
                  <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=taylor" alt="User" className="w-full h-full" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white">Taylor Swift</p>
                    <p className="text-gray-400 text-sm">@tswift</p>
                  </div>
                  <button className="bg-orange-600 text-white text-sm px-3 py-1 rounded-full">
                    Send
                  </button>
                </div>
                <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-md cursor-pointer hover:bg-gray-700">
                  <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=cosmic" alt="User" className="w-full h-full" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white">Cosmic Gamer</p>
                    <p className="text-gray-400 text-sm">@cosmic</p>
                  </div>
                  <button className="bg-orange-600 text-white text-sm px-3 py-1 rounded-full">
                    Send
                  </button>
                </div>
              </div>

              {/* Social Media */}
              <div>
                <h3 className="text-white font-medium mb-3">Share to Social Media</h3>
                <div className="grid grid-cols-4 gap-3">
                  <button className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-600">
                      <svg viewBox="0 0 24 24" width="24" height="24" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                    </div>
                    <span className="text-white text-xs">Facebook</span>
                  </button>
                  <button className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-400">
                      <svg viewBox="0 0 24 24" width="24" height="24" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                      </svg>
                    </div>
                    <span className="text-white text-xs">Twitter</span>
                  </button>
                  <button className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-pink-600">
                      <svg viewBox="0 0 24 24" width="24" height="24" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                    </div>
                    <span className="text-white text-xs">Instagram</span>
                  </button>
                  <button className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-600">
                      <svg viewBox="0 0 24 24" width="24" height="24" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                      </svg>
                    </div>
                    <span className="text-white text-xs">YouTube</span>
                  </button>
                </div>
              </div>

              {/* Copy Link */}
              <div className="bg-gray-800 rounded-md overflow-hidden flex">
                <input 
                  type="text" 
                  value="https://clipt.space/watch/v9s83hdk" 
                  readOnly 
                  className="bg-transparent text-white px-3 py-2 flex-1 outline-none"
                />
                <button 
                  className="bg-orange-600 text-white px-4"
                  onClick={() => {
                    navigator.clipboard.writeText("https://clipt.space/watch/v9s83hdk");
                    toast.success("Link copied to clipboard");
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Video Buttons for Top Right */}
      <div style={{
        position: 'fixed',
        top: '15px',
        right: '15px',
        display: 'flex',
        gap: '20px',
        zIndex: 50
      }}>
        <button 
          className="search-button" 
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            width: '45px',
            height: '45px',
            cursor: 'pointer',
            zIndex: 10
          }}
          onClick={goToSearchPage}
        >
          <div style={{
            position: 'relative',
            width: '26px',
            height: '26px'
          }}>
            {/* Modern search icon with glowing effect */}
            <div style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              border: '2.5px solid #FF7700',
              position: 'absolute',
              top: 0,
              left: 0,
              boxShadow: '0 0 8px #FF7700'
            }} />
            <div style={{
              width: '2.5px',
              height: '10px',
              backgroundColor: '#FF7700',
              position: 'absolute',
              bottom: 0,
              right: 0,
              transform: 'rotate(-45deg) translate(1px, -1px)',
              transformOrigin: 'bottom right',
              boxShadow: '0 0 8px #FF7700'
            }} />
          </div>
        </button>
        <button 
          className="icon-button" 
          style={{
            background: 'none',
            border: 'none',
            color: '#FF7700',
            filter: 'drop-shadow(0 0 8px rgba(255, 119, 0, 0.9))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => navigate('/AllStreamers')}
          aria-label="Go to Clipts Live"
        >
          <Video size={32} />
        </button>
      </div>

      {/* Clipt-style Side Chat overlay */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            className="fixed inset-y-0 right-0 bg-black/90 z-50 chat-sidebar"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="chat-sidebar-content">
              <button 
                className="close-chat-button"
                onClick={() => setShowChat(false)}
              >
                <X className="h-6 w-6" />
              </button>
              
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Chat</h2>
                <button 
                  className="text-gray-400 hover:text-white"
                  onClick={() => setShowChat(false)}
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Display clip in chat if it exists */}
              {clipId && sendToChat && (
                <div className="mb-4 bg-gray-800 rounded-md overflow-hidden">
                  <div className="aspect-video relative">
                    <img 
                      src={clipPreviewUrl}
                      alt="Clip preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
                          <Scissors size={12} color="white" />
                        </div>
                        <p className="text-white font-medium text-sm truncate">{clipTitle}</p>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-orange-600 text-white text-xs px-2 py-1 rounded-sm">
                      {clipDuration}s
                    </div>
                  </div>
                  <div className="p-2 flex justify-between items-center">
                    <span className="text-gray-400 text-xs">Just now</span>
                    <div className="flex gap-2">
                      <button className="text-gray-400 hover:text-orange-500">
                        <Heart size={16} />
                      </button>
                      <button className="text-gray-400 hover:text-orange-500">
                        <MessageCircle size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
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
    </div>
  );
};

export default DiscoveryNew;
