import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './enhanced-joystick.css';

const GameBoyControls: React.FC = () => {
  // Create refs for joystick elements
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickInnerRef = useRef<HTMLDivElement>(null);
  
  // Get navigate for routing
  const navigate = useNavigate();
  const location = useLocation();
  
  // Action button states
  const [likeActive, setLikeActive] = useState(false);
  const [commentActive, setCommentActive] = useState(false);
  const [saveActive, setSaveActive] = useState(false);
  const [rankActive, setRankActive] = useState(false);
  
  // Track current post ID if on a post page
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  
  // Enhanced joystick animation states
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const [joystickDirection, setJoystickDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null);
  const [isTouched, setIsTouched] = useState(false);
  const [momentumActive, setMomentumActive] = useState(false);

  // Track scroll position and reference
  const [scrollTarget, setScrollTarget] = useState<Element | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollPositionRef = useRef(0);
  const scrollSpeedRef = useRef(0);
  const scrollDirectionRef = useRef<'up' | 'down' | 'none'>('none');
  const lastScrollTime = useRef(Date.now());
  
  // Extract post ID from URL if on a post page
  useEffect(() => {
    const match = location.pathname.match(/\/post\/([^/?#]+)/);
    
    if (match && match[1]) {
      setCurrentPostId(match[1]);
    } else {
      setCurrentPostId(null);
    }
  }, [location.pathname]);

  // Setup joystick interaction with touch/mouse events
  useEffect(() => {
    const joystick = joystickRef.current;
    const joystickInner = joystickInnerRef.current;
    
    if (!joystick || !joystickInner) return;
    
    let initialX = 0;
    let initialY = 0;
    let isDragging = false;
    let joystickRect: DOMRect;
    
    const handleMouseDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      
      // Get size and position of joystick
      joystickRect = joystick.getBoundingClientRect();
      
      // Set initial position
      if ('touches' in e) {
        initialX = e.touches[0].clientX;
        initialY = e.touches[0].clientY;
      } else {
        initialX = e.clientX;
        initialY = e.clientY;
      }
      
      isDragging = true;
      setIsJoystickActive(true);
      setIsTouched(true);
      
      // Add global event listeners
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchmove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchend', handleMouseUp);
    };
    
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      handleJoystickMovement(clientX, clientY);
      
      // Prevent default to avoid scrolling the page
      if (e.cancelable) e.preventDefault();
    };
    
    const handleMouseUp = () => {
      if (!isDragging) return;
      
      // Reset joystick position with a smooth animation
      joystickInner.style.setProperty('--x', '0px');
      joystickInner.style.setProperty('--y', '0px');
      joystickInner.style.transition = 'transform 0.3s ease-out';
      joystickInner.style.transform = 'translate(0, 0)';
      
      // Add momentum class for smoother reset animation
      joystickInner.classList.add('momentum');
      
      setMomentumActive(true);
      setJoystickPosition({ x: 0, y: 0 });
      setJoystickDirection(null);
      
      // Reset active states
      setIsJoystickActive(false);
      isDragging = false;
      
      // Clean up event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
      
      // Reset touch ripple effect after animation completes
      setTimeout(() => {
        setIsTouched(false);
        setMomentumActive(false);
        joystickInner.classList.remove('momentum');
        joystickInner.style.transition = '';
      }, 300);
    };
    
    joystick.addEventListener('mousedown', handleMouseDown);
    joystick.addEventListener('touchstart', handleMouseDown, { passive: false });
    
    return () => {
      joystick.removeEventListener('mousedown', handleMouseDown);
      joystick.removeEventListener('touchstart', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, []);
  
  // Handle joystick movement logic
  const handleJoystickMovement = (clientX: number, clientY: number) => {
    const joystick = joystickRef.current;
    const joystickInner = joystickInnerRef.current;
    
    if (!joystick || !joystickInner) return;
    
    const joystickRect = joystick.getBoundingClientRect();
    
    // Calculate position relative to joystick center
    const centerX = joystickRect.left + joystickRect.width / 2;
    const centerY = joystickRect.top + joystickRect.height / 2;
    
    // Calculate distance from center
    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;
    
    // Constrain distance to joystick radius for realistic movement
    const maxRadius = joystickRect.width / 2 - 10;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > maxRadius) {
      const angle = Math.atan2(deltaY, deltaX);
      deltaX = Math.cos(angle) * maxRadius;
      deltaY = Math.sin(angle) * maxRadius;
    }
    
    // Set CSS variables for animation
    joystickInner.style.setProperty('--x', `${deltaX}px`);
    joystickInner.style.setProperty('--y', `${deltaY}px`);
    joystickInner.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    
    // Update position state
    setJoystickPosition({ x: deltaX, y: deltaY });
    
    // Determine joystick direction based on position
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    if (absX > absY && absX > 10) {
      if (deltaX > 0) {
        setJoystickDirection('right');
        joystickInner.className = 'joystick-inner direction-right';
        // Scroll logic for right direction
        scrollHorizontal(1);
      } else {
        setJoystickDirection('left');
        joystickInner.className = 'joystick-inner direction-left';
        // Scroll logic for left direction
        scrollHorizontal(-1);
      }
    } else if (absY > absX && absY > 10) {
      if (deltaY > 0) {
        setJoystickDirection('down');
        joystickInner.className = 'joystick-inner direction-down';
        // Scroll down
        scrollVertical(absY / maxRadius);
      } else {
        setJoystickDirection('up');
        joystickInner.className = 'joystick-inner direction-up';
        // Scroll up
        scrollVertical(-absY / maxRadius);
      }
    } else {
      setJoystickDirection(null);
      joystickInner.className = 'joystick-inner';
      stopScrolling();
    }
  };

  // Horizontal scrolling function for situations where horizontal scroll is needed
  const scrollHorizontal = (direction: number) => {
    const scrollContainer = findScrollableContainer();
    
    if (scrollContainer) {
      scrollContainer.scrollBy({
        left: direction * 20,
        behavior: 'smooth'
      });
    }
  };

  // Vertical scrolling with adaptive speed
  const scrollVertical = (intensity: number) => {
    const scrollContainer = findScrollableContainer();
    setIsScrolling(true);
    
    if (scrollContainer) {
      setScrollTarget(scrollContainer);
      
      // Calculate scroll speed based on joystick intensity
      const baseSpeed = 5;
      const maxSpeed = 25;
      const scrollSpeed = Math.abs(intensity) * maxSpeed + baseSpeed;
      scrollSpeedRef.current = scrollSpeed;
      
      // Determine scroll direction
      scrollDirectionRef.current = intensity < 0 ? 'up' : 'down';
      
      // If not already scrolling, start the scroll animation
      if (!isScrolling) {
        requestAnimationFrame(animateScroll);
      }
    }
  };

  // Stop scrolling
  const stopScrolling = () => {
    setIsScrolling(false);
    scrollDirectionRef.current = 'none';
    scrollSpeedRef.current = 0;
  };

  // Find scrollable container based on current route
  const findScrollableContainer = (): Element | null => {
    // Try to find a scrollable container
    // First priority: elements with overflow-y: auto/scroll
    const scrollableElements = Array.from(document.querySelectorAll('[style*="overflow-y:auto"], [style*="overflow-y:scroll"], [style*="overflow: auto"], .scrollable-container'));
    
    // Filter to only elements that are actually scrollable
    const actuallyScrollableElements = scrollableElements.filter(el => {
      const style = window.getComputedStyle(el);
      return (style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
    });
    
    if (actuallyScrollableElements.length > 0) {
      // Return the first scrollable element
      return actuallyScrollableElements[0];
    }
    
    // Second priority: document.body or main content container
    const mainContent = document.querySelector('main') || document.querySelector('.app-content-wrapper');
    if (mainContent && mainContent.scrollHeight > mainContent.clientHeight) {
      return mainContent;
    }
    
    // Default to document.documentElement (html)
    return document.documentElement;
  };

  // Animate the scroll with momentum
  const animateScroll = () => {
    if (!isScrolling || !scrollTarget) return;
    
    const now = Date.now();
    const deltaTime = now - lastScrollTime.current;
    lastScrollTime.current = now;
    
    const speed = scrollSpeedRef.current;
    const direction = scrollDirectionRef.current === 'up' ? -1 : 1;
    
    // Apply scroll
    scrollTarget.scrollBy({
      top: direction * speed,
      behavior: 'auto', // Use 'auto' for immediate feedback
    });
    
    // Continue animation loop
    requestAnimationFrame(animateScroll);
  };

  // Handle action button click
  const handleActionButtonClick = (action: 'like' | 'comment' | 'rank' | 'save') => {
    if (!currentPostId) return;
    
    switch(action) {
      case 'like':
        setLikeActive(!likeActive);
        // Like post logic would go here
        console.log('Like post action for:', currentPostId);
        break;
      case 'comment':
        setCommentActive(!commentActive);
        // Comment logic - navigate to comments
        navigate(`/comments/${currentPostId}`);
        break;
      case 'save':
        setSaveActive(!saveActive);
        // Save video logic would go here
        console.log('Save video action for:', currentPostId);
        break;
      case 'rank':
        setRankActive(!rankActive);
        // Ranking system logic would go here
        console.log('Rank post action for:', currentPostId);
        break;
    }
  };

  return (
    <div className="gameboy-controls">
      <div className="gameboy-section">
        {/* Xbox-style joystick */}
        <div 
          ref={joystickRef}
          className={`joystick xbox-style ${isJoystickActive ? 'active' : ''} ${joystickDirection ? `active-${joystickDirection}` : ''} ${isTouched ? 'touched' : ''}`}
          aria-label="Joystick control for navigation"
        >
          <div 
            ref={joystickInnerRef}
            className={`joystick-inner ${momentumActive ? 'momentum' : ''}`}
          ></div>
          <div className="joystick-ripple"></div>
          <div className="joystick-direction joystick-direction-up"></div>
          <div className="joystick-direction joystick-direction-right"></div>
          <div className="joystick-direction joystick-direction-down"></div>
          <div className="joystick-direction joystick-direction-left"></div>
        </div>

        <div className="center-section">
          <button className="clipt-button" onClick={() => navigate('/')} aria-label="CLIPT button">
            CLIPT
          </button>
          
          <div className="menu-buttons">
            <button className="menu-button" onClick={() => navigate('/select')} aria-label="Select">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <button className="menu-button" onClick={() => navigate('/create')} aria-label="Post">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="action-buttons modern-style">
        {/* Like button (X - Blue) */}
        <button 
          className={`action-button x ${likeActive ? 'active' : ''}`}
          onClick={() => handleActionButtonClick('like')}
          aria-label="Like post"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
        
        {/* Save button (B - Red) */}
        <button 
          className={`action-button b ${saveActive ? 'active' : ''}`}
          onClick={() => handleActionButtonClick('save')}
          aria-label="Save video"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
        
        {/* Comment button (A - Green) */}
        <button 
          className={`action-button a ${commentActive ? 'active' : ''}`}
          onClick={() => handleActionButtonClick('comment')}
          aria-label="Comment"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
        
        {/* Rank button (Y - Yellow) */}
        <button 
          className={`action-button y ${rankActive ? 'active' : ''}`}
          onClick={() => handleActionButtonClick('rank')}
          aria-label="Rank post"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default GameBoyControls;
