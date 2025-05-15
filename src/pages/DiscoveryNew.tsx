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
import '../styles/discovery-controls-fade.css';
import '../styles/follow-button-animations.css';
import '../styles/modal-animations.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faChevronRight, 
  faComment, 
  faCopy,
  faCut, 
  faDollarSign, 
  faDownload, 
  faShare, 
  faStar, 
  faThumbsDown, 
  faThumbsUp, 
  faUser,
  faUserCheck, 
  faUserPlus, 
  faVideo,
  faSearch, 
  faGamepad, 
  faChevronLeft, 
  faTimes, 
  faHome, 
  faCog, 
  faHeart, 
  faStarHalfAlt,
  faScissors,
  faShareAlt,
  faCamera,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import CliptLogoSVG from '../assets/clipt_logo_text.svg'; 
import RealtimeChat from '../components/messages/RealtimeChat';
import DonationModal from '../components/DonationModal';
import ClippingTool from '../components/ClippingTool';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from "@/components/ui/use-toast";

const DiscoveryNew: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Navigation functions are defined below

  // Game search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareTitle, setShareTitle] = useState('');
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
  const [clipRating, setClipRating] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [clipToRate, setClipToRate] = useState(null);
  
  // UI controls state
  const [areControlsVisible, setAreControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Modal states
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [isClippingModalOpen, setIsClippingModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Refs
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Search tabs state
  const [activeSearchTab, setActiveSearchTab] = useState('games');
  const [streamerResults, setStreamerResults] = useState([]);
  const [clipResults, setClipResults] = useState([]);
  
  // Shared clips state
  const [sharedClips, setSharedClips] = useState<any[]>([]);
  
  // Add loading and error states for fetching streams
  const [loadingStreams, setLoadingStreams] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);

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

  const fetchStreamers = async () => {
    setLoadingStreams(true);
    setStreamError(null);
    try {
      const response = await fetch('http://localhost:3002/api/live-streams');
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }
      const data = await response.json();
      
      const CLOUDFLARE_CUSTOMER_ID = 'customer-9cbdk1udzakdxkzu'; // TODO: Move to env var

      const mappedStreamers = data.map((stream: any) => ({
        id: stream.uid,
        username: stream.meta?.streamerName || `Streamer ${stream.uid.substring(0,6)}`,
        game: stream.meta?.gameName || 'Exploring',
        avatar: stream.thumbnail || 'default_avatar_placeholder.png', // Use stream thumbnail as avatar
        videoUrl: `https://${CLOUDFLARE_CUSTOMER_ID}.cloudflarestream.com/${stream.uid}/manifest/video.m3u8`,
        playbackId: stream.uid,
        meta: stream.meta,
        thumbnail: stream.thumbnail,
        status: stream.status,
        viewers: stream.meta?.viewers || 0, 
        isLive: stream.status === 'live',
        bio: stream.meta?.bio || 'No bio available.',
        category: stream.meta?.genres ? stream.meta.genres.join(', ') : 'General',
        profilePic: stream.thumbnail, 
        streamTitle: stream.meta?.name || stream.meta?.streamerName || `Live Stream ${stream.uid.substring(0,6)}`,
      }));
      
      // Filter for live streams, as the API might return other statuses if backend logic changes
      const liveOnlyStreamers = mappedStreamers.filter(s => s.isLive);
      setStreamers(liveOnlyStreamers);
      
      if (liveOnlyStreamers.length > 0 && currentIndex >= liveOnlyStreamers.length) {
        setCurrentIndex(0); // Reset index if out of bounds
      }

    } catch (err) {
      console.error("Failed to fetch live streams:", err);
      setStreamError(err.message || 'Failed to load streams');
      setStreamers([]); // Clear streamers on error
    } finally {
      setLoadingStreams(false);
    }
  };

  useEffect(() => {
    fetchStreamers();
  }, []);

  // Effect to set currentStreamer based on streamers and currentIndex
  useEffect(() => {
    if (streamers.length > 0) {
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
    if (e.target.value.length > 2) {
      setIsSearching(true);
      // Perform search using e.target.value for games, streamers, or clips based on activeSearchTab
      // Example for games (update for streamers/clips):
      if (activeSearchTab === 'games') {
        searchGames(e.target.value);
      } else if (activeSearchTab === 'streamers') {
        searchStreamers(e.target.value); // You'll need to implement searchStreamers
      } else if (activeSearchTab === 'clips') {
        searchClips(e.target.value); // You'll need to implement searchClips
      }
    } else {
      setIsSearching(false);
      setSearchResults([]);
      setStreamerResults([]);
      setClipResults([]);
    }
  };

  const searchGames = async (query) => {
    // This is a placeholder. Replace with your actual game search logic.
    // Example: const response = await axios.get(`/api/search/games?q=${query}`);
    // setSearchResults(response.data);
    console.log(`Searching games for: ${query}`);
  };

  const searchStreamers = async (query) => {
    // Placeholder for streamer search logic - for now, it could filter local live streams if desired
    console.log(`Searching streamers for: ${query}`);
    if (streamers && streamers.length > 0) {
      const filtered = streamers.filter(s => s.username.toLowerCase().includes(query.toLowerCase()));
      setStreamerResults(filtered);
    } else {
      setStreamerResults([]);
    }
  };

  const searchClips = async (query) => {
    // Placeholder for clip search logic
    console.log(`Searching clips for: ${query}`);
    // Example: const response = await axios.get(`/api/search/clips?q=${query}`);
    // setClipResults(response.data);
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
  
  // Function to toggle chat panel with animation
  const toggleChat = () => {
    if (isChatOpen) {
      // Apply closing animation class
      const chatPanel = document.querySelector('.chat-panel');
      if (chatPanel) {
        chatPanel.classList.add('closing');
        // Wait for animation to complete before hiding
        setTimeout(() => {
          setIsChatOpen(false);
          chatPanel.classList.remove('closing');
        }, 300);
      }
    } else {
      setIsChatOpen(true);
    }
  };
  
  // Close chat when clicking outside - enhanced for better detection
  useEffect(() => {
    if (!isChatOpen) return;
    
    const handleClickOutside = (e) => {
      const chatPanel = document.querySelector('.chat-panel');
      const chatButton = document.querySelector('.chat-button');
      
      // Make sure we're not clicking on the chat panel or the chat button
      if (chatPanel && !chatPanel.contains(e.target) && 
          (!chatButton || !chatButton.contains(e.target))) {
        console.log('Clicking outside chat panel, closing chat');
        toggleChat();
      }
    };
    
    // Use capture phase to ensure we catch clicks before they're handled by other elements
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isChatOpen]);
  
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
    console.log('Navigating to streaming page...');
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
                        src={streamers[currentIndex].videoUrl} 
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
                              <img src={currentStreamer.avatar} alt={`${currentStreamer.username}'s avatar`} />
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
                        src={streamers[currentIndex].videoUrl} 
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
                              <img src={currentStreamer.avatar} alt={`${currentStreamer.username}'s avatar`} />
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
              <div>
                {sharedClips.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-orange-500 font-medium mb-3 flex items-center">
                      <FontAwesomeIcon icon={faCut} className="mr-2" />
                      Shared Clips
                    </h4>
                    
                    {sharedClips.map((clip, index) => (
                      <div 
                        key={index} 
                        className="mb-3 bg-gray-800/50 p-3 rounded-lg border-l-2 border-orange-500"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-orange-400 font-medium">{clip.username}</span>
                            <span className="text-gray-400 text-sm ml-2">
                              shared a {clip.duration}s clip from {clip.streamer}
                            </span>
                          </div>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FontAwesomeIcon 
                                key={star}
                                icon={star <= (clip.rating || 0) ? faStar : faStarHalfAlt}
                                className={star <= (clip.rating || 0) ? 'text-yellow-500' : 'text-gray-600'}
                              />
                            ))}
                          </div>
                        </div>
                        {clip.comment && (
                          <p className="mt-2 text-gray-300 italic">"{clip.comment}"</p>
                        )}
                        <div className="mt-2 flex gap-2">
                          <button className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded">
                            Watch
                          </button>
                          <button className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded">
                            Rate
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="relative w-full h-full">
                  <button 
                    className="absolute top-3 right-3 z-50 bg-gray-800 hover:bg-gray-700 rounded-full p-2"
                    onClick={toggleChat}
                    title="Close chat"
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-white" />
                  </button>
                  <RealtimeChat
                    partnerId={currentStreamer?.id}
                    partnerInfo={{
                      id: currentStreamer?.id,
                      username: currentStreamer?.username,
                      displayName: currentStreamer?.display_name,
                      avatarUrl: currentStreamer?.avatar_url || ''
                    }}
                    onClose={toggleChat}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Modals */}
        <AnimatePresence>
          {isDonationModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DonationModal
                isOpen={isDonationModalOpen}
                streamerName={currentStreamer?.username}
                onClose={() => setIsDonationModalOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Clipping Tool Modal */}
        <AnimatePresence>
          {isClippingModalOpen && currentStreamer && streamers.length > 0 && (
            <ClippingTool
              isOpen={isClippingModalOpen}
              videoUrl={streamers[currentIndex].videoUrl}
              streamerName={currentStreamer.username}
              onClose={() => setIsClippingModalOpen(false)}
              onShareInChat={(clipData) => {
                setSharedClips(prev => [
                  {
                    ...clipData,
                    username: 'You',
                    timestamp: new Date().toISOString(),
                    streamer: currentStreamer.username
                  },
                  ...prev
                ]);
                setIsChatOpen(true);
              }}
            />
          )}
          
          {/* Rating Modal for Clips */}
          <AnimatePresence>
            {showRatingModal && clipToRate && (
              <motion.div 
                className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-orange-500 shadow-lg">
                  <h3 className="text-xl font-bold text-orange-500 mb-4">Rate Your Clip</h3>
                  <p className="text-white mb-2">60-second clip from {clipToRate.streamer}'s stream</p>
                  
                  <div className="flex justify-center mb-6 mt-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star} 
                        onClick={() => setClipRating(star)}
                        className="mx-1 transform transition-transform hover:scale-110"
                      >
                        <FontAwesomeIcon 
                          icon={star <= clipRating ? faStar : faStarHalfAlt}
                          className={star <= clipRating ? 'text-yellow-500' : 'text-gray-600'}
                          size="2x"
                        />
                      </button>
                    ))}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-300 mb-2">Add a comment (optional):</label>
                    <textarea 
                      className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700"
                      rows={3}
                      placeholder="What did you think of this moment?"
                    ></textarea>
                  </div>
                  
                  <div className="flex justify-between">
                    <button 
                      className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                      onClick={() => {
                        setShowRatingModal(false);
                        setClipRating(0);
                      }}
                    >
                      Cancel
                    </button>
                    
                    <div className="flex space-x-2">
                      <button 
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 flex items-center"
                        onClick={() => {
                          // Add to chat with rating
                          const textarea = document.querySelector('textarea');
                          const comment = textarea ? textarea.value : '';
                          
                          setSharedClips(prev => [
                            {
                              ...clipToRate,
                              username: 'You',
                              rating: clipRating,
                              comment: comment
                            },
                            ...prev
                          ]);
                          
                          setIsChatOpen(true);
                          setShowRatingModal(false);
                          setClipRating(0);
                          
                          toast({
                            title: "Clip Shared",
                            description: "Your clip has been shared in the chat"
                          });
                        }}
                      >
                        <FontAwesomeIcon icon={faComment} className="mr-2" />
                        Share in Chat
                      </button>
                      
                      <button 
                        className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-500 flex items-center"
                        onClick={() => {
                          setShowRatingModal(false);
                          setClipRating(0);
                          
                          toast({
                            title: "Clip Saved",
                            description: "Your clip has been saved and submitted for ranking"
                          });
                        }}
                      >
                        <FontAwesomeIcon icon={faScissors} className="mr-2" />
                        Save & Rank
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </AnimatePresence>
        
        {/* Top corner buttons for search and streaming */}
        <div style={{
          position: 'absolute',
          top: '15px',
          right: '15px',
          display: 'flex',
          gap: '10px',
          zIndex: 10
        }}>
          {/* Search Button */}
          <button 
            className="nav-button search-button" 
            onClick={() => navigate('/search')}
            style={{ 
              backgroundColor: 'rgba(255, 140, 0, 0.15)', 
              border: 'none',
              boxShadow: '0 0 8px rgba(255, 140, 0, 0.2)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Search games and streamers"
          >
            <FontAwesomeIcon 
              icon={faSearch} 
              style={{ color: '#FF8C00', filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))' }}
              size="lg"
            />
          </button>
          
          {/* Stream Hub Button */}
          <button 
            className="nav-button stream-button" 
            onClick={() => {
              console.log('Navigating to all streamers hub page');
              navigate('/all-streamers');
            }}
            style={{ 
              backgroundColor: 'rgba(255, 85, 0, 0.3)', 
              border: '2px solid rgba(255, 85, 0, 0.4)',
              boxShadow: '0 0 12px rgba(255, 85, 0, 0.4)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Go to Stream Hub"
          >
            <FontAwesomeIcon 
              icon={faVideo} 
              style={{ color: '#FF5500', filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.9))' }}
              size="lg"
            />
          </button>
        </div>
        
        {/* Bottom Fixed Navigation Bar */}
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          justifyContent: 'center',
          gap: '15px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: '10px 20px',
          borderRadius: '30px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
          zIndex: 100
        }}>
          {/* Follow Button - Icon Only */}
          <button
            className="nav-button follow-button"
            onClick={() => {
              setIsFollowing(!isFollowing);
              toast({
                title: isFollowing ? "Unfollowed" : "Followed",
                description: isFollowing 
                  ? `You have unfollowed streamer` 
                  : `You are now following streamer`,
              });
            }}
            style={{ 
              backgroundColor: 'rgba(255, 85, 0, 0.3)',
              border: '1px solid rgba(255, 85, 0, 0.4)',
              borderRadius: '50%',
              width: '45px',
              height: '45px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF5500',
              transition: 'transform 0.2s, background-color 0.2s'
            }}
            title={isFollowing ? "Unfollow this streamer" : "Follow this streamer"}
          >
            <FontAwesomeIcon 
              icon={faHeart} 
              style={{ 
                color: '#FF5500',
                filter: 'drop-shadow(0 0 3px rgba(255, 85, 0, 0.8))'
              }}
              size="lg"
            />
          </button>

          {/* Chat Button - Icon Only */}
          <button
            className="nav-button chat-button"
            onClick={() => {
              setIsChatOpen(true);
              if (currentStreamer) {
                // Load chat messages for current streamer if needed
                console.log(`Opening chat for ${currentStreamer.username}`);
                // You could also fetch recent messages here
              }
            }}
            style={{ 
              backgroundColor: 'rgba(255, 85, 0, 0.3)',
              border: '1px solid rgba(255, 85, 0, 0.4)',
              borderRadius: '50%',
              width: '45px',
              height: '45px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF5500',
              transition: 'transform 0.2s, background-color 0.2s'
            }}
            title="Open chat"
          >
            <FontAwesomeIcon 
              icon={faComment} 
              style={{ 
                color: '#FF5500',
                filter: 'drop-shadow(0 0 3px rgba(255, 85, 0, 0.8))'
              }}
              size="lg"
            />
          </button>
          
          {/* Dollar Sign Button - Icon Only */}
          <button
            className="nav-button donate-button"
            onClick={() => setIsDonationModalOpen(true)}
            style={{ 
              backgroundColor: 'rgba(255, 85, 0, 0.3)',
              border: '1px solid rgba(255, 85, 0, 0.4)',
              borderRadius: '50%',
              width: '45px',
              height: '45px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF5500',
              transition: 'transform 0.2s, background-color 0.2s'
            }}
            title="Donate to streamer"
          >
            <FontAwesomeIcon 
              icon={faDollarSign} 
              style={{ 
                color: '#FF5500',
                filter: 'drop-shadow(0 0 3px rgba(255, 85, 0, 0.8))'
              }}
              size="lg"
            />
          </button>
          
          {/* Clipt Button - Icon Only - Record Last 1 Minute */}
          <button
            className="nav-button clip-button"
            onClick={() => {
              if (currentStreamer && streamers.length > 0) {
                setIsClippingModalOpen(true);
                // Show a notification that we're recording the LAST minute
                toast({
                  title: "Recording Last Minute",
                  description: `Capturing the last minute of ${currentStreamer.username}'s stream`,
                });
                
                // Set timeout to simulate the recording of the last minute
                setTimeout(() => {
                  // Close clipping modal
                  setIsClippingModalOpen(false);
                  
                  // Show rating modal
                  setClipToRate({
                    id: Date.now(),
                    streamer: currentStreamer.username,
                    duration: 60,
                    timestamp: new Date().toISOString()
                  });
                  setShowRatingModal(true);
                }, 1500);
              } else {
                toast({
                  title: "No Stream Selected",
                  description: "Please select a stream to clip",
                  variant: "destructive"
                });
              }
            }}
            style={{ 
              backgroundColor: 'rgba(255, 85, 0, 0.3)',
              border: '1px solid rgba(255, 85, 0, 0.4)',
              borderRadius: '50%',
              width: '45px',
              height: '45px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF5500',
              transition: 'transform 0.2s, background-color 0.2s'
            }}
            title="Record last 1 minute"
          >
            <div className="relative">
              <FontAwesomeIcon 
                icon={faScissors} 
                style={{ 
                  color: '#FF5500',
                  filter: 'drop-shadow(0 0 3px rgba(255, 85, 0, 0.8))'
                }}
                size="lg"
              />
              <FontAwesomeIcon 
                icon={faClock} 
                style={{ 
                  color: '#ffffff',
                  position: 'absolute',
                  fontSize: '8px',
                  top: '-3px',
                  right: '-3px',
                  filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.8))'
                }}
                size="xs"
              />
            </div>
          </button>
          
          {/* Share Button - Camera Icon */}
          <button
            className="nav-button share-button"
            onClick={() => {
              if (currentStreamer) {
                setIsShareModalOpen(true);
                // Setup share options with additional social media options
                const shareOptions = {
                  title: `Check out ${currentStreamer.username}'s stream on Clipt!`,
                  text: `I'm watching ${currentStreamer.username} on Clipt. Join me!`,
                  url: window.location.href
                };
                
                // Open a custom modal with social media options
                toast({
                  title: "Share to Social Media",
                  description: "Select where you want to share this stream"
                });
                
                // This will be handled by the share modal component
                setIsShareModalOpen(true);
              } else {
                toast({
                  title: "No Stream Selected",
                  description: "Please select a stream to share",
                  variant: "destructive"
                });
              }
            }}
            style={{ 
              backgroundColor: 'rgba(255, 85, 0, 0.3)',
              border: '1px solid rgba(255, 85, 0, 0.4)',
              borderRadius: '50%',
              width: '45px',
              height: '45px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF5500',
              transition: 'transform 0.2s, background-color 0.2s'
            }}
            title="Share this stream to social media or messages"
          >
            <FontAwesomeIcon 
              icon={faCamera} 
              style={{ 
                color: '#FF5500',
                filter: 'drop-shadow(0 0 3px rgba(255, 85, 0, 0.8))'
              }}
              size="lg"
            />
          </button>
        </div>
      
      {/* Hidden buttons that can be toggled with additional UI */}
      <div style={{ display: 'none' }}>
          {/* Scissors/Clip Button */}
          <button 
            className="nav-button clip-button" 
            onClick={() => setIsClippingModalOpen(true)}
            style={{ backgroundColor: 'transparent', border: 'none' }}
            title="Record a 1-minute clip"
          >
            <FontAwesomeIcon 
              icon={faCut} 
              style={{ 
                color: '#FF8C00', 
                filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.7))' 
              }}
              size="2x"
            />
          </button>
          
          {/* Follow Button */}
          <button 
            className={`nav-button follow-button ${isFollowing ? 'active' : ''}`}
            onClick={() => {
              if (currentStreamer) {
                setIsFollowing(!isFollowing);
                toast({
                  title: isFollowing ? "Unfollowed" : "Followed",
                  description: isFollowing 
                    ? `You have unfollowed ${currentStreamer.username}` 
                    : `You are now following ${currentStreamer.username}`,
                  duration: 2000,
                });
              }
            }}
            style={{ 
              backgroundColor: 'transparent', 
              border: 'none',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px'
            }}
            title={isFollowing ? "Unfollow this streamer" : "Follow this streamer"}
          >
            <FontAwesomeIcon 
              icon={isFollowing ? faUserCheck : faUserPlus} 
              style={{ 
                color: isFollowing ? '#FF4500' : '#FF8C00', 
                filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.7))',
                animation: isFollowing ? 'pulse 1.5s ease-in-out infinite' : 'none'
              }}
              size="2x"
            />
            <span className="follow-text" style={{
              fontSize: '10px',
              color: '#FF8C00',
              fontWeight: 'bold',
              textShadow: '0 0 3px rgba(0, 0, 0, 0.7)',
              whiteSpace: 'nowrap',
              opacity: isFollowing ? 1 : 0.7
            }}>
              {isFollowing ? "Following" : "Follow"}
            </span>
          </button>
      </div>
      </div>
    </div>
  );
};

export default DiscoveryNew;
