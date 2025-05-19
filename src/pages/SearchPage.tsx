import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faGamepad, faUser, faVideo } from '@fortawesome/free-solid-svg-icons';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { createGlobalStyle, keyframes } from 'styled-components';
import '../styles/search-page.css';

// Animation keyframes
const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const GlobalStyle = createGlobalStyle`
  .result-card {
    animation: ${fadeIn} 0.3s ease-out;
  }
  
  .highlight {
    animation: ${pulse} 2s infinite;
  }
`;

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  // Removed tab state as tabs have been removed
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock data (would be replaced with real API calls)
  const gameResults = [
    { id: 'game1', name: 'Fortnite', imageUrl: 'https://picsum.photos/200/300?random=1', viewers: 120000, tags: ['Battle Royale', 'Action'] },
    { id: 'game2', name: 'Minecraft', imageUrl: 'https://picsum.photos/200/300?random=2', viewers: 85000, tags: ['Survival', 'Building'] },
    { id: 'game3', name: 'League of Legends', imageUrl: 'https://picsum.photos/200/300?random=3', viewers: 175000, tags: ['MOBA', 'Strategy'] },
    { id: 'game4', name: 'Call of Duty', imageUrl: 'https://picsum.photos/200/300?random=4', viewers: 95000, tags: ['FPS', 'Action'] },
    { id: 'game5', name: 'Apex Legends', imageUrl: 'https://picsum.photos/200/300?random=5', viewers: 110000, tags: ['Battle Royale', 'FPS'] },
    { id: 'game6', name: 'Valorant', imageUrl: 'https://picsum.photos/200/300?random=6', viewers: 88000, tags: ['FPS', 'Tactical'] },
  ];
  
  const streamerResults = [
    { id: 'streamer1', name: 'ProGamer123', imageUrl: 'https://picsum.photos/200/300?random=7', game: 'Fortnite', viewers: 12500, isLive: true },
    { id: 'streamer2', name: 'GamingQueen', imageUrl: 'https://picsum.photos/200/300?random=8', game: 'Minecraft', viewers: 8700, isLive: true },
    { id: 'streamer3', name: 'EpicPlayer', imageUrl: 'https://picsum.photos/200/300?random=9', game: 'League of Legends', viewers: 15200, isLive: true },
    { id: 'streamer4', name: 'StreamMaster', imageUrl: 'https://picsum.photos/200/300?random=10', game: 'Call of Duty', viewers: 5400, isLive: false },
    { id: 'streamer5', name: 'ProSniper', imageUrl: 'https://picsum.photos/200/300?random=11', game: 'Valorant', viewers: 9800, isLive: true },
    { id: 'streamer6', name: 'GameWhiz', imageUrl: 'https://picsum.photos/200/300?random=12', game: 'Apex Legends', viewers: 7600, isLive: false },
  ];
  
  // Filter results based on search term
  const filteredGames = gameResults.filter(game => 
    game.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredStreamers = streamerResults.filter(streamer => 
    streamer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    streamer.game.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Simulate search loading
  useEffect(() => {
    if (searchTerm) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);
  
  // Go back to previous page
  const goBack = () => {
    navigate(-1);
  };
  
  // View game or streamer details
  const viewGameDetails = (gameId: string) => {
    navigate(`/game/${gameId}`);
  };
  
  const viewStreamerDetails = (streamerId: string) => {
    navigate(`/profile/${streamerId}`);
  };
  
  return (
    <>
      <GlobalStyle />
      <div className="search-page">
        {/* Header */}
        <div className="search-header">
          <button 
            className="back-button"
            onClick={goBack}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
          
          <div className="search-input-container">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search games, streamers, or clips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {searchTerm && (
              <button 
                className="clear-button"
                onClick={() => setSearchTerm('')}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
          </div>
        </div>
        
        {/* Search tabs have been removed */}
        
        {/* Search Results */}
        <div className="search-results">
          <AnimatePresence>
            {isLoading ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="loading-container"
              >
                <div className="loading-spinner"></div>
                <p>Searching...</p>
              </motion.div>
            ) : searchTerm ? (
              <>
                {filteredGames.length > 0 && (
                  <div className="result-section">
                    <h2 className="section-title">Games</h2>
                    <div className="result-grid">
                      {filteredGames.map(game => (
                        <motion.div 
                          key={game.id}
                          className="result-card game-card"
                          whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
                          onClick={() => viewGameDetails(game.id)}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="card-image" style={{ backgroundImage: `url(${game.imageUrl})` }}>
                            <div className="card-viewers">
                              <FontAwesomeIcon icon={faVideo} className="viewers-icon" />
                              {game.viewers.toLocaleString()} viewers
                            </div>
                          </div>
                          <div className="card-content">
                            <h3 className="card-title">{game.name}</h3>
                            <div className="card-tags">
                              {game.tags.map((tag, index) => (
                                <span key={index} className="tag">{tag}</span>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
                
                {filteredStreamers.length > 0 && (
                  <div className="result-section">
                    <h2 className="section-title">Streamers</h2>
                    <div className="result-grid">
                      {filteredStreamers.map(streamer => (
                        <motion.div 
                          key={streamer.id}
                          className="result-card streamer-card"
                          whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
                          onClick={() => viewStreamerDetails(streamer.id)}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="card-image" style={{ backgroundImage: `url(${streamer.imageUrl})` }}>
                            {streamer.isLive && (
                              <div className="live-badge">LIVE</div>
                            )}
                          </div>
                          <div className="card-content">
                            <h3 className="card-title">{streamer.name}</h3>
                            <p className="card-game">{streamer.game}</p>
                            {streamer.isLive && (
                              <p className="card-viewers">
                                <span className="live-dot"></span>
                                {streamer.viewers.toLocaleString()} viewers
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
                
                {(filteredGames.length === 0 && filteredStreamers.length === 0) && (
                  <div className="no-results">
                    <FontAwesomeIcon icon={faSearch} className="no-results-icon" />
                    <p>No results found for "{searchTerm}"</p>
                    <p className="no-results-suggestion">Try a different search term</p>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-search">
                <FontAwesomeIcon icon={faSearch} className="empty-search-icon" />
                <p>Search for games, streamers, or clips</p>
                <p className="empty-search-suggestion">Try searching for your favorite game or streamer</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default SearchPage;
