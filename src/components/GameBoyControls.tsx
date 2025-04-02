import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import usePostDetector from './gameboy/PostDetector';
import { triggerPostInteraction } from './gameboy/PostInteractions';
import { dispatchVideoControl } from './gameboy/VideoControls';

const GameBoyControls: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(true);
  const activePost = usePostDetector(enabled);
  
  // Toggle the active state of the CLIPT button
  const [isCliptActive, setIsCliptActive] = useState(false);
  
  useEffect(() => {
    // Check if we should disable the controls on certain routes
    const disabledRoutes = ['/auth', '/onboarding', '/messages'];
    const shouldDisable = disabledRoutes.some(route => location.pathname.startsWith(route));
    setEnabled(!shouldDisable);
  }, [location]);
  
  // Handle navigation using D-pad
  const handleDPadPress = (dx: number, dy: number) => {
    if (!enabled) return;
    
    if (dy < 0) {
      // Up: Scroll up
      window.scrollBy({ top: -200, behavior: 'smooth' });
    } else if (dy > 0) {
      // Down: Scroll down
      window.scrollBy({ top: 200, behavior: 'smooth' });
    } else if (dx < 0) {
      // Left: Previous page or handle video scrubbing
      const activeVideo = document.querySelector('video:focus') as HTMLVideoElement;
      if (activeVideo) {
        dispatchVideoControl('backward');
      } else {
        navigate(-1);
      }
    } else if (dx > 0) {
      // Right: Next page or handle video scrubbing
      const activeVideo = document.querySelector('video:focus') as HTMLVideoElement;
      if (activeVideo) {
        dispatchVideoControl('forward');
      } else if (location.pathname === '/') {
        navigate('/explore');
      }
    }
  };
  
  // Toggle CLIPT button state and navigate to post creation
  const handleCliptPress = () => {
    setIsCliptActive(true);
    
    // Navigate to create post page
    navigate('/create');
    
    // Reset button state after a delay
    setTimeout(() => {
      setIsCliptActive(false);
    }, 300);
  };

  // Handle action button press
  const handleActionPress = (action: 'like' | 'comment' | 'trophy' | 'save') => {
    if (!activePost?.id) return;
    triggerPostInteraction(action, activePost.id);
  };
  
  // Only render if enabled
  if (!enabled) return null;
  
  return (
    <div className="gameboy-controls-container">
      <div className="gameboy-controls">
        {/* D-Pad / Joystick for navigation */}
        <div className="d-pad">
          <div className="d-pad-button up" onClick={(e) => {e.stopPropagation(); handleDPadPress(0, -1);}}>
            <span>↑</span>
          </div>
          <div className="d-pad-button right" onClick={(e) => {e.stopPropagation(); handleDPadPress(1, 0);}}>
            <span>→</span>
          </div>
          <div className="d-pad-button down" onClick={(e) => {e.stopPropagation(); handleDPadPress(0, 1);}}>
            <span>↓</span>
          </div>
          <div className="d-pad-button left" onClick={(e) => {e.stopPropagation(); handleDPadPress(-1, 0);}}>
            <span>←</span>
          </div>
        </div>
        
        {/* Center Section */}
        <div className="center-section">
          {/* CLIPT Button */}
          <button 
            className={`clipt-button ${isCliptActive ? 'active' : ''}`} 
            onClick={handleCliptPress}
            aria-label="Create new post"
          >
            CLIPT
          </button>
          
          {/* Menu Buttons */}
          <div className="menu-buttons">
            <button className="menu-button" onClick={() => navigate('/menu')} aria-label="Menu">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <button className="menu-button" onClick={() => navigate('/camera')} aria-label="Camera">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="action-button like" onClick={() => handleActionPress('like')} aria-label="Like post">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <button className="action-button comment" onClick={() => handleActionPress('comment')} aria-label="Comment on post">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          </button>
          <button className="action-button trophy" onClick={() => handleActionPress('trophy')} aria-label="Rank post">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
              <path d="M4 22h16"></path>
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
            </svg>
          </button>
          <button className="action-button save" onClick={() => handleActionPress('save')} aria-label="Save post">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameBoyControls;
