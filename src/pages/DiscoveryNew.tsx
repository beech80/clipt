import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { debounce } from 'lodash';
import axios from 'axios';
import '../styles/discovery-retro.css';
import '../styles/discovery-updates.css';
import '../styles/gameboy-controller-new.css';
import '../styles/discovery-nav-buttons.css';
import '../styles/gameboy-buttons-override.css'; // Strong button color overrides
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faGamepad, faVideo, faChevronLeft, faChevronRight, faComment, faTimes, faUser, faCut, faHome, faDollarSign, faCog, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
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

  // States for enhanced modals
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showClipLengthModal, setShowClipLengthModal] = useState(false);
  const [followStatus, setFollowStatus] = useState({});
  const [donationAmount, setDonationAmount] = useState(5);
  const [clipLength, setClipLength] = useState(60); // Default 60 seconds
  const [clipTargetStreamer, setClipTargetStreamer] = useState(null);

  // Follow a streamer
  const followStreamer = (streamerId) => {
    if (!streamerId) return;
    
    // Show visual feedback that follow action was triggered
    const followButton = document.querySelector('.nav-button:nth-child(2)');
    if (followButton) {
      followButton.classList.add('button-flash');
      setTimeout(() => followButton.classList.remove('button-flash'), 500);
    }
    
    // Toggle follow status for this streamer
    setFollowStatus(prev => ({
      ...prev,
      [streamerId]: !prev[streamerId]
    }));
    
    // Show follow confirmation with animation
    const confirmationEl = document.createElement('div');
    confirmationEl.className = 'follow-confirmation';
    confirmationEl.innerText = followStatus[streamerId] ? 'Unfollowed!' : 'Followed!';
    document.body.appendChild(confirmationEl);
    
    // Animate and remove
    setTimeout(() => {
      confirmationEl.classList.add('show');
      setTimeout(() => {
        confirmationEl.classList.remove('show');
        setTimeout(() => document.body.removeChild(confirmationEl), 300);
      }, 1000);
    }, 10);
    
    // In a real implementation, this would call the API to follow the streamer
    console.log(`${followStatus[streamerId] ? 'Unfollowing' : 'Following'} streamer with ID: ${streamerId}`);
    // Example API call (commented out)
    // axios.post(`${process.env.REACT_APP_API_URL}/api/streamers/${streamerId}/${followStatus[streamerId] ? 'unfollow' : 'follow'}`)
    //   .then(response => console.log(`${followStatus[streamerId] ? 'Unfollowed' : 'Followed'} successfully`))
    //   .catch(error => console.error(`Error ${followStatus[streamerId] ? 'unfollowing' : 'following'} streamer:`, error));
  };

  // Handle donation submission
  const handleDonationSubmit = (streamerId) => {
    if (!streamerId) return;
    
    // Show processing animation
    const donationConfirmEl = document.createElement('div');
    donationConfirmEl.className = 'donation-confirmation';
    donationConfirmEl.innerHTML = `<div class="donation-icon">💰</div><p>Thank you for donating $${donationAmount.toFixed(2)}!</p>`;
    document.body.appendChild(donationConfirmEl);
    
    // Animate and hide modal
    setTimeout(() => {
      donationConfirmEl.classList.add('show');
      setTimeout(() => {
        donationConfirmEl.classList.remove('show');
        setTimeout(() => document.body.removeChild(donationConfirmEl), 300);
      }, 2000);
    }, 10);
    
    setShowDonationModal(false);
    console.log(`Donating $${donationAmount} to streamer with ID: ${streamerId}`);
  };

  // Create a clip with selected length
  const createClip = (streamerId) => {
    if (!streamerId) return;
    
    // Set the target streamer and show length selection modal
    setClipTargetStreamer(streamerId);
    setShowClipLengthModal(true);
    
    // Show visual feedback that clip menu was triggered
    const clipButton = document.querySelector('.nav-button:nth-child(5)');
    if (clipButton) {
      clipButton.classList.add('button-flash');
      setTimeout(() => clipButton.classList.remove('button-flash'), 500);
    }
  };
  
  // Handle clip creation with selected length
  const handleClipCreate = () => {
    if (!clipTargetStreamer) return;
    
    // Show confirmation animation
    const clipConfirmEl = document.createElement('div');
    clipConfirmEl.className = 'clip-confirmation';
    clipConfirmEl.innerHTML = `<div class="clip-icon">✂️</div><p>Clip created! (${clipLength}s)</p>`;
    document.body.appendChild(clipConfirmEl);
    
    // Animate and remove
    setTimeout(() => {
      clipConfirmEl.classList.add('show');
      setTimeout(() => {
        clipConfirmEl.classList.remove('show');
        setTimeout(() => document.body.removeChild(clipConfirmEl), 300);
      }, 2000);
    }, 10);
    
    setShowClipLengthModal(false);
    console.log(`Creating ${clipLength}s clip for streamer with ID: ${clipTargetStreamer}`);
    // Example API call (commented out)
    // axios.post(`${process.env.REACT_APP_API_URL}/api/clips/create`, {
    //   streamerId: clipTargetStreamer,
    //   duration: clipLength
    // })
    //   .then(response => console.log('Clip created successfully', response.data))
    //   .catch(error => console.error('Error creating clip:', error));
  };

  // Navigate to previous streamer with smooth animation
  const goToPreviousStreamer = () => {
    if (streamers.length <= 1) return;
    
    const newIndex = (currentIndex - 1 + streamers.length) % streamers.length;
    
    // Show visual feedback for navigation
    setSwipeDirection('right');
    setSwipeProgress(100);
    
    // Transition with animation
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setCurrentStreamer(streamers[newIndex]);
      setSwipeDirection(null);
      setSwipeProgress(0);
    }, 300);
  };

  // Navigate to next streamer with smooth animation
  const goToNextStreamer = () => {
    if (streamers.length <= 1) return;
    
    const newIndex = (currentIndex + 1) % streamers.length;
    
    // Show visual feedback for navigation
    setSwipeDirection('left');
    setSwipeProgress(100);
    
    // Transition with animation
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setCurrentStreamer(streamers[newIndex]);
      setSwipeDirection(null);
      setSwipeProgress(0);
    }, 300);
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
            <div className="header-spacer"></div>
            <div className="header-right">
              <div className="header-circular-buttons">
                <button 
                  className="circular-button camera-button"
                  title="Browse Live Streams"
                  onClick={() => window.open('/livestreams', '_self')}
                  aria-label="Go to livestreams"
                  style={{
                    backgroundColor: '#3498db',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 15px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                  }}
                >
                  <FontAwesomeIcon icon={faVideo} size="lg" />
                </button>
                <button 
                  className="circular-button search-button"
                  title="Search"
                  onClick={() => setSearchModalOpen(true)}
                >
                  <FontAwesomeIcon icon={faSearch} size="lg" />
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
            
            {/* Gameboy controller removed as requested */}
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
              <div className="search-container retro-glass neon-border">
                <div className="search-header">
                  <h2><FontAwesomeIcon icon={faSearch} className="search-title-icon" /> Explore</h2>
                  <button 
                    className="close-button"
                    onClick={() => setSearchModalOpen(false)}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                
                <div className="cool-tabs">
                  <button className="tab-button active glow-effect">Games</button>
                  <button className="tab-button glow-effect">Streamers</button>
                  <button className="tab-button glow-effect">Clips</button>
                </div>
                
                <div className="search-input-container">
                  <FontAwesomeIcon icon={faSearch} className="search-icon pulse-glow" />
                  <input
                    type="text"
                    placeholder="Search anything..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    ref={searchInputRef}
                    autoFocus
                    className="search-input neon-glow"
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
        
        {/* Completely Flattened Navigation Bar - Single Row */}
        <div className="single-row-nav"> 
          {/* Left Arrow - Previous Streamer */}
          <button className="nav-button" onClick={goToPreviousStreamer}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          
          {/* Follow Current Streamer */}
          <button className="nav-button" onClick={() => currentStreamer && followStreamer(currentStreamer.id)}>
            <FontAwesomeIcon icon={followStatus[currentStreamer?.id] ? faUser : faUser} style={{ color: followStatus[currentStreamer?.id] ? '#ff7700' : 'white' }} />
            {followStatus[currentStreamer?.id] && <span className="follow-indicator"></span>}
          </button>
          
          {/* Chat for Current Stream */}
          <button className="nav-button" onClick={toggleChat}>
            <FontAwesomeIcon icon={faComment} />
          </button>
          
          {/* Donate to Current Streamer - Now opens modal */}
          <button className="nav-button" onClick={() => currentStreamer && setShowDonationModal(true)}>
            <FontAwesomeIcon icon={faDollarSign} />
          </button>
          
          {/* Record Clip (last minute) */}
          <button className="nav-button" onClick={() => currentStreamer && createClip(currentStreamer.id)}>
            <FontAwesomeIcon icon={faCut} />
          </button>
          
          {/* Right Arrow - Next Streamer */}
          <button className="nav-button" onClick={goToNextStreamer}>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
        
        {/* Donation Modal */}
        {showDonationModal && (
          <div className="modal-overlay">
            <div className="donation-modal retro-glass">
              <div className="donation-modal-header">
                <h3>Support {currentStreamer?.username}</h3>
                <button className="close-modal" onClick={() => setShowDonationModal(false)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              
              <div className="donation-avatar">
                <img src={currentStreamer?.avatar_url} alt={`${currentStreamer?.username}'s avatar`} />
              </div>
              
              <div className="donation-amount-selector">
                <h4>Select Amount</h4>
                <div className="amount-buttons">
                  {[2, 5, 10, 20, 50, 100].map(amount => (
                    <button 
                      key={amount}
                      className={`amount-button ${donationAmount === amount ? 'selected' : ''}`}
                      onClick={() => setDonationAmount(amount)}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
                
                <div className="custom-amount">
                  <label>Custom Amount:</label>
                  <div className="input-with-dollar">
                    <span>$</span>
                    <input 
                      type="number" 
                      min="1" 
                      value={donationAmount} 
                      onChange={(e) => setDonationAmount(Number(e.target.value))}
                      placeholder="Enter amount"
                    />
                  </div>
                </div>
                
                <button 
                  className="submit-donation"
                  onClick={() => handleDonationSubmit(currentStreamer?.id)}
                >
                  <FontAwesomeIcon icon={faDollarSign} /> Send Donation
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Clip Length Selection Modal */}
        {showClipLengthModal && (
          <div className="modal-overlay">
            <div className="clip-modal retro-glass">
              <div className="clip-modal-header">
                <h3>Create Clip</h3>
                <button className="close-modal" onClick={() => setShowClipLengthModal(false)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              
              <div className="clip-length-selector">
                <h4>Select Clip Length</h4>
                <div className="length-buttons">
                  {[15, 30, 60, 120, 300].map(length => (
                    <button 
                      key={length}
                      className={`length-button ${clipLength === length ? 'selected' : ''}`}
                      onClick={() => setClipLength(length)}
                    >
                      {length >= 60 ? `${Math.floor(length/60)}m${length%60 ? ` ${length%60}s` : ''}` : `${length}s`}
                    </button>
                  ))}
                </div>
                
                <div className="clip-preview">
                  <p>This will clip the last <span className="highlight">{clipLength}</span> seconds of the stream</p>
                </div>
                
                <button 
                  className="create-clip-button"
                  onClick={handleClipCreate}
                >
                  <FontAwesomeIcon icon={faCut} /> Create Clip
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoveryNew;