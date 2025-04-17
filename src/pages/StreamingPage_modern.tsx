import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Tv, ChevronLeft, Filter, Gamepad, Zap, Flame, Award, Music, Heart, Sword, Bomb, Cpu, TrendingUp } from 'lucide-react';
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

const StreamingPageModern: React.FC = () => {
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
    { id: 'all', name: 'All Games', icon: <Gamepad size={16} /> },
    { id: 'action', name: 'Action', icon: <Sword size={16} /> },
    { id: 'fps', name: 'FPS', icon: <Bomb size={16} /> },
    { id: 'strategy', name: 'Strategy', icon: <Zap size={16} /> },
    { id: 'rpg', name: 'RPG', icon: <Award size={16} /> },
    { id: 'music', name: 'Music', icon: <Music size={16} /> },
    { id: 'indie', name: 'Indie', icon: <Heart size={16} /> },
    { id: 'trending', name: 'Trending', icon: <Flame size={16} /> },
    { id: 'scifi', name: 'Sci-Fi', icon: <Cpu size={16} /> }
  ];

  // Dummy data for streamers with genre tags
  const streamers = [
    { id: '1', name: 'Pro Gamer', game: 'Fortnite', viewers: 12453, genres: ['action', 'fps', 'trending'] },
    { id: '2', name: 'Gaming Pro', game: 'Minecraft', viewers: 8721, genres: ['indie', 'strategy'] },
    { id: '3', name: 'Game Master', game: 'League of Legends', viewers: 15210, genres: ['strategy', 'trending'] },
    { id: '4', name: 'Awesome Player', game: 'Call of Duty', viewers: 7182, genres: ['fps', 'action'] },
    { id: '5', name: 'Epic Gamer', game: 'Apex Legends', viewers: 9345, genres: ['fps', 'trending'] },
    { id: '6', name: 'RPG Lover', game: 'Elden Ring', viewers: 6230, genres: ['rpg', 'action'] }
  ];

  // Dummy data for categories with genre tags
  const categories = [
    { id: 'fort123', name: 'Fortnite', viewers: 245300, genres: ['action', 'fps', 'trending'] },
    { id: 'mc456', name: 'Minecraft', viewers: 183450, genres: ['indie', 'strategy'] },
    { id: 'lol789', name: 'League of Legends', viewers: 321000, genres: ['strategy', 'trending'] },
    { id: 'cod321', name: 'Call of Duty', viewers: 178500, genres: ['fps', 'action'] },
    { id: 'apex456', name: 'Apex Legends', viewers: 198700, genres: ['fps', 'trending'] },
    { id: 'elden789', name: 'Elden Ring', viewers: 142600, genres: ['rpg', 'action'] }
  ];

  // Go back to previous page
  const goBack = () => {
    navigate(-1);
  };

  // Filter streamers and categories based on selected genre
  const filteredStreamers = selectedGenre === 'all' 
    ? streamers 
    : streamers.filter(streamer => streamer.genres.includes(selectedGenre));

  const filteredCategories = selectedGenre === 'all' 
    ? categories 
    : categories.filter(category => category.genres.includes(selectedGenre));

  return (
    <>
      <GlobalStyle />
      <div style={{ 
        backgroundColor: '#121212', 
        minHeight: '100vh', 
        padding: '0',
        color: 'white'
      }}>
        {/* Page header */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(42, 26, 18, 0.8) 0%, rgba(18, 18, 18, 0.9) 100%)',
          borderBottom: '1px solid rgba(255, 85, 0, 0.3)',
          padding: '18px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}>
          {/* Back button */}
          <motion.button
            whileHover={{ scale: 1.1, x: -3 }}
            whileTap={{ scale: 0.9 }}
            onClick={goBack}
            style={{ 
              background: 'rgba(255, 85, 0, 0.2)',
              border: '1px solid rgba(255, 85, 0, 0.3)',
              borderRadius: '50%',
              color: '#FF7700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: '8px',
              width: '40px',
              height: '40px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
            }}
          >
            <ChevronLeft />
          </motion.button>

          {/* Page title */}
          <div style={{ 
            flex: 1, 
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '28px',
            position: 'relative'
          }}>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <motion.div 
                animate={{ 
                  rotate: [0, 5, 0, -5, 0],
                  scale: [1, 1.1, 1, 1.1, 1]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  repeatType: 'loop'
                }}
                style={{ display: 'inline-block' }}
              >
                <TrendingUp size={24} style={{ color: '#FF5500' }} />
              </motion.div>
              <span className="gradient-text"
                style={{ 
                  fontWeight: '800',
                  position: 'relative',
                  zIndex: 2,
                  display: 'inline-block',
                  textShadow: '0 2px 10px rgba(255, 85, 0, 0.3)'
                }}
              >
                Live Streams
              </span>
            </motion.div>
            <motion.div 
              animate={{ 
                opacity: [0.5, 0.8, 0.5],
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                repeatType: 'reverse' 
              }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '180px',
                height: '20px',
                background: 'radial-gradient(circle, rgba(255, 85, 0, 0.2) 0%, rgba(255, 119, 0, 0) 70%)',
                filter: 'blur(15px)',
                zIndex: 1
              }}
            />
          </div>

          {/* Filter button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '10px',
              borderRadius: '50%',
              border: showFilters ? '2px solid #FF5500' : '1px solid rgba(255, 85, 0, 0.3)',
              background: showFilters ? 'rgba(42, 26, 18, 0.9)' : 'rgba(42, 26, 18, 0.4)',
              color: showFilters ? '#FF7700' : 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: showFilters ? '0 4px 12px rgba(255, 85, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s ease',
              width: '40px',
              height: '40px'
            }}
          >
            <Filter size={20} />
          </motion.button>
        </div>
        
        {/* Genre filters */}
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ 
            height: showFilters ? 'auto' : 0, 
            opacity: showFilters ? 1 : 0 
          }}
          transition={{ duration: 0.3 }}
          style={{
            overflow: 'hidden',
            background: 'rgba(42, 26, 18, 0.3)',
            borderBottom: '1px solid rgba(255, 85, 0, 0.1)'
          }}
        >
          {showFilters && (
            <div style={{
              padding: '12px 20px',
              display: 'flex',
              overflowX: 'auto',
              gap: '10px',
              margin: '0'
            }}>
              {genres.map(genre => (
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  key={genre.id}
                  onClick={() => setSelectedGenre(genre.id)}
                  style={{ 
                    background: selectedGenre === genre.id ? 'rgba(255, 85, 0, 0.3)' : 'rgba(255, 255, 255, 0.03)',
                    border: selectedGenre === genre.id ? '1px solid rgba(255, 85, 0, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: selectedGenre === genre.id ? '#FF7700' : 'rgba(255, 255, 255, 0.7)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    boxShadow: selectedGenre === genre.id ? '0 2px 8px rgba(255, 85, 0, 0.2)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', color: selectedGenre === genre.id ? '#FF5500' : 'rgba(255, 255, 255, 0.5)' }}>
                    {genre.icon}
                  </span>
                  {genre.name}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Tab buttons */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          margin: '20px 0',
          gap: '15px',
          position: 'relative',
          zIndex: 1
        }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '10px 18px',
              borderRadius: '20px',
              border: activeTab === 'popular' ? '2px solid #FF5500' : '1px solid rgba(255, 85, 0, 0.3)',
              background: activeTab === 'popular' ? 'rgba(42, 26, 18, 0.9)' : 'rgba(42, 26, 18, 0.4)',
              color: 'white',
              fontWeight: 'bold',
              boxShadow: activeTab === 'popular' ? '0 4px 12px rgba(255, 85, 0, 0.3)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => setActiveTab('popular')}
          >
            <Users size={18} style={{ 
              marginRight: '8px', 
              color: activeTab === 'popular' ? '#FF7700' : 'rgba(255, 255, 255, 0.7)' 
            }} /> 
            <span style={{ 
              color: activeTab === 'popular' ? '#FF7700' : 'rgba(255, 255, 255, 0.9)'  
            }}>Streamers</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '10px 18px',
              borderRadius: '20px',
              border: activeTab === 'categories' ? '2px solid #FF5500' : '1px solid rgba(255, 85, 0, 0.3)',
              background: activeTab === 'categories' ? 'rgba(42, 26, 18, 0.9)' : 'rgba(42, 26, 18, 0.4)',
              color: 'white',
              fontWeight: 'bold',
              boxShadow: activeTab === 'categories' ? '0 4px 12px rgba(255, 85, 0, 0.3)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => setActiveTab('categories')}
          >
            <Tv size={18} style={{ 
              marginRight: '8px', 
              color: activeTab === 'categories' ? '#FF7700' : 'rgba(255, 255, 255, 0.7)' 
            }} /> 
            <span style={{ 
              color: activeTab === 'categories' ? '#FF7700' : 'rgba(255, 255, 255, 0.9)'  
            }}>Categories</span>
          </motion.button>
        </div>

        {/* Loading animation */}
        <AnimatePresence>
          {isLoading ? (
            <motion.div 
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center" 
              style={{ 
                height: 'calc(100vh - 200px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 1.5, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1, repeat: Infinity, repeatType: 'reverse' }
                }}
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  border: '3px solid transparent',
                  borderTopColor: '#FF5500',
                  borderBottomColor: '#FF7700',
                  boxShadow: '0 0 15px rgba(255, 85, 0, 0.3)'
                }}
              />
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                padding: '0 20px 40px'
              }}
            >
              {activeTab === 'popular' ? (
                // Streamers grid with enhanced styling
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '20px'
                }}>
                  {filteredStreamers.map(streamer => (
                    <motion.div 
                      className="stream-card"
                      key={streamer.id}
                      whileHover={{ y: -5 }}
                      style={{
                        background: 'linear-gradient(135deg, #211A15 0%, #1A1A1A 100%)',
                        borderRadius: '15px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255, 85, 0, 0.2)',
                        position: 'relative'
                      }}
                      onClick={() => toast.success(`Watching ${streamer.name}`)}
                    >
                      <div style={{
                        height: '160px',
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.7)), url(https://picsum.photos/400/200?random=${streamer.id})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        padding: '15px',
                        position: 'relative'
                      }}>
                        <motion.div 
                          animate={{ 
                            y: [0, -2, 0],
                            scale: [1, 1.02, 1] 
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            repeatType: 'reverse' 
                          }}
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            backgroundColor: 'rgba(42, 26, 18, 0.9)',
                            borderRadius: '10px',
                            padding: '5px 12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#FF5500',
                            border: '1px solid rgba(255, 85, 0, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
                          }}>
                          <span className="live-dot" style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            backgroundColor: '#FF5500', 
                            display: 'inline-block' 
                          }}></span>
                          LIVE
                        </motion.div>
                        <h3 style={{ 
                          fontSize: '18px', 
                          margin: '0',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          {streamer.name}
                        </h3>
                        <p style={{
                          fontSize: '14px', 
                          color: '#FF5500',
                          margin: '5px 0 0',
                          fontWeight: 'bold'
                        }}>
                          {streamer.game} • {streamer.viewers.toLocaleString()} viewers
                        </p>
                      </div>
                      <div style={{
                        padding: '15px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px'
                      }}>
                        {streamer.genres.map(genre => (
                          <motion.span 
                            key={genre} 
                            whileHover={{ scale: 1.1 }}
                            style={{
                              backgroundColor: 'rgba(42, 26, 18, 0.7)',
                              color: '#FF7700',
                              borderRadius: '12px',
                              padding: '3px 10px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              border: '1px solid rgba(255, 85, 0, 0.3)',
                              cursor: 'pointer',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                            }}
                          >{genre}</motion.span>
                        ))}
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
                          animationName: `${glowPulse.getName()}`,
                          animationDuration: '3s',
                          animationIterationCount: 'infinite',
                          animationTimingFunction: 'ease-in-out',
                          zIndex: 1
                        }}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                // Categories grid with enhanced styling
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '20px'
                }}>
                  {filteredCategories.map(category => (
                    <motion.div 
                      className="stream-card"
                      key={category.id}
                      whileHover={{ y: -5 }}
                      style={{
                        background: 'linear-gradient(135deg, #211A15 0%, #1A1A1A 100%)',
                        borderRadius: '15px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255, 85, 0, 0.2)',
                        position: 'relative'
                      }}
                      onClick={() => toast.success(`Browsing ${category.name} streams`)}
                    >
                      <div style={{
                        height: '180px',
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.7)), url(https://picsum.photos/400/200?random=${category.id})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        padding: '15px'
                      }}>
                        <motion.div
                          animate={{ scale: [1, 1.03, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          style={{
                            position: 'absolute',
                            top: '15px',
                            left: '15px',
                            background: 'rgba(255, 85, 0, 0.2)',
                            backdropFilter: 'blur(4px)',
                            WebkitBackdropFilter: 'blur(4px)',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
                            border: '1px solid rgba(255, 85, 0, 0.3)'
                          }}
                        >
                          <Flame size={14} style={{ color: '#FF5500' }} />
                          <span style={{ color: '#FF7700', fontWeight: 'bold', fontSize: '12px' }}>
                            {category.viewers.toLocaleString()} viewers
                          </span>
                        </motion.div>
                        <h3 style={{ 
                          fontSize: '22px', 
                          margin: '0',
                          color: 'white',
                          fontWeight: 'bold',
                          textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                        }}>
                          {category.name}
                        </h3>
                      </div>
                      <div style={{
                        padding: '15px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px'
                      }}>
                        {category.genres.map(genre => (
                          <motion.span 
                            key={genre} 
                            whileHover={{ scale: 1.1 }}
                            style={{
                              backgroundColor: 'rgba(42, 26, 18, 0.7)',
                              color: '#FF7700',
                              borderRadius: '12px',
                              padding: '3px 10px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              border: '1px solid rgba(255, 85, 0, 0.3)',
                              cursor: 'pointer',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                            }}
                          >{genre}</motion.span>
                        ))}
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
                          animationName: `${glowPulse.getName()}`,
                          animationDuration: '3s',
                          animationIterationCount: 'infinite',
                          animationTimingFunction: 'ease-in-out',
                          zIndex: 1
                        }}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default StreamingPageModern;
