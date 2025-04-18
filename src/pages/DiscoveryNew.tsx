import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { debounce } from 'lodash';
import axios from 'axios';
import '../styles/discovery-retro.css';
import '../styles/discovery-updates.css';
import '../styles/gameboy-controller-new.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faGamepad, faVideo, faChevronLeft, faChevronRight, faComment, faTimes, faUser, faCut } from '@fortawesome/free-solid-svg-icons';
import CliptLogoSVG from '../assets/clipt_logo_text.svg'; 
import RealtimeChat from '../components/messages/RealtimeChat';

const DiscoveryNew = () => {
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

  // Refs
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

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

  // Search games with debounce
  const searchGames = useRef(
    debounce(async (query) => {
      if (!query) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL || 'https://clipt-api-prod.azurewebsites.net'}/api/game/search?q=${query}&limit=20`
        );
        setSearchResults(response.data);
      } catch (error) {
        console.error('Error searching games:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500)
  ).current;

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchGames(query);
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
    if (!isSwiping) {
      setIsSwiping(true);
    }

    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    const progress = Math.min(Math.abs(diff) / 100, 1);
    
    setSwipeProgress(progress);
    setSwipeDirection(diff > 0 ? 'right' : 'left');
  };

  const handleTouchEnd = () => {
    if (isSwiping) {
      if (swipeProgress > 0.2) {
        if (swipeDirection === 'left' && currentIndex < streamers.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else if (swipeDirection === 'right' && currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }
      }
      
      setIsSwiping(false);
      setSwipeProgress(0);
    }
  };

  // Format large numbers with K, M, etc.
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num;
  };

  // Toggle chat
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
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
          <div className="header">
            <div className="logo-container">
              <img src={CliptLogoSVG} alt="Clipt Logo" className="clipt-logo small-logo" />
            </div>
            <div className="header-right">
              <div className="header-buttons">
                <button 
                  className="stream-button icon-button"
                >
                  <FontAwesomeIcon icon={faVideo} size="lg" color="#ff8c00" />
                </button>
                <button 
                  className="search-button icon-button"
                  onClick={() => setSearchModalOpen(true)}
                >
                  <FontAwesomeIcon icon={faSearch} size="lg" color="#ff8c00" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Game Info Bar (if game is selected) */}
          {selectedGame && (
            <div className="game-info-bar">
              <div className="game-cover">
                {selectedGame.cover_url && (
                  <img src={selectedGame.cover_url} alt={`${selectedGame.name} cover`} />
                )}
              </div>
              <div className="game-details">
                <h3>{selectedGame.name}</h3>
                <div className="game-stats">
                  <span>
                    <FontAwesomeIcon icon={faVideo} />
                    {formatNumber(selectedGame.post_count || 0)} clips
                  </span>
                  <span>
                    <FontAwesomeIcon icon={faGamepad} />
                    {formatNumber(selectedGame.follows_count || 0)} follows
                  </span>
                </div>
              </div>
              <button 
                className="clear-game-button"
                onClick={() => setSelectedGame(null)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          )}
          
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
                  <div className="streamer-info">
                    <div className="streamer-details">
                      <div className="avatar">
                        <img src={streamers[currentIndex].avatar_url} alt={`${streamers[currentIndex].username}'s avatar`} />
                      </div>
                      <div className="streamer-text">
                        <h3>{streamers[currentIndex].username}</h3>
                        <p>{streamers[currentIndex].bio || 'Streaming now'}</p>
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
                </div>
              ) : (
                <div className="empty-content">
                  <div className="empty-message">
                    <p>No streams available</p>
                  </div>
                </div>
              )
            )}
           
            {/* Remove hidden navigation arrows */}
            
            {/* Simplified GameBoy controller buttons to match the image exactly */}
            <div className="gameboy-controller">
              <button className="gameboy-btn left-arrow" onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)} disabled={currentIndex === 0}>
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              
              <button className="gameboy-btn chat-btn" onClick={toggleChat}>
                <FontAwesomeIcon icon={faComment} />
              </button>
              
              <button className="gameboy-btn donate-btn">
                <span>$</span>
              </button>
              
              <button className="gameboy-btn user-btn">
                <FontAwesomeIcon icon={faUser} />
              </button>
              
              <button className="gameboy-btn scissors-btn">
                <FontAwesomeIcon icon={faCut} />
              </button>
              
              <button className="gameboy-btn right-arrow" onClick={() => currentIndex < streamers.length - 1 && setCurrentIndex(currentIndex + 1)} disabled={currentIndex === streamers.length - 1}>
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
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
              transition={{ duration: 0.3 }}
            >
              <div className="search-container">
                <div className="search-header">
                  <h2>Find Games</h2>
                  <button 
                    className="close-button"
                    onClick={() => setSearchModalOpen(false)}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                
                <div className="search-input-container">
                  <FontAwesomeIcon icon={faSearch} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search for games..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    ref={searchInputRef}
                    autoFocus
                    className="search-input"
                  />
                </div>
                
                {/* Trending games section */}
                {!searchQuery && (
                  <div className="trending-games">
                    <h3>Trending Games</h3>
                    <div className="trending-games-grid">
                      {trendingGames.map(game => (
                        <div 
                          key={game.id} 
                          className="trending-game-item"
                          onClick={() => handleGameSelect(game)}
                        >
                          <div className="game-cube">
                            {game.cover_url ? (
                              <img src={game.cover_url} alt={`${game.name} cover`} />
                            ) : (
                              <div className="no-cover">
                                <FontAwesomeIcon icon={faGamepad} />
                              </div>
                            )}
                          </div>
                          <div className="trending-game-info">
                            <h4>{game.name}</h4>
                            <div className="game-stats">
                              <span>
                                <FontAwesomeIcon icon={faVideo} />
                                {formatNumber(game.post_count || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Search results */}
                {searchQuery && (
                  <div className="search-results">
                    {isSearching ? (
                      <div className="loading">Searching...</div>
                    ) : searchResults.length > 0 ? (
                      <div className="results-grid">
                        {searchResults.map(game => (
                          <div 
                            key={game.id} 
                            className="game-result-item"
                            onClick={() => handleGameSelect(game)}
                          >
                            <div className="game-cover">
                              {game.cover_url ? (
                                <img src={game.cover_url} alt={`${game.name} cover`} />
                              ) : (
                                <div className="no-cover">
                                  <FontAwesomeIcon icon={faGamepad} />
                                </div>
                              )}
                            </div>
                            <div className="game-info">
                              <h4>{game.name}</h4>
                              <div className="game-stats">
                                <span>
                                  <FontAwesomeIcon icon={faVideo} />
                                  {formatNumber(game.post_count || 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-results">
                        <p>No games found matching "{searchQuery}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
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
      </div>
    </div>
  );
};

export default DiscoveryNew;