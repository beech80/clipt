import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import usePostDetector from './gameboy/PostDetector';
import { triggerPostInteraction } from './gameboy/PostInteractions';
import { dispatchVideoControl } from './gameboy/VideoControls';

const GameBoyControls: React.FC = () => {
  // Create a ref for the joystick element
  const joystickRef = useRef<HTMLDivElement>(null);
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
  
  // Determine if we should show background based on current route
  const shouldHideBackground = [
    '/clipts',
    '/squads-clipts'
  ].some(route => location.pathname === route);
  
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
    <div className={`gameboy-controls-container ${!shouldHideBackground ? 'with-background' : ''}`}>
      <div className="gameboy-controls">
        {/* D-Pad / Joystick - Left edge */}
        <div className="left-control-area">
          <div className="d-pad">
            <div className="d-pad-center" ref={joystickRef}>
              <button
                className="d-pad-button"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent joystick movement
                  handleDPadPress(0, 0);
                }}
                aria-label="D-pad center button"
              ></button>
            </div>
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
            <button className="menu-button" onClick={() => navigate('/create')} aria-label="Create Post">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </button>
          </div>
        </div>

        {/* Action Buttons - Right edge */}
        <div className="right-control-area">
          <div className="action-buttons">
            <button className="action-button like" onClick={() => handleActionPress('like')} aria-label="Like post">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            <button className="action-button comment" onClick={() => handleActionPress('comment')} aria-label="Comment on post">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
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
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="8" y1="12" x2="16" y2="12"></line>
                <line x1="12" y1="8" x2="12" y2="16"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoyControls;
