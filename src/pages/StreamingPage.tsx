import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Tv, ChevronLeft, Filter, Gamepad, Zap, Flame, Award, Music, Heart, Sword, Bomb, Cpu, Wifi, TrendingUp } from 'lucide-react';
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

const subtleRotate = keyframes`
  0% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
  100% { transform: rotate(-3deg); }
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
    animation: ${css`${gradientShift} 3s infinite linear`};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-fill-color: transparent;
  }
  
  .card-hover-effect:hover .card-content {
    transform: translateY(-5px);
  }
  
  @keyframes livePulse {
    0% { opacity: 0.6; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
    100% { opacity: 0.6; transform: scale(0.8); }
  }
`;

const StreamingPage: React.FC = () => {
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
    { id: '6', name: 'RPG Lover', game: 'Elden Ring', viewers: 6230, genres: ['rpg', 'action'] },
    { id: '7', name: 'Beat Master', game: 'Beat Saber', viewers: 3780, genres: ['music', 'indie'] },
    { id: '8', name: 'Space Explorer', game: 'No Mans Sky', viewers: 4120, genres: ['scifi', 'indie'] },
    { id: '9', name: 'Strategy King', game: 'Age of Empires', viewers: 5670, genres: ['strategy'] },
    { id: '10', name: 'Sci-Fi Gamer', game: 'Mass Effect', viewers: 7900, genres: ['rpg', 'scifi'] }
  ];

  // Dummy data for categories with genre tags
  const categories = [
    { id: 'fort123', name: 'Fortnite', viewers: 245300, genres: ['action', 'fps', 'trending'] },
    { id: 'mc456', name: 'Minecraft', viewers: 183450, genres: ['indie', 'strategy'] },
    { id: 'lol789', name: 'League of Legends', viewers: 321500, genres: ['strategy', 'trending'] },
    { id: 'cod321', name: 'Call of Duty', viewers: 156700, genres: ['fps', 'action'] },
    { id: 'apex654', name: 'Apex Legends', viewers: 98400, genres: ['fps', 'trending'] },
    { id: 'elden123', name: 'Elden Ring', viewers: 134500, genres: ['rpg', 'action'] },
    { id: 'beat456', name: 'Beat Saber', viewers: 67800, genres: ['music', 'indie'] },
    { id: 'nms789', name: 'No Mans Sky', viewers: 82900, genres: ['scifi', 'indie'] },
    { id: 'aoe321', name: 'Age of Empires', viewers: 92600, genres: ['strategy'] },
    { id: 'mass654', name: 'Mass Effect', viewers: 145700, genres: ['rpg', 'scifi'] }
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
        color: 'white',
        overflow: 'hidden'
      }}>
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
              <span 
                style={{ 
                  background: 'linear-gradient(90deg, #FF5500, #FF7700)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
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
            background: 'rgba(25, 25, 112, 0.4)',
            borderBottom: '1px solid rgba(138, 43, 226, 0.3)'
          }}
        >
          {showFilters && (
            <div style={{
              padding: '5px 20px 15px',
              overflow: 'auto',
              whiteSpace: 'nowrap',
              marginBottom: '15px',
              background: 'rgba(42, 26, 18, 0.2)',
              borderBottom: '1px solid rgba(255, 85, 0, 0.1)',
              backdropFilter: 'blur(5px)',
              WebkitBackdropFilter: 'blur(5px)',
            }}>
              {genres.map(genre => (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  key={genre.id}
                  onClick={() => setSelectedGenre(genre.id)}
                  style={{ 
                    marginRight: '6px',
                    color: selectedGenre === genre.id ? '#FF7700' : 'rgba(255,255,255,0.7)'
                  }}
                >
                  {genre.icon}
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
          <button
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
          </button>

          <button
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
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {activeTab === 'popular' ? (
            // Streamers grid with enhanced styling
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              {filteredStreamers.map(streamer => (
                <motion.div 
                  key={streamer.id}
                  whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(255, 119, 0, 0.2)' }}
                  style={{
                    background: 'linear-gradient(135deg, #211A15 0%, #1A1A1A 100%)',
                    borderRadius: '15px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255, 119, 0, 0.2)'
                  }}
                  onClick={() => toast.success(`Browsing ${streamer.name} streams`)}
                >
                  <div style={{
                    height: '160px',
                    backgroundImage: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.7)), url(https://picsum.photos/400/200?random=' + streamer.id + ')',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '15px'
                  }}>
                    <h3 style={{ 
                      fontSize: '18px', 
                      margin: '0',
                      color: 'white',
                      fontWeight: 'bold',
                      background: 'linear-gradient(90deg, #FF5500, #FF7700)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      display: 'inline-block',
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                      {streamer.name}
                    </h3>
                    <p style={{
                      fontSize: '14px', 
                      color: 'white',
                      margin: 0,
                      fontWeight: 'bold',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
                    }}>
                      {streamer.viewers.toLocaleString()} viewers
                    </p>
                  </div>
                  <div style={{
                    padding: '15px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}>
                    {streamer.genres.map(genre => (
                      <span key={genre} style={{
                        backgroundColor: 'rgba(42, 26, 18, 0.7)',
                        color: '#FF7700',
                        borderRadius: '12px',
                        padding: '3px 10px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        border: '1px solid rgba(255, 85, 0, 0.3)',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                      }}>{genre}</span>
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
                      background: 'radial-gradient(circle, rgba(255, 85, 0, 0.15) 0%, rgba(255, 119, 0, 0) 70%)',
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
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              {filteredCategories.map(category => (
                <motion.div 
                  key={category.id}
                  whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(255, 119, 0, 0.2)' }}
                  style={{
                    background: 'linear-gradient(135deg, #211A15 0%, #1A1A1A 100%)',
                    borderRadius: '15px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255, 119, 0, 0.2)'
                  }}
                  onClick={() => toast.success(`Browsing ${category.name} streams`)}
                >
                  <div style={{
                    height: '160px',
                    backgroundImage: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.7)), url(https://picsum.photos/400/200?random=' + category.id + ')',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '15px'
                  }}>
                    <h3 style={{ 
                      fontSize: '18px', 
                      margin: '0',
                      color: 'white',
                      fontWeight: 'bold',
                      background: 'linear-gradient(90deg, #FF5500, #FF7700)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      display: 'inline-block',
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                      {category.name}
                    </h3>
                    <p style={{
                      fontSize: '14px', 
                      color: 'white',
                      margin: 0,
                      fontWeight: 'bold',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
                    }}>
                      {category.viewers.toLocaleString()} viewers
                    </p>
                  </div>
                  <div style={{
                    padding: '15px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}>
                    {category.genres.map(genre => (
                      <span key={genre} style={{
                        backgroundColor: 'rgba(42, 26, 18, 0.7)',
                        color: '#FF7700',
                        borderRadius: '12px',
                        padding: '3px 10px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        border: '1px solid rgba(255, 85, 0, 0.3)',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                      }}>{genre}</span>
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
                      background: 'radial-gradient(circle, rgba(255, 85, 0, 0.15) 0%, rgba(255, 119, 0, 0) 70%)',
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
      </div>
    </>
  );

  const renderCategoriesGrid = () => (
    // Categories grid with enhanced styling
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              {filteredCategories.map(category => (
                <motion.div 
                  key={category.id}
                  whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(255, 119, 0, 0.2)' }}
                  style={{
                    background: 'linear-gradient(135deg, #211A15 0%, #1A1A1A 100%)',
                    borderRadius: '15px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255, 119, 0, 0.2)'
                  }}
                  onClick={() => toast.success(`Browsing ${category.name} streams`)}
                >
                  <div style={{
                    height: '160px',
                    backgroundImage: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.7)), url(https://picsum.photos/400/200?random=' + category.id + ')',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '15px'
                  }}>
                    <h3 style={{ 
                      fontSize: '18px', 
                      margin: '0',
                      color: 'white',
                      fontWeight: 'bold',
                      background: 'linear-gradient(90deg, #FF5500, #FF7700)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      display: 'inline-block',
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                      {category.name}
                    </h3>
                    <p style={{
                      fontSize: '14px', 
                      color: 'white',
                      margin: 0,
                      fontWeight: 'bold',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
                    }}>
                      {category.viewers.toLocaleString()} viewers
                    </p>
                  </div>
                  <div style={{
                    padding: '15px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}>
                    {category.genres.map(genre => (
                      <span key={genre} style={{
                        backgroundColor: 'rgba(42, 26, 18, 0.7)',
                        color: '#FF7700',
                        borderRadius: '12px',
                        padding: '3px 10px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        border: '1px solid rgba(255, 85, 0, 0.3)',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                      }}>{genre}</span>
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
  );
  
  return (
    <>
      <GlobalStyle />
      <div style={{ 
        backgroundColor: '#121212', 
        minHeight: '100vh', 
        padding: '0',
        color: 'white',
        overflow: 'hidden'
      }}>
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
        }}>
          {/* Back button */}
          <motion.button
            whileHover={{ scale: 1.1, x: -3 }}
            whileTap={{ scale: 0.9 }}
            onClick={goBack}
            style={{ 
              background: 'rgba(255, 85, 0, 0.2)',
              border: '1px solid rgba(255, 85, 0, 0.3)',
              color: 'white',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
            }}
          >
            <ChevronLeft size={20} />
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
                gap: '10px'
              }}
            >
              <span className="gradient-text" style={{
                padding: '0 15px',
                position: 'relative',
                zIndex: 2,
                display: 'inline-block',
                textShadow: '0 2px 10px rgba(255, 85, 0, 0.3)'
              }}>
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
                ease: 'easeInOut'
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
              background: 'rgba(255, 85, 0, 0.2)',
              border: '1px solid rgba(255, 85, 0, 0.3)',
              color: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s ease',
              width: '40px',
              height: '40px'
            }}
          >
            <Filter size={20} />
          </motion.button>
        </div>

        {/* Genre filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                overflow: 'hidden',
                borderBottom: '1px solid rgba(255, 85, 0, 0.2)',
                background: 'rgba(18, 18, 18, 0.95)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
              }}
            >
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                padding: '15px 20px',
                justifyContent: 'center'
              }}>
                {genres.map(genre => (
                  <motion.button
                    key={genre.id}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedGenre(genre.id)}
                    style={{
                      background: selectedGenre === genre.id 
                        ? 'linear-gradient(90deg, #FF5500, #FF7700)' 
                        : 'rgba(42, 26, 18, 0.5)',
                      border: selectedGenre === genre.id 
                        ? '1px solid rgba(255, 119, 0, 0.5)' 
                        : '1px solid rgba(255, 85, 0, 0.2)',
                      padding: '8px 15px',
                      borderRadius: '20px',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      boxShadow: selectedGenre === genre.id 
                        ? '0 4px 15px rgba(255, 85, 0, 0.3)' 
                        : 'none',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {genre.icon}
                    {genre.name}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs for Popular and Categories */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '20px 0 10px',
          gap: '15px'
        }}>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('popular')}
            style={{
              background: activeTab === 'popular' 
                ? 'linear-gradient(90deg, #FF5500, #FF7700)' 
                : 'rgba(42, 26, 18, 0.5)',
              border: activeTab === 'popular' 
                ? '1px solid rgba(255, 119, 0, 0.5)' 
                : '1px solid rgba(255, 85, 0, 0.2)',
              padding: '10px 25px',
              borderRadius: '25px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: activeTab === 'popular' 
                ? '0 4px 15px rgba(255, 85, 0, 0.3)' 
                : 'none',
              fontWeight: 'bold',
              transition: 'all 0.2s ease'
            }}
          >
            <TrendingUp size={18} />
            Popular Streamers
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('categories')}
            style={{
              background: activeTab === 'categories' 
                ? 'linear-gradient(90deg, #FF5500, #FF7700)' 
                : 'rgba(42, 26, 18, 0.5)',
              border: activeTab === 'categories' 
                ? '1px solid rgba(255, 119, 0, 0.5)' 
                : '1px solid rgba(255, 85, 0, 0.2)',
              padding: '10px 25px',
              borderRadius: '25px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: activeTab === 'categories' 
                ? '0 4px 15px rgba(255, 85, 0, 0.3)' 
                : 'none',
              fontWeight: 'bold',
              transition: 'all 0.2s ease'
            }}
          >
            <Gamepad size={18} />
            Game Categories
          </motion.button>
        </div>

        {/* Content area */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ padding: '20px 30px 50px' }}
        >
          {/* Loading State */}
          {isLoading ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
              opacity: 0.5
            }}>
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} style={{
                  background: 'linear-gradient(145deg, #1A1A1A, #212121)',
                  borderRadius: '15px',
                  overflow: 'hidden',
                  height: '300px',
                  animationName: `${pulse.getName()}`,
                  animationDuration: '1.5s',
                  animationIterationCount: 'infinite',
                  animationTimingFunction: 'ease-in-out'
                }}>
                  <div style={{ height: '160px', background: '#1E1E1E' }} />
                  <div style={{ padding: '15px' }}>
                    <div style={{ width: '70%', height: '20px', background: '#242424', marginBottom: '10px', borderRadius: '4px' }} />
                    <div style={{ width: '40%', height: '15px', background: '#242424', borderRadius: '4px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'popular' ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {filteredStreamers.map(streamer => (
                <motion.div 
                  key={streamer.id}
                  className="stream-card"
                  whileHover={{ y: -5 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    background: 'linear-gradient(145deg, #1A1A1A, #212121)',
                    borderRadius: '15px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255, 85, 0, 0.2)',
                    position: 'relative'
                  }}
                  onClick={() => toast.success(`Watching ${streamer.name}'s stream`)}
                >
                  <div style={{
                    position: 'relative',
                    height: '180px',
                    backgroundImage: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.6)), url(https://picsum.photos/600/300?random=' + streamer.id + ')',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '15px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: 'rgba(255, 0, 0, 0.7)',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      alignSelf: 'flex-start',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                    }}>
                      <span className="live-dot" style={{ 
                        width: '6px', 
                        height: '6px', 
                        backgroundColor: 'white', 
                        borderRadius: '50%', 
                        display: 'inline-block'
                      }}></span>
                      LIVE
                    </div>
                  </div>
                  
                  <div style={{ padding: '15px' }}>
                    <h3 style={{ 
                      fontSize: '18px', 
                      margin: '0 0 5px',
                      color: 'white',
                      fontWeight: 'bold',
                    }}>
                      {streamer.name}
                    </h3>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px'
                    }}>
                      <p style={{
                        fontSize: '14px', 
                        color: '#FF7700',
                        margin: 0,
                        fontWeight: 'bold'
                      }}>
                        {streamer.game}
                      </p>
                      <p style={{
                        fontSize: '14px', 
                        color: 'rgba(255, 255, 255, 0.7)',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <Users size={14} />
                        {streamer.viewers.toLocaleString()}
                      </p>
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginTop: '10px'
                    }}>
                      {streamer.genres.map(genre => (
                        <span key={genre} style={{
                          backgroundColor: 'rgba(42, 26, 18, 0.7)',
                          color: 'rgba(255, 119, 0, 0.9)',
                          borderRadius: '12px',
                          padding: '3px 10px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          border: '1px solid rgba(255, 85, 0, 0.3)',
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
          ) : (
            // Categories grid
            renderCategoriesGrid()
          )}
        </motion.div>
      </div>
    </>
  );
};

export default StreamingPage;
