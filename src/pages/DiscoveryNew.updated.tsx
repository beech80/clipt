import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import axios from 'axios';
import '../styles/discovery-retro.css';
import '../styles/discovery-updates.css';
import '../styles/gameboy-controller-new.css';
import '../styles/discovery-nav-buttons.css';
import '../styles/gameboy-buttons-override.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faGamepad, faVideo, faChevronLeft, faChevronRight, faComment, faTimes, faUser, faCut, faHome, faDollarSign, faCog, faArrowLeft, faHeart } from '@fortawesome/free-solid-svg-icons';
import CliptLogoSVG from '../assets/clipt_logo_text.svg'; 
import RealtimeChat from '../components/messages/RealtimeChat';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const DiscoveryNew: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Game search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [trendingGames, setTrendingGames] = useState([]);

  // Streamers state
  const [streamers, setStreamers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [startX, setStartX] = useState(0);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentStreamer, setCurrentStreamer] = useState(null);
  
  // UI controls state
  const [areControlsVisible, setAreControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Search tabs state
  const [activeSearchTab, setActiveSearchTab] = useState('games');
  const [streamerResults, setStreamerResults] = useState([]);
  const [clipResults, setClipResults] = useState([]);
  
  // Set up the controls auto-hide functionality
  useEffect(() => {
    // Show controls initially
    setAreControlsVisible(true);
    
    // Function to hide controls after delay
    const startControlsTimer = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      controlsTimeoutRef.current = setTimeout(() => {
        setAreControlsVisible(false);
      }, 10000); // 10 seconds
    };
    
    // Start the timer initially
    startControlsTimer();
    
    // Set up tap/click event to show controls
    const handleTap = () => {
      setAreControlsVisible(true);
      startControlsTimer();
    };
    
    document.addEventListener('click', handleTap);
    
    // Prevent scrolling
    const preventScroll = (e: Event) => {
      e.preventDefault();
    };
    
    document.body.style.overflow = 'hidden';
    document.addEventListener('wheel', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      document.removeEventListener('click', handleTap);
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
      document.body.style.overflow = '';
    };
  }, []);
  
  // Get trending games on component mount
  useEffect(() => {
    const fetchTrendingGames = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL || 'https://clipt-api-prod.azurewebsites.net'}/api/game/trending?limit=3`);
        setTrendingGames(response.data);
      } catch (error) {
        console.error('Error fetching trending games:', error);
      }
    };

    fetchTrendingGames();
  }, []);

  // Fetch streamers or game content based on selection
  useEffect(() => {
    const fetchStreamers = async () => {
      try {
        let url = `${process.env.REACT_APP_API_URL || 'https://clipt-api-prod.azurewebsites.net'}/api/streamers`;
        
        if (selectedGame) {
          url = `${process.env.REACT_APP_API_URL || 'https://clipt-api-prod.azurewebsites.net'}/api/streamers/game/${selectedGame.id}`;
        }

        const response = await axios.get(url);
        setStreamers(response.data);
        setCurrentIndex(0);
        
        if (response.data.length > 0) {
          setCurrentStreamer(response.data[0]);
        }
      } catch (error) {
        console.error('Error fetching streamers:', error);
      }
    };

    fetchStreamers();
  }, [selectedGame]);

  // Set current streamer when index changes
  useEffect(() => {
    if (streamers.length > 0 && currentIndex < streamers.length) {
      setCurrentStreamer(streamers[currentIndex]);
    }
  }, [currentIndex, streamers]);

  // Search with debounce - supports games, streamers, and clips
  const searchAll = useRef(
    debounce(async (query) => {
      if (!query) {
        setSearchResults([]);
        setStreamerResults([]);
        setClipResults([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        
        // Parallel search requests for better performance
        const [gamesResponse, streamersResponse, clipsResponse] = await Promise.all([
          // Games search
          axios.get(`${process.env.REACT_APP_API_URL || 'https://clipt-api-prod.azurewebsites.net'}/api/game/search`, {
            params: {
              query,
              limit: 20 // Increased from 10 to show more results
            }
          }),
          // Streamers search
          axios.get(`${process.env.REACT_APP_API_URL || 'https://clipt-api-prod.azurewebsites.net'}/api/streamers/search`, {
            params: { query }
          }),
          // Clips search
          axios.get(`${process.env.REACT_APP_API_URL || 'https://clipt-api-prod.azurewebsites.net'}/api/clips/search`, {
            params: { query }
          })
        ]);

        setSearchResults(gamesResponse.data);
        setStreamerResults(streamersResponse.data);
        setClipResults(clipsResponse.data);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500)
  ).current;

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchAll(query);
  };
  
  // Handle search tab change
  const handleSearchTabChange = (tab) => {
    setActiveSearchTab(tab);
  };
  
  // Handle game selection
  const handleGameSelect = (game) => {
    setSelectedGame(game);
    setSearchQuery('');
    setSearchResults([]);
    setSearchModalOpen(false);
  };
  
  // Swipe functionality
  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
  };
  
  const handleTouchMove = (e) => {
    if (!startX) return;
    
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    
    // Determine swipe direction and progress
    if (Math.abs(diff) > 30) {
      setIsSwiping(true);
      setSwipeDirection(diff > 0 ? 'left' : 'right');
      setSwipeProgress(Math.min(100, Math.abs(diff / 3))); // Calculate progress based on distance
    }
  };
  
  const handleTouchEnd = () => {
    if (!isSwiping) {
      setStartX(0);
      return;
    }
    
    // If swiped far enough, change streamer
    if (swipeProgress > 40) {
      if (swipeDirection === 'left' && currentIndex < streamers.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (swipeDirection === 'right' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    }
    
    // Reset swipe state
    setIsSwiping(false);
    setSwipeDirection(null);
    setSwipeProgress(0);
    setStartX(0);
  };
  
  // Format large numbers with K, M, etc.
  const formatNumber = (num) => {
    if (num === undefined || num === null) return '-';
    if (num < 1000) return num;
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
    return (num / 1000000000).toFixed(1) + 'B';
  };
  
  // Toggle chat
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };
  
  // Navigate to previous streamer with smooth animation
  const goToPreviousStreamer = () => {
    if (currentIndex > 0) {
      // Set swiping state to trigger animation
      setIsSwiping(true);
      setSwipeDirection('right');
      setSwipeProgress(100);
      
      // After animation duration, update index
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        setIsSwiping(false);
        setSwipeDirection(null);
        setSwipeProgress(0);
      }, 300);
    }
  };
  
  // Navigate to next streamer with smooth animation
  const goToNextStreamer = () => {
    if (currentIndex < streamers.length - 1) {
      // Set swiping state to trigger animation
      setIsSwiping(true);
      setSwipeDirection('left');
      setSwipeProgress(100);
      
      // After animation duration, update index
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsSwiping(false);
        setSwipeDirection(null);
        setSwipeProgress(0);
      }, 300);
    }
  };
  
  // Navigate to streaming page
  const goToStreaming = () => {
    navigate('/streaming');
  };

  return (
    <div className="discovery-page">
      <div className="discovery-container">
        {/* Top Half - Stream Display */}
        <motion.div 
          className="stream-display-container"
          layout
          transition={{ duration: 0.3 }}
          style={{ height: isChatOpen ? '60%' : '100%' }}
        >
          {/* Main content area */}
          <div className="discovery-content-wrapper">
            <div className="discovery-background">
              {/* Stream Content */}
              <div 
                className="stream-container" 
                ref={containerRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {selectedGame ? (
                  // Game-specific content (Streamer videos or clips)
                  streamers.length > 0 ? (
                    <div className="stream-wrapper">
                      <video 
                        src={streamers[currentIndex].stream_url} 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        className="stream-video full-screen" 
                      />
                      {currentStreamer && (
                        <div className="streamer-info">
                          <div className="streamer-details">
                            <div className="avatar">
                              <img src={currentStreamer.avatar_url} alt={`${currentStreamer.username}'s avatar`} />
                            </div>
                            <div className="streamer-text">
                              <div className="streamer-name-bar">
                                <h3>{currentStreamer.username}</h3>
                              </div>
                              <div className="game-name-bar">
                                <p>{selectedGame ? selectedGame.name : 'Streaming now'}</p>
                              </div>
                            </div>
                          </div>
                          <button 
                            className="chat-button retro-button"
                            onClick={toggleChat}
                          >
                            <FontAwesomeIcon icon={faComment} />
                            <span>{isChatOpen ? 'Close Chat' : 'Open Chat'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="empty-content">
                      <div className="empty-message">
                        <p>No content found for {selectedGame.name}</p>
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
                        className="stream-video full-screen" 
                      />
                      {currentStreamer && (
                        <div className="streamer-info">
                          <div className="streamer-details">
                            <div className="avatar">
                              <img src={currentStreamer.avatar_url} alt={`${currentStreamer.username}'s avatar`} />
                            </div>
                            <div className="streamer-text">
                              <div className="streamer-name-bar">
                                <h3>{currentStreamer.username}</h3>
                              </div>
                              <div className="game-name-bar">
                                <p>{currentStreamer.game_name || 'Live Now'}</p>
                              </div>
                            </div>
                          </div>
                          <button 
                            className="chat-button retro-button"
                            onClick={toggleChat}
                          >
                            <FontAwesomeIcon icon={faComment} />
                            <span>{isChatOpen ? 'Close Chat' : 'Open Chat'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="trending-games-grid">
                      <h3 className="trending-title">Trending Games</h3>
                      <div className="game-grid">
                        {trendingGames.map(game => (
                          <div 
                            key={game.id} 
                            className="game-cube"
                            onClick={() => handleGameSelect(game)}
                          >
                            <div className="game-cube-inner">
                              <img 
                                src={game.cover_url || 'https://via.placeholder.com/150?text=No+Image'}
                                alt={game.name} 
                                className="game-cover" 
                              />
                              <div className="game-info">
                                <h4>{game.name}</h4>
                                <div className="game-stats">
                                  <span className="viewers">
                                    <FontAwesomeIcon icon={faUser} />
                                    {formatNumber(game.viewers || 0)}
                                  </span>
                                  <span className="popularity">
                                    <FontAwesomeIcon icon={faHeart} />
                                    {formatNumber(game.post_count || game.popularity || 0)}
                                  </span>
                                </div>
                              </div>
                              <div className="cube-shadow"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Visual swipe indicator */}
              {isSwiping && swipeDirection && (
                <div 
                  className={`swipe-indicator ${swipeDirection}`}
                  style={{ opacity: swipeProgress / 200 }}
                >
                  <FontAwesomeIcon 
                    icon={swipeDirection === 'left' ? faChevronRight : faChevronLeft} 
                    size="3x" 
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Search Modal */}
          <AnimatePresence>
            {searchModalOpen && (
              <motion.div 
                className="search-modal"
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              >
                <div className="search-header">
                  <button 
                    className="close-button"
                    onClick={() => setSearchModalOpen(false)}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                  <h3>Search</h3>
                </div>
                
                <div className="search-container">
                  <div className="search-input-container">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder="Search for games, streamers, or clips..."
                      className="search-input"
                      ref={searchInputRef}
                      autoFocus
                    />
                  </div>
                  
                  <div className="search-tabs">
                    <button 
                      className={`tab-button ${activeSearchTab === 'games' ? 'active' : ''}`}
                      onClick={() => handleSearchTabChange('games')}
                    >
                      <FontAwesomeIcon icon={faGamepad} /> Games
                    </button>
                    <button 
                      className={`tab-button ${activeSearchTab === 'streamers' ? 'active' : ''}`}
                      onClick={() => handleSearchTabChange('streamers')}
                    >
                      <FontAwesomeIcon icon={faVideo} /> Streamers
                    </button>
                    <button 
                      className={`tab-button ${activeSearchTab === 'clips' ? 'active' : ''}`}
                      onClick={() => handleSearchTabChange('clips')}
                    >
                      <FontAwesomeIcon icon={faCut} /> Clips
                    </button>
                  </div>
                  
                  {isSearching ? (
                    <div className="loading-indicator">
                      <div className="spinner"></div>
                      <p>Searching...</p>
                    </div>
                  ) : (
                    <>
                      {/* Games Tab */}
                      {activeSearchTab === 'games' && (
                        <div className="results-grid">
                          {searchResults && searchResults.length > 0 ? (
                            searchResults.map(game => (
                              <div 
                                key={game.id} 
                                className="game-result-item"
                                onClick={() => handleGameSelect(game)}
                              >
                                <div className="game-image">
                                  {game.cover_url ? (
                                    <img src={game.cover_url} alt={`${game.name} cover`} />
                                  ) : (
                                    <div className="no-image">
                                      <FontAwesomeIcon icon={faGamepad} />
                                    </div>
                                  )}
                                </div>
                                <div className="game-info">
                                  <h4>{game.name}</h4>
                                  <div className="game-meta">
                                    <span className="viewer-count">
                                      <FontAwesomeIcon icon={faUser} className="icon" />
                                      {formatNumber(game.viewer_count || 0)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="no-results">
                              <p>No games found matching "{searchQuery}"</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Streamers Tab */}
                      {activeSearchTab === 'streamers' && (
                        <div className="results-grid">
                          {streamerResults && streamerResults.length > 0 ? (
                            streamerResults.map(streamer => (
                              <div 
                                key={streamer.id} 
                                className="streamer-result-item"
                                onClick={() => navigate(`/streamers/${streamer.id}`)}
                              >
                                <div className="streamer-avatar">
                                  {streamer.avatar_url ? (
                                    <img src={streamer.avatar_url} alt={`${streamer.username}'s avatar`} />
                                  ) : (
                                    <div className="no-avatar">
                                      <FontAwesomeIcon icon={faUser} />
                                    </div>
                                  )}
                                </div>
                                <div className="streamer-info">
                                  <h4>{streamer.username}</h4>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="no-results">
                              <p>No streamers found matching "{searchQuery}"</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Clips Tab */}
                      {activeSearchTab === 'clips' && (
                        <div className="results-grid">
                          {clipResults && clipResults.length > 0 ? (
                            clipResults.map(clip => (
                              <div 
                                key={clip.id} 
                                className="clip-result-item"
                                onClick={() => navigate(`/clips/${clip.id}`)}
                              >
                                <div className="clip-thumbnail">
                                  {clip.thumbnail_url ? (
                                    <img src={clip.thumbnail_url} alt={`Clip thumbnail`} />
                                  ) : (
                                    <div className="no-thumbnail">
                                      <FontAwesomeIcon icon={faVideo} />
                                    </div>
                                  )}
                                </div>
                                <div className="clip-info">
                                  <h4>{clip.title || 'Untitled Clip'}</h4>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="no-results">
                              <p>No clips found matching "{searchQuery}"</p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Chat panel */}
        <AnimatePresence>
          {isChatOpen && currentStreamer && (
            <motion.div 
              className="chat-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: '40%' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <RealtimeChat 
                partnerId={currentStreamer.id}
                partnerInfo={{
                  id: currentStreamer.id,
                  username: currentStreamer.username,
                  displayName: currentStreamer.username,
                  avatarUrl: currentStreamer.avatar_url
                }}
                onClose={toggleChat}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Navigation buttons */}
        <div className={`single-row-nav ${areControlsVisible ? 'visible' : 'hidden'}`}>
          {/* Stream Button */}
          <button 
            className="nav-button stream-button" 
            onClick={goToStreaming}
            style={{ backgroundColor: 'transparent', border: 'none' }}
          >
            <FontAwesomeIcon 
              icon={faVideo} 
              style={{ color: '#FF8C00', filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.7))' }}
              size="2x"
            />
          </button>
          
          {/* Left Arrow - Previous Streamer */}
          <button 
            className="nav-button" 
            onClick={goToPreviousStreamer}
            style={{ backgroundColor: 'transparent', border: 'none' }}
          >
            <FontAwesomeIcon 
              icon={faArrowLeft} 
              style={{ color: '#FF8C00', filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.7))' }}
              size="2x"
            />
          </button>
          
          {/* Right Arrow - Next Streamer */}
          <button 
            className="nav-button" 
            onClick={goToNextStreamer}
            style={{ backgroundColor: 'transparent', border: 'none' }}
          >
            <FontAwesomeIcon 
              icon={faChevronRight} 
              style={{ color: '#FF8C00', filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.7))' }}
              size="2x" 
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryNew;
