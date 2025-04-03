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
  
  // Enhanced joystick animation states
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const [joystickDirection, setJoystickDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null);
  const [isTouched, setIsTouched] = useState(false);
  const [showSnapIndicator, setShowSnapIndicator] = useState(false);
  const [useMomentum, setUseMomentum] = useState(false);
  
  // Track touch events for swipe detection
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  
  useEffect(() => {
    // Check if we should disable the controls on certain routes
    const disabledRoutes = ['/auth', '/onboarding', '/messages'];
    const shouldDisable = disabledRoutes.some(route => location.pathname.startsWith(route));
    setEnabled(!shouldDisable);
  }, [location]);
  
  // Add touch event listeners for swipe detection
  useEffect(() => {
    const isCliptsPage = ['/clipts', '/squads-clipts'].some(route => location.pathname === route);
    
    if (isCliptsPage) {
      const handleTouchStart = (e: TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
      };
      
      const handleTouchEnd = (e: TouchEvent) => {
        touchEndX.current = e.changedTouches[0].clientX;
        handleSwipe();
      };
      
      document.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [location.pathname]);
  
  // Handle swipe gestures
  const handleSwipe = () => {
    const swipeThreshold = 50; // Minimum distance required for a swipe
    const diffX = touchEndX.current - touchStartX.current;
    
    if (Math.abs(diffX) > swipeThreshold) {
      if (diffX > 0) {
        // Swipe right - previous post
        animateJoystick(-1, 0);
        setTimeout(() => navigatePost('prev'), 300);
      } else {
        // Swipe left - next post
        animateJoystick(1, 0);
        setTimeout(() => navigatePost('next'), 300);
      }
    }
  };
  
  // Enhanced joystick movement animation with realistic physics
  const animateJoystick = (dx: number, dy: number) => {
    // Determine which direction has the strongest movement
    let direction: 'up' | 'down' | 'left' | 'right' | null = null;
    
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    
    if (absDx > absDy) {
      direction = dx > 0 ? 'right' : 'left';
    } else if (absDy > absDx) {
      direction = dy > 0 ? 'down' : 'up';
    }
    
    // Set joystick to active state
    setIsJoystickActive(true);
    setJoystickDirection(direction);
    
    // Calculate magnitude (for intensity of movement)
    const magnitude = Math.min(Math.sqrt(dx * dx + dy * dy), 1);
    const scaleFactor = 15; // Max pixels to move
    
    // Apply the movement with realistic constraints
    setJoystickPosition({ 
      x: dx * scaleFactor * magnitude, 
      y: dy * scaleFactor * magnitude 
    });
    
    // Show snap indicator when changing direction
    if (direction) {
      setShowSnapIndicator(true);
      setTimeout(() => setShowSnapIndicator(false), 500);
    }
    
    // Use physics-based momentum for return to center
    setUseMomentum(true);
    
    // Reset joystick with a natural return to center
    const returnDelay = 350; // Longer delay for more realistic movement
    setTimeout(() => {
      setUseMomentum(true);
      setJoystickPosition({ x: 0, y: 0 });
      
      setTimeout(() => {
        setJoystickDirection(null);
        setIsJoystickActive(false);
        setUseMomentum(false);
      }, 150);
    }, returnDelay);
  };
  
  // Navigate between posts in clipts pages
  const navigatePost = (direction: 'prev' | 'next') => {
    // Check if we're on a clipts page
    const isCliptsPage = ['/clipts', '/squads-clipts'].some(route => location.pathname === route);
    
    if (isCliptsPage) {
      // Create and dispatch custom event for post navigation
      const navigateEvent = new CustomEvent('navigatePost', {
        detail: { direction }
      });
      document.dispatchEvent(navigateEvent);
    }
  };
  
  // Determine if we should show background based on current route
  const isCliptsPage = [
    '/clipts',
    '/squads-clipts'
  ].some(route => location.pathname === route);
  
  const shouldHideBackground = isCliptsPage;
  
  // Handle navigation using D-pad
  const handleDPadPress = (dx: number, dy: number) => {
    if (!enabled) return;
    
    animateJoystick(dx, dy);
    
    // Check if we're on a clipts page
    const isCliptsPage = ['/clipts', '/squads-clipts'].some(route => location.pathname === route);
    
    if (isCliptsPage) {
      if (dx === 1) navigatePost('next');
      else if (dx === -1) navigatePost('prev');
      return;
    }
    
    // Video control on posts
    if (activePost && dx === 0 && dy === 0) {
      // Center button press on a post with video - toggle between play/pause
      dispatchVideoControl('play'); // This will toggle properly based on current state
      return;
    }
    
    // Navigation based on D-pad direction
    switch(true) {
      case dx === 1: // Right - Main discovery page
        navigate('/discover');
        break;
      case dx === -1: // Left - Profile
        navigate('/profile');
        break;
      case dy === -1: // Up - Settings
        navigate('/settings');
        break;
      case dy === 1: // Down - Top games
        navigate('/games');
        break;
      default:
        // Center press - default menu
        navigate('/menu');
    }
  };
  
  // Toggle CLIPT button state and navigate to post creation
  const handleCliptPress = () => {
    setIsCliptActive(true);
    
    // Navigate to post creation
    navigate('/create');
    
    // Reset button state after animation
    setTimeout(() => {
      setIsCliptActive(false);
    }, 300);
  };
  
  // Handle action button press
  const handleActionPress = (action: 'like' | 'comment' | 'trophy' | 'save') => {
    if (activePost?.id) {
      triggerPostInteraction(action, activePost.id);
    }
  };
  
  // Only render if enabled
  if (!enabled) return null;
  
  return (
    <div className="gameboy-controls-wrapper">
      <div className={`gameboy-controls-container ${!shouldHideBackground ? 'with-background' : ''} ${isCliptsPage ? 'clipts-controller' : ''}`}>
        <div className="gameboy-controls">
          {/* Enhanced Joystick - Left edge */}
          <div className="left-control-area">
            <div className="d-pad-container">
              <div 
                className={`joystick ${isJoystickActive ? 'active' : ''} 
                          ${joystickDirection ? `active-${joystickDirection}` : ''}
                          ${isTouched ? 'touched' : ''}`}
                ref={joystickRef}
                onTouchStart={() => setIsTouched(true)}
                onTouchEnd={() => {
                  setIsTouched(false);
                  setJoystickPosition({ x: 0, y: 0 });
                  setJoystickDirection(null);
                  setIsJoystickActive(false);
                }}
                onTouchMove={(e) => {
                  if (!joystickRef.current) return;
                  
                  const rect = joystickRef.current.getBoundingClientRect();
                  const centerX = rect.left + rect.width / 2;
                  const centerY = rect.top + rect.height / 2;
                  
                  const touch = e.touches[0];
                  const deltaX = (touch.clientX - centerX) / (rect.width / 2);
                  const deltaY = (touch.clientY - centerY) / (rect.height / 2);
                  
                  // Normalize to stay within a circular boundary
                  const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                  const normalizedDeltaX = length > 1 ? deltaX / length : deltaX;
                  const normalizedDeltaY = length > 1 ? deltaY / length : deltaY;
                  
                  // Determine direction for visual feedback
                  let direction: 'up' | 'down' | 'left' | 'right' | null = null;
                  const absDx = Math.abs(normalizedDeltaX);
                  const absDy = Math.abs(normalizedDeltaY);
                  
                  if (absDx > 0.5 || absDy > 0.5) {
                    if (absDx > absDy) {
                      direction = normalizedDeltaX > 0 ? 'right' : 'left';
                    } else {
                      direction = normalizedDeltaY > 0 ? 'down' : 'up';
                    }
                    
                    // Actually perform the navigation if movement is significant
                    if (length > 0.7) {
                      if (direction === 'left') handleDPadPress(-1, 0);
                      else if (direction === 'right') handleDPadPress(1, 0);
                      else if (direction === 'up') handleDPadPress(0, -1);
                      else if (direction === 'down') handleDPadPress(0, 1);
                    }
                  }
                  
                  setJoystickDirection(direction);
                  setIsJoystickActive(length > 0.2);
                  setJoystickPosition({ 
                    x: normalizedDeltaX * 15, 
                    y: normalizedDeltaY * 15 
                  });
                }}
              >
                <div className="joystick-ripple"></div>
                <div className={`post-snap-indicator ${showSnapIndicator ? 'active' : ''}`}></div>
                <div 
                  className={`joystick-inner ${joystickDirection ? `direction-${joystickDirection}` : ''} ${useMomentum ? 'momentum' : ''}`}
                  style={{
                    transform: `translate(calc(-50% + ${joystickPosition.x}px), calc(-50% + ${joystickPosition.y}px))`
                  }}
                ></div>
                <div className="joystick-direction joystick-direction-up"></div>
                <div className="joystick-direction joystick-direction-right"></div>
                <div className="joystick-direction joystick-direction-down"></div>
                <div className="joystick-direction joystick-direction-left"></div>
              </div>
              
              {/* Keep the invisible D-pad buttons for keyboard and click support */}
              <div className="d-pad" style={{ opacity: 0, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
                <button 
                  className="d-pad-button up"
                  onClick={() => handleDPadPress(0, -1)}
                  aria-label="D-pad up"
                ></button>
                <button 
                  className="d-pad-button right" 
                  onClick={() => handleDPadPress(1, 0)}
                  aria-label="D-pad right"
                ></button>
                <button 
                  className="d-pad-button down"
                  onClick={() => handleDPadPress(0, 1)}
                  aria-label="D-pad down"
                ></button>
                <button 
                  className="d-pad-button left"
                  onClick={() => handleDPadPress(-1, 0)}
                  aria-label="D-pad left"
                ></button>
                <button 
                  className="d-pad-button center"
                  onClick={() => handleDPadPress(0, 0)}
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
    </div>
  );
};

export default GameBoyControls;
