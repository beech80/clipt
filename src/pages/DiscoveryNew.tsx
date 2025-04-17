import React, { useState, useEffect, useRef } from 'react';
import { css } from 'styled-components';
import { Search, X, MessageCircle, Heart, Share2, Sparkles, Gamepad, Zap, DollarSign, UserPlus, Scissors, Monitor, Tv, Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import RealtimeChat from '@/components/messages/RealtimeChat';
import { debounce } from 'lodash';
import '../styles/discovery-retro.css';
import '../styles/search-panel.css';
import '../styles/gameboy-controller.css';
import '../styles/remove-rainbow-buttons.css';
import '../styles/hide-arrow-buttons.css';

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
  
  // Navigation handler for streaming page
  const goToStreaming = (streamerId: string) => {
    navigate(`/streaming/${streamerId}`);
  };
  
  // Basic state management
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  
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
  const [chatPartnerId, setChatPartnerId] = useState('');
  const [chatPosition, setChatPosition] = useState('bottom'); // 'bottom' or 'side'

  // Search results
  const [searchResults, setSearchResults] = useState<{
    users: Streamer[];
    games: Game[];
  }>({ users: [], games: [] });

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || '';
    setSearchTerm(value);
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
      
      {/* Cool centered header with glow effect */}
      <div className="discovery-header">
        <motion.h1 
          className="discovery-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Zap className="title-icon" />
          DISCOVERY
          <Zap className="title-icon" />
        </motion.h1>
      </div>
      
      <div className="topbar-actions">
        <button 
          className="icon-button"
          onClick={() => setSearchModalOpen(true)}
        >
          <Search className="h-6 w-6" />
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
                    className="stream-video full-screen"
                  />
                  <div className="streamer-content">
                    {/* TV Icon to go to Streaming Page */}
                    <div className="streaming-icon" style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 20 }}>
                      <button 
                        onClick={() => goToStreaming((gameContent[currentIndex] as Streamer).id)}
                        style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '8px', border: 'none', cursor: 'pointer' }}>
                        <Monitor color="white" size={24} />
                      </button>
                    </div>
                    <div className="streamer-profile" style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(220,220,220,0.85) 100%)',
                        backdropFilter: 'blur(5px)',
                        borderRadius: '12px',
                        padding: '10px 15px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,85,0,0.2), 0 0 15px rgba(255,85,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        maxWidth: '85%',
                        margin: '0 auto',
                        border: '2px solid rgba(255,105,48,0.5)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '3px',
                          background: 'linear-gradient(90deg, #ff5500, #ff9500, #ff5500)',
                          zIndex: 1
                        }}></div>
                      <img 
                        src={(gameContent[currentIndex] as Streamer).avatar_url} 
                        alt={(gameContent[currentIndex] as Streamer).display_name}
                        className="profile-avatar"
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          border: '3px solid rgba(255,85,0,0.8)',
                          boxShadow: '0 0 10px rgba(255,85,0,0.3)'
                        }}
                      />
                      <div className="streamer-details" style={{ flex: 1 }}>
                        <h3 style={{
                          color: '#fff',
                          fontWeight: 'bold',
                          fontSize: '22px',
                          marginBottom: '3px',
                          background: 'linear-gradient(90deg, #ff5500 0%, #ff9500 100%)',
                          borderRadius: '10px',
                          padding: '7px 18px',
                          border: '2.5px solid #fff',
                          boxShadow: '0 3px 12px rgba(255,85,0,0.18), 0 1.5px 0px #ff9500',
                          letterSpacing: '1px',
                          textShadow: '0 2px 8px rgba(0,0,0,0.20)',
                          display: 'inline-block',
                          filter: 'brightness(1.08)'
                        }}>{(gameContent[currentIndex] as Streamer).display_name}</h3>
                        <p style={{ 
                          color: '#222', 
                          fontWeight: 'bold', 
                          fontSize: '17px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <span style={{
                            background: 'linear-gradient(90deg, #202040 0%, #ff5500 100%)',
                            padding: '5px 14px',
                            borderRadius: '8px',
                            border: '2px solid #ff9500',
                            color: '#fff',
                            boxShadow: '0 2px 8px rgba(255,85,0,0.15)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '7px',
                            fontWeight: 600,
                            fontSize: '16px',
                            textShadow: '0 1px 5px rgba(0,0,0,0.19)'
                          }}>
                            <Gamepad size={16} style={{ color: '#fff', filter: 'drop-shadow(0 0 2px #ff5500)' }} />
                            {(gameContent[currentIndex] as Streamer).game}
                          </span>
                        </p>
                        <div className="view-count" style={{ 
                          color: '#333',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '14px',
                          marginTop: '3px'
                        }}>
                          <Zap size={14} style={{ color: '#ff5500' }} /> {(gameContent[currentIndex] as Streamer).viewer_count?.toLocaleString()} viewers
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
                    className="clipt-video full-screen"
                  />
                  <div className="clipt-info">
                    <div className="user-profile" style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(220,220,220,0.85) 100%)',
                        backdropFilter: 'blur(5px)',
                        borderRadius: '12px',
                        padding: '10px 15px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,85,0,0.2), 0 0 15px rgba(255,85,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        maxWidth: '85%',
                        margin: '0 auto',
                        border: '2px solid rgba(255,105,48,0.5)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '3px',
                          background: 'linear-gradient(90deg, #ff5500, #ff9500, #ff5500)',
                          zIndex: 1
                        }}></div>
                      <img 
                        src={(gameContent[currentIndex] as Clipt).user.avatar_url} 
                        alt={(gameContent[currentIndex] as Clipt).user.display_name}
                        className="profile-avatar"
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          border: '3px solid rgba(255,85,0,0.8)',
                          boxShadow: '0 0 10px rgba(255,85,0,0.3)'
                        }}
                      />
                      <div className="user-details" style={{ flex: 1 }}>
                        <h3 style={{
                          color: '#fff',
                          fontWeight: 'bold',
                          fontSize: '22px',
                          marginBottom: '3px',
                          background: 'linear-gradient(90deg, #ff5500 0%, #ff9500 100%)',
                          borderRadius: '10px',
                          padding: '7px 18px',
                          border: '2.5px solid #fff',
                          boxShadow: '0 3px 12px rgba(255,85,0,0.18), 0 1.5px 0px #ff9500',
                          letterSpacing: '1px',
                          textShadow: '0 2px 8px rgba(0,0,0,0.20)',
                          display: 'inline-block',
                          filter: 'brightness(1.08)'
                        }}>{(gameContent[currentIndex] as Clipt).user.display_name}</h3>
                        <p style={{
                          color: '#fff',
                          fontWeight: 'bold',
                          fontSize: '17px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '7px',
                          background: 'linear-gradient(90deg, #202040 0%, #ff5500 100%)',
                          borderRadius: '8px',
                          padding: '5px 14px',
                          margin: '6px 0',
                          boxShadow: '0 2px 8px rgba(255,85,0,0.13)',
                          border: '2px solid #ff9500',
                          textShadow: '0 1px 5px rgba(0,0,0,0.19)'
                        }}>
                          <Scissors size={16} style={{ color: '#fff', filter: 'drop-shadow(0 0 2px #ff5500)' }} />
                          {(gameContent[currentIndex] as Clipt).title}
                        </p>
                        <div className="view-count" style={{ 
                          color: '#333',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '14px',
                          marginTop: '3px'
                        }}>
                          <Heart size={14} style={{ color: '#ff5500' }} /> {(gameContent[currentIndex] as Clipt).view_count.toLocaleString()} views
                        </div>
                    </div>
                  </div>
                </div>
              )
            )}
              <div className="empty-content">
                <div className="empty-message">
                  <p>No content found for {selectedGame?.name}</p>
                </div>
              </div>
            )
          ) : (
            // General discovery feed (streamers only for now)
            {streamers.length > 0 && currentIndex < streamers.length ? (
              <div className="stream-wrapper">
                <video 
                  src={streamers[currentIndex].stream_url} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="stream-video full-screen"
                />
                <div className="streamer-content">
                  {/* TV Icon to go to Streaming Page */}
                  <div className="streaming-icon" style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 20 }}>
                    <button 
                      onClick={() => goToStreaming(streamers[currentIndex].id)}
                      style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '8px', border: 'none', cursor: 'pointer' }}>
                      <Monitor color="white" size={24} />
                    </button>
                  </div>
                  <div className="streamer-info" style={{ color: 'black' }}>
                    <div className="streamer-profile" style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(220,220,220,0.85) 100%)',
                      backdropFilter: 'blur(5px)',
                      borderRadius: '12px',
                      padding: '10px 15px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,85,0,0.2), 0 0 15px rgba(255,85,0,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      maxWidth: '85%',
                      margin: '0 auto',
                      border: '2px solid rgba(255,105,48,0.5)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: 'linear-gradient(90deg, #ff5500, #ff9500, #ff5500)',
                        zIndex: 1
                      }}></div>
                      <img 
                        src={streamers[currentIndex].avatar_url} 
                        alt={streamers[currentIndex].display_name} 
                        className="profile-avatar"
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          border: '3px solid rgba(255,85,0,0.8)',
                          boxShadow: '0 0 10px rgba(255,85,0,0.3)'
                        }}
                      />
                      <div className="streamer-details" style={{ flex: 1 }}>
                        <h3 style={{ 
                          color: '#fff',
                          fontWeight: 'bold',
                          fontSize: '22px',
                          marginBottom: '3px',
                          textShadow: '0 1px 1px rgba(0,0,0,0.7)',
                          background: 'rgba(20,20,30,0.85)',
                          borderRadius: '8px',
                          padding: '4px 12px',
                          display: 'inline-block',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
                        }}>{streamers[currentIndex].display_name}</h3>
                        <p style={{ 
                          color: '#fff',
                          fontWeight: 'bold',
                          fontSize: '17px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: 'rgba(20,20,30,0.85)',
                          borderRadius: '8px',
                          padding: '4px 12px',
                          margin: '6px 0',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.18)'
                        }}>
                          <Gamepad size={16} style={{ color: '#ff5500' }} /> {streamers[currentIndex].game}
                        </p>
                        <div className="view-count" style={{ 
                          color: '#333',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '14px',
                          marginTop: '3px'
                        }}>
                          <Zap size={14} style={{ color: '#ff5500' }} /> {streamers[currentIndex].viewer_count?.toLocaleString()} viewers
                        </div>
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
            )}
          </div>
            )
          )}
          
          {/* Removed Navigation arrows as requested */}
          
          {/* Old style GameBoy Controller with 4 buttons (only visible when not searching) */}
          {!searchModalOpen && (
  <motion.div 
    className="gameboy-controller"
    initial={{ opacity: 0, y: 100 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 100 }}
    transition={{ type: 'spring', stiffness: 300 }}
  >
    {/* No controller-left/dpad, no arrows */}
    {/* Center section with CLIPT screen */}
    <div className="controller-center">
      <div className="clipt-screen">
        <div className="clipt-screen-inner">
          <span>CLIPT</span>
        </div>
      </div>
    </div>
    {/* Action buttons on the right - with the 4 requested functions and colors */}
    <div className="controller-right">
      <div className="action-pad" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {/* Comment button - shows chat from bottom */}
        <button 
          className="action-btn comment" 
          style={{
            background: 'linear-gradient(135deg, #FF7700, #FF5500)',
            borderRadius: '8px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
            border: 'none'
          }}
          onClick={() => {
            if (showChat) {
              setShowChat(false);
            } else {
              setChatPartnerId(isGameView && 'user' in gameContent[currentIndex] ? (gameContent[currentIndex] as any).user.id : streamers[currentIndex]?.id || '');
              setShowChat(true);
            }
          }}
        >
          <MessageCircle className="h-5 w-5" style={{ color: 'white' }} />
        </button>
        {/* Donate button */}
        <button 
          className="controller-button b" 
          onClick={() => {
            toast.success("Donation feature coming soon!");
          }}
          style={{
            background: 'linear-gradient(135deg, #00C67F, #00A966)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4)',
            border: 'none'
          }}
        >
          <DollarSign className="h-4 w-4" style={{ color: 'white' }} />
        </button>
        {/* Follow button */}
        <button 
          className="controller-button c" 
          onClick={() => {
            toast.success("Following streamer!");
          }}
          style={{
            background: 'linear-gradient(135deg, #FF3DA5, #FF1493)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4)',
            border: 'none'
          }}
        >
          <UserPlus className="h-4 w-4" style={{ color: 'white' }} />
        </button>
        {/* Clipt button */}
        <button 
          className="controller-button d" 
          onClick={() => {
            toast.success("Clip created!");
          }}
          style={{
            background: 'linear-gradient(135deg, #FFB302, #FF9900)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4)',
            border: 'none'
          }}
        >
          <Scissors className="h-4 w-4" style={{ color: 'white' }} />
        </button>
      </div>
    </div>
  </motion.div>
)}
        </div>
      </motion.div>
      
      {/* Bottom Half Search Panel */}
      <AnimatePresence>
        {searchModalOpen && (
          <motion.div 
            className="search-panel"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              background: 'linear-gradient(135deg, rgba(25, 25, 40, 0.95) 0%, rgba(10, 10, 20, 0.97) 100%)',
              borderTop: '2px solid rgba(255, 119, 0, 0.7)',
              boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.5), 0 -1px 0 rgba(255, 119, 0, 0.3)'
            }}
          >
            <div className="search-panel-content">
              <div className="search-header">
                <button 
                  onClick={() => setSearchModalOpen(false)}
                  className="close-button"
                  style={{
                    background: 'linear-gradient(135deg, #FF7700, #FF5500)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 10px rgba(255, 119, 0, 0.5)',
                    cursor: 'pointer',
                    position: 'absolute',
                    right: '15px',
                    top: '15px',
                    zIndex: 10
                  }}
                >
                  <X className="h-6 w-6" />
                </button>
                
                <div className="search-input-wrapper" style={{
                  background: 'linear-gradient(90deg, rgba(255, 119, 0, 0.1), rgba(255, 70, 0, 0.15))',
                  border: '2px solid rgba(255, 119, 0, 0.3)',
                  borderRadius: '20px',
                  padding: '8px 15px',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: '0 0 15px rgba(255, 119, 0, 0.2)',
                  margin: '15px 0'
                }}>
                  <Search className="search-icon" style={{ color: '#FF7700' }} />
                  <input
                    type="search"
                    placeholder="Search games, streamers..."
                    className="search-input"
                    value={searchTerm}
                    onChange={handleSearchInputChange}
                    autoFocus
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      width: '100%',
                      padding: '5px 10px',
                      outline: 'none'
                    }}
                  />
                  {searchTerm.length > 0 && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="clear-button"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
              
              {searchLoading ? (
                <div className="search-loading">
                  <div className="loader"></div>
                </div>
              ) : (
                <div className="search-results-container">
                  {searchTerm.length >= 2 ? (
                    <>
                      {searchResults.games.length > 0 && (
                        <div className="results-section">
                          <h2 className="section-title" style={{
                    color: '#FF7700', 
                    fontSize: '20px',
                    fontWeight: 'bold',
                    margin: '15px 0 10px',
                    textShadow: '0 0 5px rgba(255, 119, 0, 0.3)',
                    borderBottom: '1px solid rgba(255, 119, 0, 0.3)',
                    paddingBottom: '5px'
                  }}>Games</h2>
                          <div className="games-grid">
                            {searchResults.games.map(game => (
                              <div
                                key={game.id}
                                className="game-card"
                                onClick={() => navigate(`/game/${game.id}`)}
                              >
                                <div className="game-image-container">
                                  <img
                                    src={game.cover_url}
                                    alt={game.name}
                                    className="game-image"
                                  />
                                </div>
                                <p className="game-name" style={{
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: '15px',
                                  textShadow: '0 0 3px rgba(0,0,0,0.9)',
                                  backgroundColor: 'rgba(255, 119, 0, 0.3)',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  textAlign: 'center',
                                  marginTop: '5px'
                                }}>{game.name}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {searchResults.users.length > 0 && (
                        <div className="results-section">
                          <h2 className="section-title" style={{
                    color: '#FF7700', 
                    fontSize: '20px',
                    fontWeight: 'bold',
                    margin: '15px 0 10px',
                    textShadow: '0 0 5px rgba(255, 119, 0, 0.3)',
                    borderBottom: '1px solid rgba(255, 119, 0, 0.3)',
                    paddingBottom: '5px'
                  }}>Streamers</h2>
                          <div className="streamers-grid">
                            {searchResults.users.map(streamer => (
                              <div
                                key={streamer.id}
                                className="streamer-card"
                              >
                                <div className="streamer-image-container">
                                  <img
                                    src={streamer.avatar_url}
                                    alt={streamer.display_name}
                                    className="streamer-avatar"
                                  />
                                  {streamer.is_live && (
                                    <div className="live-badge"></div>
                                  )}
                                </div>
                                <div className="streamer-details">
                                  <p className="streamer-name" style={{ color: 'black' }}>{streamer.display_name}</p>
                                  {streamer.game && (
                                    <p className="streamer-game" style={{ color: 'black' }}>{streamer.game}</p>
                                  )}
                                  <div className="streamer-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                                    <button 
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                      onClick={() => {
                                        setChatPartnerId(streamer.id);
                                        setShowChat(true);
                                        setSearchModalOpen(false);
                                      }}
                                      title="Open chat"
                                    >
                                      <MessageCircle size={18} color="#000" />
                                    </button>
                                    <button 
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                      onClick={() => {
                                        goToStreaming(streamer.id);
                                        setSearchModalOpen(false);
                                      }}
                                      title="View stream"
                                    >
                                      <Monitor size={18} color="#000" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {searchResults.games.length === 0 && searchResults.users.length === 0 && (
                        <div className="no-results">
                          <p>No results found for "{searchTerm}"</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="trending-section">
                      <h2 className="section-title">Trending Games</h2>
                      <div className="trending-grid">
                        {games.slice(0, 6).map(game => (
                          <div
                            key={game.id}
                            className="trending-game-card"
                            onClick={() => navigate(`/game/${game.id}`)}
                          >
                            <div className="trending-game-image-container">
                              <img
                                src={game.cover_url}
                                alt={game.name}
                                className="trending-game-image"
                              />
                            </div>
                            <p className="trending-game-name">{game.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Chat overlay - can be side or bottom position */}
      <AnimatePresence>
        {/* Side chat panel */}
        {showChat && chatPosition === 'side' && (
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
        
        {/* Bottom chat that shows while still watching the stream */}
        {showChat && chatPosition === 'bottom' && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 chat-bottom"
            initial={{ opacity: 0, y: 300 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="chat-bottom-header">
              <div className="chat-partner-info">
                <img 
                  src={streamers.find((s) => s.id === chatPartnerId)?.avatar_url || streamers[0]?.avatar_url} 
                  alt="Chat Partner" 
                  className="chat-partner-avatar" 
                />
                <span className="chat-partner-name">
                  {streamers.find((s) => s.id === chatPartnerId)?.display_name || streamers[0]?.display_name}
                </span>
              </div>
              <div className="chat-bottom-actions">
                <button 
                  className="toggle-chat-position"
                  onClick={() => setChatPosition('side')}
                  title="Expand chat"
                  style={{
                    background: 'linear-gradient(135deg, #2A1A12, #3A2A22)',
                    borderRadius: '4px',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255, 85, 0, 0.3)'
                  }}
                >
                  <Maximize2 className="h-5 w-5" style={{ color: '#FF5500' }} />
                </button>
                <button 
                  className="close-chat-button"
                  onClick={() => setShowChat(false)}
                  title="Close chat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="chat-bottom-content">
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
