import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Tv, ChevronLeft, Filter, Zap, Flame, Award, Music, Heart, Sword, Bomb, Cpu, TrendingUp, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { createGlobalStyle, keyframes, css } from 'styled-components';

// Define the LiveStream interface
interface LiveStream {
  id: string; // Cloudflare Live Input ID / Video UID
  streamerName: string;
  gameName: string;
  viewerCount: number;
  genres: string[];
  thumbnailUrl: string;
  isLive: boolean;
  avatarSeed: string; // For DiceBear avatar
}

// Animation keyframes
const glowPulse = keyframes`
  0% { opacity: 0.6; filter: blur(10px); }
  50% { opacity: 0.8; filter: blur(15px); }
  100% { opacity: 0.6; filter: blur(10px); }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
`;

const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const GlobalStyle = createGlobalStyle`
  @keyframes pulse {
    0% { opacity: 0.7; transform: scale(0.95); }
    50% { opacity: 1; transform: scale(1.05); }
    100% { opacity: 0.7; transform: scale(0.95); }
  }
  
  .stream-card:hover .stream-glow {
    opacity: 0.8;
  }
  
  .stream-card {
    transition: all 0.3s ease;
  }
  
  .stream-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 15px 30px rgba(255, 85, 0, 0.3);
  }
  
  .live-dot {
    animation: livePulse 1.5s infinite;
  }
  
  .gradient-text {
    background-size: 200% auto;
    background-image: linear-gradient(90deg, #FF5500, #FF7700, #FF5500);
    animation: ${props => css`${gradientShift} 3s infinite linear`};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-fill-color: transparent;
  }
  
  @keyframes livePulse {
    0% { opacity: 0.6; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
    100% { opacity: 0.6; transform: scale(0.8); }
  }
`;

const AllStreamers = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'popular' | 'categories'>('popular');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Mock data for live streams - space themed
  const mockLiveStreams: LiveStream[] = [
    {
      id: 'stream-1',
      streamerName: 'CosmicVoyager',
      gameName: 'Stellar Odyssey',
      viewerCount: 12450,
      genres: ['Action', 'Adventure', 'Space'],
      thumbnailUrl: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8c3BhY2UlMjBnYW1lfGVufDB8fDB8fA%3D%3D&w=1000&q=80',
      isLive: true,
      avatarSeed: 'cosmic1'
    },
    {
      id: 'stream-2',
      streamerName: 'AstralExplorer',
      gameName: 'Galaxy Command',
      viewerCount: 8754,
      genres: ['Strategy', 'Space', 'Sci-fi'],
      thumbnailUrl: 'https://images.unsplash.com/photo-1504194104404-433180773017?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8c3BhY2V8ZW58MHx8MHx8&w=1000&q=80',
      isLive: true,
      avatarSeed: 'astral2'
    },
    {
      id: 'stream-3',
      streamerName: 'NebulaNomad',
      gameName: 'Star Citizen',
      viewerCount: 6320,
      genres: ['Space Sim', 'Open World', 'Adventure'],
      thumbnailUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8c3BhY2UlMjBnYW1lfGVufDB8fDB8fA%3D%3D&w=1000&q=80',
      isLive: true,
      avatarSeed: 'nebula3'
    },
    {
      id: 'stream-4',
      streamerName: 'OrbitSurfer',
      gameName: 'No Man\'s Sky',
      viewerCount: 5872,
      genres: ['Exploration', 'Space', 'Survival'],
      thumbnailUrl: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8c3BhY2UlMjBleHBsb3JhdGlvbnxlbnwwfHwwfHw%3D&w=1000&q=80',
      isLive: true,
      avatarSeed: 'orbit4'
    },
    {
      id: 'stream-5',
      streamerName: 'SolarSailor',
      gameName: 'Elite Dangerous',
      viewerCount: 4983,
      genres: ['Space Sim', 'Combat', 'MMO'],
      thumbnailUrl: 'https://images.unsplash.com/photo-1537420327992-d6e192287183?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTB8fHNwYWNlJTIwc2hpcHxlbnwwfHwwfHw%3D&w=1000&q=80',
      isLive: true,
      avatarSeed: 'solar5'
    },
    {
      id: 'stream-6',
      streamerName: 'CosmicCruiser',
      gameName: 'Everspace 2',
      viewerCount: 3250,
      genres: ['Action', 'Shooter', 'Space'],
      thumbnailUrl: 'https://images.unsplash.com/photo-1581822261290-991b38693d1b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjB8fHNwYWNlJTIwZ2FtZXxlbnwwfHwwfHw%3D&w=1000&q=80',
      isLive: true,
      avatarSeed: 'cosmic6'
    },
    {
      id: 'stream-7',
      streamerName: 'GalaxyGlider',
      gameName: 'Destiny 2',
      viewerCount: 3146,
      genres: ['FPS', 'Sci-fi', 'RPG'],
      thumbnailUrl: 'https://images.unsplash.com/photo-1607462109225-6b64ae2dd3cb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTZ8fHNwYWNlJTIwc2hpcHxlbnwwfHwwfHw%3D&w=1000&q=80',
      isLive: true,
      avatarSeed: 'galaxy7'
    },
    {
      id: 'stream-8',
      streamerName: 'VoidVoyager',
      gameName: 'Mass Effect Legendary',
      viewerCount: 2955,
      genres: ['RPG', 'Sci-fi', 'Action'],
      thumbnailUrl: 'https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTV8fHNwYWNlJTIwZ2FtZXxlbnwwfHwwfHw%3D&w=1000&q=80',
      isLive: true,
      avatarSeed: 'void8'
    },
    {
      id: 'stream-9',
      streamerName: 'StarStrider',
      gameName: 'Starfield',
      viewerCount: 9872,
      genres: ['RPG', 'Space', 'Exploration'],
      thumbnailUrl: 'https://images.unsplash.com/photo-1581822261290-991b38693d1b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTN8fHN0YXJmaWVsZHxlbnwwfHwwfHw%3D&w=1000&q=80',
      isLive: true,
      avatarSeed: 'star9'
    },
    {
      id: 'stream-10',
      streamerName: 'NebulaNavigator',
      gameName: 'Outer Wilds',
      viewerCount: 2541,
      genres: ['Adventure', 'Puzzle', 'Space'],
      thumbnailUrl: 'https://images.unsplash.com/photo-1520034475321-cbe63696469a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8c3BhY2UlMjBwbGFuZXR8ZW58MHx8MHx8&w=1000&q=80',
      isLive: true,
      avatarSeed: 'nebula10'
    }
  ];

  useEffect(() => {
    const fetchLiveStreams = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // First try to fetch from the backend service
        const response = await fetch('http://localhost:3002/api/live-streams')
          .catch(() => {
            // Network error or service not available
            console.log('Backend service unavailable, using mock data');
            return null;
          });
          
        // Check if response exists and is valid
        if (response && response.ok) {
          const data: LiveStream[] = await response.json();
          setLiveStreams(data);
        } else {
          // Use mock data as fallback
          console.log('Using mock stream data');
          setLiveStreams(mockLiveStreams);
        }
      } catch (e) {
        console.error("Failed to fetch live streams:", e);
        // Use mock data when there's an error
        console.log('Error occurred, using mock data');
        setLiveStreams(mockLiveStreams);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveStreams();
  }, []);


  const genres = [
    { id: 'all', name: 'All Games', icon: <div style={{ 
      width: 16, 
      height: 16, 
      borderRadius: '50%', 
      backgroundColor: '#ff0000',
      boxShadow: '0 0 10px 2px rgba(255, 0, 0, 0.7), 0 0 15px 5px rgba(255, 0, 0, 0.3)',
      animation: 'pulse 1.5s infinite',
    }} /> },
    { id: 'action', name: 'Action', icon: <Sword size={16} /> },
    { id: 'shooter', name: 'Shooter', icon: <Bomb size={16} /> },
    { id: 'adventure', name: 'Adventure', icon: <Flame size={16} /> },
    { id: 'rpg', name: 'RPG', icon: <Award size={16} /> },
    { id: 'battle-royale', name: 'Battle Royale', icon: <Zap size={16} /> },
    { id: 'strategy', name: 'Strategy', icon: <Cpu size={16} /> },
    { id: 'sports', name: 'Sports', icon: <Circle size={16} /> },
    { id: 'puzzle', name: 'Puzzle', icon: <Zap size={16} /> },
    { id: 'racing', name: 'Racing', icon: <Flame size={16} /> },
    { id: 'horror', name: 'Survival Horror', icon: <Sword size={16} /> },
    { id: 'moba', name: 'MOBA', icon: <Award size={16} /> },
    { id: 'indie', name: 'Indie', icon: <Heart size={16} /> },
    { id: 'trending', name: 'Trending', icon: <TrendingUp size={16} /> }
  ];

  const filteredStreamers = liveStreams.filter(stream => 
    selectedGenre === 'all' || (stream.genres && stream.genres.includes(selectedGenre))
  );

  const goBack = () => {
    navigate(-1);
  };

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white', padding: '20px', textAlign: 'center' }}>
        <div>
          <h2>Error Loading Streams</h2>
          <p>{error}</p>
          <p>Please ensure the Clipt Stream Lister backend service is running correctly and configured with valid Cloudflare credentials.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: '10px 20px', 
              marginTop: '20px', 
              backgroundColor: '#FF5500', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <GlobalStyle />
      <div style={{
        backgroundColor: '#0E0E10', // Twitch-like dark background
        minHeight: '100vh',
        color: 'white',
        position: 'relative',
        padding: '10px 20px 80px',
        overflowX: 'hidden'
      }}>
        {/* Page header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '15px 5px',
          marginBottom: '20px'
        }}>
          {/* Centered Clipts Live heading with cool styling */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div
                onClick={goBack}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#ff0000',
                  animation: 'pulse 1.5s infinite',
                  boxShadow: '0 0 8px 2px rgba(255, 0, 0, 0.7), 0 0 12px 5px rgba(255, 0, 0, 0.3)',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              />
              <h1 style={{ 
                fontSize: '32px', 
                fontWeight: 'bold',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                background: 'linear-gradient(90deg, #FF5500, #FF7700)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 10px rgba(255, 85, 0, 0.3)',
              }}>
                Clipts Live
              </h1>
            </div>
          </div>

          {/* Filter button - Twitch style */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: showFilters ? 'rgba(255, 85, 0, 0.4)' : 'rgba(255, 255, 255, 0.1)',
              border: showFilters ? '1px solid rgba(255, 85, 0, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '5px',
              padding: '8px 15px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontWeight: 'bold',
              boxShadow: showFilters ? '0 0 10px rgba(255, 85, 0, 0.3)' : 'none',
              position: 'absolute',
              right: '10px'
            }}
          >
            <Filter size={18} />
            Filter
          </motion.button>
        </div>
        
        {/* Genre filters - Twitch style */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                padding: '15px',
                backgroundColor: 'rgba(24, 24, 27, 0.95)',
                borderRadius: '5px',
                marginBottom: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
              }}>
                {genres.map(genre => (
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    key={genre.id}
                    onClick={() => setSelectedGenre(genre.id)}
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: selectedGenre === genre.id ? 'rgba(255, 85, 0, 0.4)' : 'rgba(30, 30, 30, 0.6)',
                      border: selectedGenre === genre.id ? '1px solid rgba(255, 85, 0, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '5px',
                      padding: '8px 15px',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', color: selectedGenre === genre.id ? 'white' : 'rgba(255, 255, 255, 0.5)' }}>
                      {genre.icon}
                    </span>
                    {genre.name}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content area */}
        <div style={{ padding: '10px 0' }}>
          {isLoading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '300px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '3px solid transparent',
                borderTopColor: '#E91916',
                animation: 'spin 1s linear infinite'
              }}></div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '15px',
              margin: '0 auto'
            }}>
              {filteredStreamers.map(stream => (
                <motion.div
                  key={stream.id}
                  className="stream-card"
                  whileHover={{ 
                    y: -5,
                    boxShadow: '0 10px 20px rgba(255, 85, 0, 0.2)'
                  }}
                  onClick={() => navigate(`/stream/${stream.id}`)}
                  style={{
                    backgroundColor: '#18181B', // Twitch-like card background
                    borderRadius: '5px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    position: 'relative',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Thumbnail - Twitch style */}
                  <div style={{
                    height: '180px',
                    backgroundColor: 'rgba(0,0,0,0.3)', // Fallback for image load failure
                    backgroundImage: `url(${stream.thumbnailUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    boxShadow: '0 6px 12px rgba(0,0,0,0.2)',
                  }}
                    onClick={() => navigate(`/stream/${stream.id}`)}
                  >
                    {/* Live indicator - Twitch style */}
                    {stream.isLive && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        backgroundColor: 'red',
                        color: 'white',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        zIndex: 3,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                      }}>
                        LIVE
                      </div>
                    )}

                    {/* Viewer count - Twitch style */}
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      zIndex: 3
                    }}>
                      <Users size={14} color="white" />
                      <span style={{ color: 'white', fontSize: '12px', fontWeight: '500' }}>
                        {stream.viewerCount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Content - Twitch style */}
                  <div style={{ padding: '10px 12px' }}>
                    {/* Streamer info - Twitch style */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '8px'
                    }}>
                      {/* Avatar - Twitch style */}
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: '#2D2D2D',
                        backgroundImage: `url(https://api.dicebear.com/7.x/avataaars/svg?seed=${stream.avatarSeed})`,
                        backgroundSize: 'cover',
                        border: '2px solid rgba(255, 255, 255, 0.1)'
                      }}></div>

                      <div>
                        <h3 style={{ 
                          margin: '0', 
                          fontSize: '15px', 
                          fontWeight: 'bold',
                          color: 'white',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '180px'
                        }}>{stream.streamerName}</h3>
                        <p style={{ 
                          margin: '3px 0 0 0', 
                          fontSize: '13px', 
                          color: '#A0A0A0', // Changed color for better contrast on dark theme
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '180px'
                        }}>{stream.gameName}</p>
                      </div>
                    </div>

                    {/* Tags - Twitch style */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '5px'
                    }}>
                      {stream.genres.slice(0, 3).map(genre => (
                        <span key={genre} style={{
                          backgroundColor: 'rgba(255, 85, 0, 0.75)',
                          color: '#FFFFFF', // Changed text color for better readability
                          borderRadius: '9999px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          border: '1px solid rgba(255, 85, 0, 0.4)',
                          whiteSpace: 'nowrap',
                          fontWeight: 'bold'
                        }}>{genre}</span>
                      ))}
                    </div>
                  </div>

                  {/* Animated glow effect */}
                  <div 
                    className="stream-glow"
                    style={{
                      position: 'absolute',
                      bottom: '-20px',
                      right: '-20px',
                      width: '150px',
                      height: '150px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(255, 85, 0, 0.15) 0%, rgba(255, 85, 0, 0) 70%)',
                      opacity: 0.3,
                      transition: 'opacity 0.3s ease',
                      zIndex: 1
                    }}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default AllStreamers;
