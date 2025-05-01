import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Tv, ChevronLeft, Filter, Zap, Flame, Award, Music, Heart, Sword, Bomb, Cpu, TrendingUp, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { createGlobalStyle, keyframes, css } from 'styled-components';

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
  
  // Simulate loading state
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  }, []);

  // Genre filter data
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

  // Dummy data for streamers with genre tags
  const streamers = [
    { id: '1', name: 'Pro Gamer', game: 'Fortnite', viewers: 12453, genres: ['action', 'shooter', 'battle-royale', 'trending'] },
    { id: '2', name: 'Gaming Pro', game: 'Minecraft', viewers: 8721, genres: ['indie', 'adventure', 'strategy'] },
    { id: '3', name: 'Game Master', game: 'League of Legends', viewers: 15210, genres: ['strategy', 'moba', 'trending'] },
    { id: '4', name: 'Awesome Player', game: 'Call of Duty', viewers: 7182, genres: ['shooter', 'action', 'battle-royale'] },
    { id: '5', name: 'Epic Gamer', game: 'Apex Legends', viewers: 9345, genres: ['shooter', 'battle-royale', 'trending'] },
    { id: '6', name: 'RPG Lover', game: 'Elden Ring', viewers: 6230, genres: ['rpg', 'action', 'adventure'] },
    { id: '7', name: 'Strategy Master', game: 'Civilization VI', viewers: 5280, genres: ['strategy'] },
    { id: '8', name: 'Indie Explorer', game: 'Hades', viewers: 4380, genres: ['indie', 'action', 'adventure'] },
    { id: '9', name: 'FPS Queen', game: 'Valorant', viewers: 11250, genres: ['shooter', 'action'] },
    { id: '10', name: 'RPG Wizard', game: 'Final Fantasy XIV', viewers: 8940, genres: ['rpg', 'adventure'] },
    { id: '11', name: 'Casual Gamer', game: 'Animal Crossing', viewers: 6810, genres: ['indie', 'strategy'] },
    { id: '12', name: 'Speed Runner', game: 'Dark Souls', viewers: 10740, genres: ['action', 'rpg'] },
    { id: '13', name: 'Racing Pro', game: 'Forza Horizon 5', viewers: 7520, genres: ['racing', 'sports'] },
    { id: '14', name: 'Horror Junkie', game: 'Resident Evil Village', viewers: 8130, genres: ['horror', 'action', 'adventure'] },
    { id: '15', name: 'Puzzle Master', game: 'Tetris Effect', viewers: 3910, genres: ['puzzle'] },
    { id: '16', name: 'Sports Legend', game: 'FIFA 23', viewers: 9650, genres: ['sports'] },
    { id: '17', name: 'MOBA King', game: 'Dota 2', viewers: 14320, genres: ['moba', 'strategy'] },
    { id: '18', name: 'Racing Queen', game: 'Gran Turismo 7', viewers: 5740, genres: ['racing', 'sports', 'trending'] }
  ];

  // Filter streamers based on selected genre
  const filteredStreamers = selectedGenre === 'all' 
    ? streamers 
    : streamers.filter(streamer => streamer.genres.includes(selectedGenre));

  // Go back to previous page
  const goBack = () => {
    navigate(-1);
  };

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
              {filteredStreamers.map(streamer => (
                <motion.div
                  key={streamer.id}
                  className="stream-card"
                  whileHover={{ 
                    y: -5,
                    boxShadow: '0 10px 20px rgba(255, 85, 0, 0.2)'
                  }}
                  onClick={() => navigate(`/stream/${streamer.id}`)}
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
                    backgroundColor: '#101010',
                    backgroundImage: `url(https://picsum.photos/seed/${streamer.id}/400/250)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    {/* Live indicator - Twitch style */}
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      backgroundColor: 'rgba(226, 8, 128, 0.9)', // Twitch-like magenta
                      borderRadius: '4px',
                      padding: '3px 6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      zIndex: 3,
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
                    }}>
                      <span className="live-dot" style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        marginRight: '2px'
                      }}></span>
                      <span style={{ 
                        color: 'white', 
                        fontWeight: 'bold', 
                        fontSize: '11px',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}>LIVE</span>
                    </div>

                    {/* Viewer count - Twitch style */}
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      zIndex: 3
                    }}>
                      <Users size={14} color="white" />
                      <span style={{ color: 'white', fontSize: '12px', fontWeight: '500' }}>
                        {streamer.viewers.toLocaleString()}
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
                        backgroundImage: `url(https://api.dicebear.com/7.x/avataaars/svg?seed=${streamer.id})`,
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
                        }}>{streamer.name}</h3>
                        <p style={{ 
                          margin: '3px 0 0 0', 
                          fontSize: '13px', 
                          color: '#000000',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '180px'
                        }}>{streamer.game}</p>
                      </div>
                    </div>

                    {/* Tags - Twitch style */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '5px'
                    }}>
                      {streamer.genres.slice(0, 3).map(genre => (
                        <span key={genre} style={{
                          backgroundColor: 'rgba(255, 85, 0, 0.75)',
                          color: '#000000',
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
