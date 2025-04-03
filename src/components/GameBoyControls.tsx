import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import usePostDetector from './gameboy/PostDetector';
import { triggerPostInteraction } from './gameboy/PostInteractions';
import { dispatchVideoControl } from './gameboy/VideoControls';
// No external icon dependencies - using inline SVGs
import './enhanced-joystick.css';

const GameBoyControls: React.FC = () => {
  // Create refs for joystick elements
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickInnerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(true);
  const activePost = usePostDetector(enabled);
  
  // Toggle the active state of the CLIPT button
  const [isCliptActive, setIsCliptActive] = useState(false);
  
  // Action button states for Xbox-style controls
  const [isLiked, setIsLiked] = useState(false);
  const [isRanked, setIsRanked] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Enhanced joystick animation states
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const [joystickDirection, setJoystickDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null);
  const [isTouched, setIsTouched] = useState(false);
  const [showSnapIndicator, setShowSnapIndicator] = useState(false);
  const [useMomentum, setUseMomentum] = useState(false);
  
  // Touch handling refs
  const isDragging = useRef(false);
  const startPosition = useRef({ x: 0, y: 0 });
  const lastDirection = useRef<'up' | 'down' | 'left' | 'right' | null>(null);
  const touchStartTime = useRef(0);
  const lastMoveTime = useRef(0);
  
  // Debug and position tracking
  const touchStartCoords = useRef({ x: 0, y: 0 });
  const touchMoveCoords = useRef({ x: 0, y: 0 });
  useEffect(() => {
    // Check if we should disable the controls on certain routes
    const disabledRoutes = ['/auth', '/onboarding', '/messages'];
    const shouldDisable = disabledRoutes.some(route => location.pathname.startsWith(route));
    setEnabled(!shouldDisable);
  }, [location]);
  
  // Setup joystick interaction with touch/mouse events
  useEffect(() => {
    const joystick = joystickRef.current;
    const joystickInner = joystickInnerRef.current;
    
    if (!joystick || !joystickInner) return;
    
    // Mouse event handlers for desktop
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      startPosition.current = { x: e.clientX, y: e.clientY };
      touchStartCoords.current = { x: e.clientX, y: e.clientY };
      touchStartTime.current = Date.now();
      setIsTouched(true);
      setIsJoystickActive(true);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      touchMoveCoords.current = { x: e.clientX, y: e.clientY };
      lastMoveTime.current = Date.now();
      handleJoystickMovement(e.clientX, e.clientY);
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      releaseJoystick();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    // Touch events for mobile
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      isDragging.current = true;
      const touch = e.touches[0];
      startPosition.current = { x: touch.clientX, y: touch.clientY };
      touchStartCoords.current = { x: touch.clientX, y: touch.clientY };
      touchStartTime.current = Date.now();
      setIsTouched(true);
      setIsJoystickActive(true);
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      touchMoveCoords.current = { x: touch.clientX, y: touch.clientY };
      lastMoveTime.current = Date.now();
      handleJoystickMovement(touch.clientX, touch.clientY);
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (isDragging.current) {
        const touchDuration = Date.now() - touchStartTime.current;
        const touch = e.changedTouches[0];
        const diffX = touch.clientX - touchStartCoords.current.x;
        const diffY = touch.clientY - touchStartCoords.current.y;
        const distance = Math.sqrt(diffX * diffX + diffY * diffY);
        
        // If it was a quick tap without much movement, treat as a center button press
        if (touchDuration < 200 && distance < 20) {
          handleDPadPress(0, 0); // Center press
        }
      }
      
      releaseJoystick();
    };
    
    // Add event listeners
    joystickInner.addEventListener('mousedown', handleMouseDown);
    joystick.addEventListener('mousedown', handleMouseDown);
    joystickInner.addEventListener('touchstart', handleTouchStart, { passive: false });
    joystick.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      joystickInner.removeEventListener('mousedown', handleMouseDown);
      joystick.removeEventListener('mousedown', handleMouseDown);
      joystickInner.removeEventListener('touchstart', handleTouchStart);
      joystick.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [joystickRef.current, joystickInnerRef.current]);
  
  // Enhanced joystick movement with realistic Xbox controller physics
  const handleJoystickMovement = (clientX: number, clientY: number) => {
    const joystick = joystickRef.current;
    if (!joystick || !isDragging.current) return;
    
    // Get joystick dimensions and position
    const rect = joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate distance from center
    let dx = (clientX - centerX) / (rect.width / 2);
    let dy = (clientY - centerY) / (rect.height / 2);
    
    // Add slight deadzone in center (Xbox controllers have this)
    const deadzone = 0.1;
    if (Math.abs(dx) < deadzone) dx = 0;
    if (Math.abs(dy) < deadzone) dy = 0;
    
    // Constrain to a circle with radius 1 (Xbox thumbstick range)
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 1) {
      dx = dx / distance;
      dy = dy / distance;
    }
    
    // Animate joystick with Xbox-like movement
    animateJoystick(dx, dy);
    
    // Handle navigation with responsive thresholds
    const directionThreshold = 0.5;
    if (Math.abs(dx) > directionThreshold && Math.abs(dx) > Math.abs(dy)) {
      const newDirection = dx > 0 ? 'right' : 'left';
      if (newDirection !== lastDirection.current) {
        lastDirection.current = newDirection;
        // Navigate to next/prev post with Xbox-like tactile feel
        if (newDirection === 'right') {
          navigatePost('next');
          // Add haptic-like visual feedback
          setShowSnapIndicator(true);
          setTimeout(() => setShowSnapIndicator(false), 300);
        } else {
          navigatePost('prev');
          setShowSnapIndicator(true);
          setTimeout(() => setShowSnapIndicator(false), 300);
        }
      }
    } else if (Math.abs(dy) > directionThreshold && Math.abs(dy) > Math.abs(dx)) {
      lastDirection.current = dy > 0 ? 'down' : 'up';
      
      // For vertical movements, implement scroll behavior
      // This supports the existing post-snapping behavior from prior implementation
    } else {
      lastDirection.current = null;
    }
  };
  
  // Release joystick and reset position with animation
  const releaseJoystick = () => {
    isDragging.current = false;
    setIsTouched(false);
    setJoystickPosition({ x: 0, y: 0 });
    setJoystickDirection(null);
    setUseMomentum(true);
    lastDirection.current = null;
    
    // Add momentum for smooth return to center
    setTimeout(() => {
      setIsJoystickActive(false);
      setUseMomentum(false);
    }, 300);
  };
  
  // Trigger navigation based on swipe distance and direction
  const handleSwipe = () => {
    if (!touchStartCoords.current || !touchMoveCoords.current) return;
    
    const diffX = touchMoveCoords.current.x - touchStartCoords.current.x;
    const diffY = touchMoveCoords.current.y - touchStartCoords.current.y;
    const distance = Math.sqrt(diffX * diffX + diffY * diffY);
    const swipeThreshold = 50; // Minimum distance for a swipe
    
    if (distance > swipeThreshold) {
      // Determine primary direction of swipe
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (diffX > 0) {
          navigatePost('prev'); // Right swipe - previous post
        } else {
          navigatePost('next'); // Left swipe - next post
        }
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
    const scaleFactor = 20; // Max pixels to move
    
    // Apply the movement with realistic constraints
    setJoystickPosition({ 
      x: dx * scaleFactor * magnitude, 
      y: dy * scaleFactor * magnitude 
    });
    
    // Show snap indicator when changing direction
    if (direction && direction !== joystickDirection) {
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
  
  // Handle action button press with state toggling
  const handleActionButtonClick = (action: 'like' | 'comment' | 'rank' | 'save') => {
    if (activePost?.id) {
      // Toggle the state for visual feedback
      switch(action) {
        case 'like':
          setIsLiked(!isLiked);
          triggerPostInteraction('like', activePost.id);
          break;
        case 'comment':
          setIsCommenting(!isCommenting);
          triggerPostInteraction('comment', activePost.id);
          break;
        case 'rank':
          setIsRanked(!isRanked);
          triggerPostInteraction('trophy', activePost.id);
          break;
        case 'save':
          setIsSaved(!isSaved);
          triggerPostInteraction('save', activePost.id);
          break;
      }
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
                className={`joystick xbox-style ${isJoystickActive ? 'active' : ''} ${isTouched ? 'touched' : ''} ${
                  joystickDirection ? `active-${joystickDirection}` : ''
                }`}
                ref={joystickRef}
              >
                {/* Direction indicators for visual feedback */}
                <div className="joystick-direction joystick-direction-up"></div>
                <div className="joystick-direction joystick-direction-right"></div>
                <div className="joystick-direction joystick-direction-down"></div>
                <div className="joystick-direction joystick-direction-left"></div>
                
                {/* Joystick inner thumbstick with Xbox-style texture */}
                <div 
                  className={`joystick-inner ${useMomentum ? 'momentum' : ''} ${
                    joystickDirection ? `direction-${joystickDirection}` : ''}`}
                  ref={joystickInnerRef}
                  style={{
                    transform: `translate(calc(-50% + ${joystickPosition.x}px), calc(-50% + ${joystickPosition.y}px))`
                  }}
                ></div>
              </div>
              
              {/* Visual feedback for post snapping */}
              <div className={`post-snap-indicator ${showSnapIndicator ? 'active' : ''}`}></div>
              
              {/* Ripple effect on touch */}
              <div className="joystick-ripple"></div>
              
              {/* Center dpad button */}
              <div className="d-pad-overlay">
                <button 
                  className="d-pad-center" 
                  onClick={() => handleDPadPress(0, 0)}
                  aria-label="D-pad center button"
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
            {/* Modern circular buttons */}
            <div className="action-buttons modern-style">
              {/* X Button - Like */}
              <button 
                className="action-button x" 
                onClick={() => handleActionButtonClick('like')} 
                aria-label="Like post (X button)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isLiked ? 'active' : ''} width="20" height="20">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>

              </button>
              
              {/* Y Button - Rank */}
              <button 
                className="action-button y" 
                onClick={() => handleActionButtonClick('rank')} 
                aria-label="Rank post (Y button)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isRanked ? 'active' : ''} width="20" height="20">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                  <path d="M4 22h16"></path>
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                </svg>

              </button>
              
              {/* B Button - Save */}
              <button 
                className="action-button b" 
                onClick={() => handleActionButtonClick('save')} 
                aria-label="Save video (B button)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isSaved ? 'active' : ''} width="20" height="20">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>

              </button>
              
              {/* A Button - Comment */}
              <button 
                className="action-button a" 
                onClick={() => handleActionButtonClick('comment')} 
                aria-label="Comment on post (A button)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isCommenting ? 'active' : ''} width="20" height="20">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>

              </button>
              
              {/* Xbox controller texture overlay */}
              <div className="matte-texture"></div>
            </div>
        </div>
        
        {/* Center Area - Only CLIPT button */}
        <div className="center-control-area">
          <button 
            className="central-button"
            onClick={handleCliptPress}
            aria-label="CLIPT button"
          >
            CLIPT
          </button>
          
          <div className="menu-buttons">
            <button className="menu-button select-button" onClick={() => navigate('/select')} aria-label="Select">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <button className="menu-button post-button" onClick={() => navigate('/create')} aria-label="Post">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
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
