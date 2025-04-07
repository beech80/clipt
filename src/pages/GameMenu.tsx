import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../components/enhanced-joystick.css';

const GameMenu: React.FC = () => {
  const navigate = useNavigate();

  const handleMenuItemClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="game-menu-page">
      <div className="game-menu-content">
        <h2>GAME MENU</h2>
        <div className="menu-grid">

          {/* Settings */}
          <div className="menu-item" onClick={() => handleMenuItemClick('/settings')}>
            <div className="menu-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </div>
            <div className="menu-text">
              <h3>Settings</h3>
              <p>Configure your game</p>
            </div>
            <div className="menu-arrow">▶</div>
          </div>

          {/* Streaming */}
          <div className="menu-item" onClick={() => handleMenuItemClick('/streaming')}>
            <div className="menu-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
                <polyline points="17 2 12 7 7 2"></polyline>
              </svg>
            </div>
            <div className="menu-text">
              <h3>Streaming</h3>
              <p>Live gameplay</p>
            </div>
            <div className="menu-arrow">▶</div>
          </div>

          {/* Profile */}
          <div className="menu-item" onClick={() => handleMenuItemClick('/profile')}>
            <div className="menu-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="menu-text">
              <h3>Profile</h3>
              <p>Your player stats</p>
            </div>
            <div className="menu-arrow">▶</div>
          </div>

          {/* Messages */}
          <div className="menu-item" onClick={() => handleMenuItemClick('/messages')}>
            <div className="menu-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div className="menu-text">
              <h3>Messages</h3>
              <p>Chat with players</p>
            </div>
            <div className="menu-arrow">▶</div>
          </div>

          {/* Notifications */}
          <div className="menu-item" onClick={() => handleMenuItemClick('/notifications')}>
            <div className="menu-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
            <div className="menu-text">
              <h3>Notifications</h3>
              <p>Your notifications</p>
            </div>
            <div className="menu-arrow">▶</div>
          </div>

          {/* Discovery */}
          <div className="menu-item" onClick={() => handleMenuItemClick('/discovery')}>
            <div className="menu-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <div className="menu-text">
              <h3>Discovery</h3>
              <p>Find new games</p>
            </div>
            <div className="menu-arrow">▶</div>
          </div>

          {/* Top Clipts */}
          <div className="menu-item" onClick={() => handleMenuItemClick('/top-clipts')}>
            <div className="menu-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <div className="menu-text">
              <h3>Top Clipts</h3>
              <p>Hall of fame</p>
            </div>
            <div className="menu-arrow">▶</div>
          </div>

          {/* Squads Clipts */}
          <div className="menu-item" onClick={() => handleMenuItemClick('/squads-clipts')}>
            <div className="menu-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div className="menu-text">
              <h3>Squads Clipts</h3>
              <p>Your squads clipts</p>
            </div>
            <div className="menu-arrow">▶</div>
          </div>

          {/* Clipts */}
          <div className="menu-item" onClick={() => handleMenuItemClick('/clipts')}>
            <div className="menu-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                <line x1="7" y1="2" x2="7" y2="22"></line>
                <line x1="17" y1="2" x2="17" y2="22"></line>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <line x1="2" y1="7" x2="7" y2="7"></line>
                <line x1="2" y1="17" x2="7" y2="17"></line>
                <line x1="17" y1="17" x2="22" y2="17"></line>
                <line x1="17" y1="7" x2="22" y2="7"></line>
              </svg>
            </div>
            <div className="menu-text">
              <h3>Clipts</h3>
              <p>View all clipts</p>
            </div>
            <div className="menu-arrow">▶</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameMenu;
