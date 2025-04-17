import React, { useState, useEffect } from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import RealtimeChat from '@/components/messages/RealtimeChat';
import '../styles/discovery-retro.css';

// Define interfaces for our data types
interface Streamer {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  is_live: boolean;
  follower_count: number;
  bio?: string;
  game?: string;
}

interface Game {
  id: string;
  name: string;
  cover_url: string;
  popularity?: number;
}

const DiscoveryNew: React.FC = () => {
  const navigate = useNavigate();
  
  // Basic state management
  const [searchTerm, setSearchTerm] = useState('');
  const effectiveSearchTerm = searchTerm || '';
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Streamers and games state
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatPartnerId, setChatPartnerId] = useState('');

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

  // Handle game selection
  const handleGameSelect = (gameId: string, gameName: string) => {
    navigate(`/game-streamers/${gameId}?name=${encodeURIComponent(gameName)}`);
  };

  // Load sample data
  useEffect(() => {
    // Sample streamers
    const sampleStreamers: Streamer[] = [
      {
        id: '1',
        username: 'progamer',
        display_name: 'ProGamer',
        avatar_url: 'https://picsum.photos/200/200?random=1',
        is_live: true,
        follower_count: 5300,
        game: 'Fortnite'
      },
      {
        id: '2',
        username: 'streamer2',
        display_name: 'Epic Gamer',
        avatar_url: 'https://picsum.photos/200/200?random=2',
        is_live: true,
        follower_count: 12800,
        game: 'Minecraft'
      },
      {
        id: '3',
        username: 'gamer3',
        display_name: 'GameMaster',
        avatar_url: 'https://picsum.photos/200/200?random=3',
        is_live: false,
        follower_count: 7600,
        game: 'Call of Duty'
      },
      {
        id: '4',
        username: 'streamer4',
        display_name: 'LegendPlayer',
        avatar_url: 'https://picsum.photos/200/200?random=4',
        is_live: true,
        follower_count: 9400,
        game: 'League of Legends'
      },
      {
        id: '5',
        username: 'gamer5',
        display_name: 'ProStreamer',
        avatar_url: 'https://picsum.photos/200/200?random=5',
        is_live: true,
        follower_count: 15200,
        game: 'Valorant'
      },
      {
        id: '6',
        username: 'player6',
        display_name: 'TopPlayer',
        avatar_url: 'https://picsum.photos/200/200?random=6',
        is_live: false,
        follower_count: 4800,
        game: 'Among Us'
      }
    ];

    // Sample trending games
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
      }
    ];

    setStreamers(sampleStreamers);
    setGames(sampleGames);

    // Simulate search results
    setSearchResults({
      users: sampleStreamers.slice(0, 3),
      games: sampleGames
    });

  }, []);

  // Effect for search functionality
  useEffect(() => {
    if (effectiveSearchTerm.length >= 2) {
      setSearchLoading(true);
      
      // Simulate API search delay
      const timeoutId = setTimeout(() => {
        // Filter streamers
        const filteredStreamers = streamers.filter(
          (streamer) =>
            streamer.display_name.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
            (streamer.game && streamer.game.toLowerCase().includes(effectiveSearchTerm.toLowerCase()))
        );
        
        // Filter games
        const filteredGames = games.filter(
          (game) => game.name.toLowerCase().includes(effectiveSearchTerm.toLowerCase())
        );
        
        setSearchResults({
          users: filteredStreamers,
          games: filteredGames
        });
        
        setSearchLoading(false);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [effectiveSearchTerm, streamers, games]);

  return (
    <div className="discovery-container">
      {/* Background Effects */}
      <div className="scanlines"></div>
      <div className="crt-effect"></div>
      
      <div className="discovery-content">
        <h1 className="retro-discovery-title">DISCOVERY</h1>
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="search-bar-container">
            <div className="relative w-full max-w-2xl mx-auto">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-orange-400" />
              </div>
              <input
                type="search"
                placeholder="Search games, streamers..."
                className="discovery-search search-glow pl-10 pr-10 py-6 bg-gaming-900/60 text-lg border-orange-800 focus:border-orange-500"
                value={effectiveSearchTerm}
                onChange={handleSearchInputChange}
              />
              {effectiveSearchTerm.length > 0 && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <X className="h-5 w-5 text-orange-400 hover:text-white" />
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
        
        {/* Featured Game Cubes */}
        <div className="game-cube-container">
          {games.map((game, index) => (
            <div 
              key={`game-cube-${game.id}`} 
              className="game-cube"
              onClick={() => handleGameSelect(game.id, game.name)}
            >
              <div className="cube-face cube-face-front">
                <img src={game.cover_url} alt={game.name} />
                <div className="game-title">{game.name}</div>
              </div>
              <div className="cube-face cube-face-back">
                <img src={game.cover_url} alt={game.name} />
              </div>
              <div className="cube-face cube-face-left">
                <img src={game.cover_url} alt={game.name} />
              </div>
              <div className="cube-face cube-face-right">
                <img src={game.cover_url} alt={game.name} />
              </div>
              <div className="cube-face cube-face-top">
                <img src={game.cover_url} alt={game.name} />
              </div>
              <div className="cube-face cube-face-bottom">
                <img src={game.cover_url} alt={game.name} />
              </div>
            </div>
          ))}
        </div>
        
        {/* Live Streaming Section */}
        <div className="streaming-section">
          <div className="section-header">
            <Sparkles className="h-6 w-6 text-orange-400" />
            <h2 className="section-title">LIVE STREAMS</h2>
          </div>
          
          <div className="stream-grid">
            {streamers.slice(0, 6).map((streamer) => (
              <div 
                key={`stream-${streamer.id}`} 
                className="stream-card" 
                onClick={() => {
                  setChatPartnerId(streamer.id);
                  setShowChat(true);
                }}
              >
                <div className="relative">
                  <img 
                    src={streamer.avatar_url} 
                    alt={streamer.display_name}
                    className="stream-thumbnail w-full aspect-video object-cover"
                  />
                  {streamer.is_live && (
                    <div className="absolute top-2 right-2 live-indicator">
                      <div className="live-dot"></div>
                      LIVE
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    {streamer.is_live && (
                      <div className="audio-visualizer">
                        {[...Array(5)].map((_, i) => (
                          <div 
                            key={`viz-${streamer.id}-${i}`} 
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
                </div>
                
                <div className="stream-info">
                  <div className="streamer-profile">
                    <img 
                      src={streamer.avatar_url}
                      alt={streamer.display_name}
                      className="streamer-avatar"
                    />
                    <span className="streamer-name">{streamer.display_name}</span>
                  </div>
                  
                  <h3 className="stream-title">
                    {streamer.game ? `Playing ${streamer.game}` : 'Live Stream'}
                  </h3>
                  
                  <div className="stream-stats">
                    <span className="viewer-count">
                      {Math.floor(streamer.follower_count / 1000)}K followers
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Empty State for No Streams - Only shown if needed */}
        {streamers.length === 0 && (
          <motion.div 
            className="flex flex-col justify-center items-center h-[50vh] empty-state"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="arcade-frame p-8 mb-6 relative">
              <motion.div
                animate={{ 
                  opacity: [0.7, 1, 0.7],
                  y: [-2, 2, -2]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-16 h-16 text-orange-400 mb-4 screen-glitch" />
              </motion.div>
              
              <motion.h2 
                className="text-2xl font-bold neon-text-orange mb-4"
                animate={{ 
                  textShadow: [
                    '0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff, 0 0 42px #ff8c00, 0 0 82px #ff8c00, 0 0 92px #ff8c00',
                    '0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff, 0 0 42px #ff8c00, 0 0 72px #ff8c00, 0 0 82px #ff8c00',
                    '0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff, 0 0 42px #ff8c00, 0 0 82px #ff8c00, 0 0 92px #ff8c00'
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                NO STREAMS FOUND
              </motion.h2>
              
              <div className="mb-5 w-full h-2 bg-gray-800 relative overflow-hidden">
                <motion.div 
                  className="absolute h-full bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500"
                  initial={{ width: '0%', x: '-100%' }}
                  animate={{ width: '100%', x: '100%' }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 3,
                    ease: "linear"
                  }}
                />
              </div>
              
              <p className="text-orange-300 text-center px-4 text-lg">Try a different search or refresh.</p>
            </div>
          </motion.div>
        )}
      </div>
      
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
    </div>
  );
};

export default DiscoveryNew;
