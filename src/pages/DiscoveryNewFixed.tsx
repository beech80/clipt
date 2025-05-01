import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faGamepad, faVideo } from '@fortawesome/free-solid-svg-icons';
import '../styles/discovery-retro.css';
import '../styles/discovery-updates.css';

// Simplified Discovery component that works with React's lazy loading
function DiscoveryNewFixed() {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = React.useState(false);

  return (
    <div className="discovery-page">
      <div className="discovery-container">
        <div className="stream-display-container">
          <div className="header">
            <div className="header-right">
              <div className="header-circular-buttons">
                <button 
                  className="circular-button camera-button"
                  onClick={() => navigate('/streaming')}
                  aria-label="Go to livestreams"
                  style={{
                    background: 'linear-gradient(135deg, #FF8C00, #FF4500)',
                    boxShadow: '0 0 15px rgba(255, 140, 0, 0.6)',
                    border: '2px solid #FF8C00'
                  }}
                >
                  <FontAwesomeIcon icon={faVideo} size="lg" />
                </button>
                <button 
                  className="circular-button search-button"
                  onClick={() => setSearchOpen(true)}
                >
                  <FontAwesomeIcon icon={faSearch} size="lg" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="content-area">
            <div className="discovery-placeholder">
              <FontAwesomeIcon icon={faGamepad} size="3x" className="mb-4 text-purple-500" />
              <h2 className="text-xl font-bold mb-2">Welcome to Discovery</h2>
              <p className="text-center mb-6">Find your favorite games and streamers</p>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="discovery-card" onClick={() => navigate('/games')}>
                  <h3>Top Games</h3>
                </div>
                <div className="discovery-card" onClick={() => navigate('/streamers')}>
                  <h3>Streamers</h3>
                </div>
                <div className="discovery-card" onClick={() => navigate('/clips')}>
                  <h3>Popular Clips</h3>
                </div>
                <div className="discovery-card" onClick={() => navigate('/trending')}>
                  <h3>Trending</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {searchOpen && (
          <div className="search-panel">
            <div className="search-container">
              <div className="search-header">
                <h2>Search</h2>
                <button onClick={() => setSearchOpen(false)}>Close</button>
              </div>
              <div className="search-input-container">
                <input
                  type="text"
                  placeholder="Search games, streamers or clips..."
                  className="search-input"
                />
              </div>
              <div className="search-results-placeholder">
                <p>Type to search</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiscoveryNewFixed;