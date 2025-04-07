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
  
  // Game menu state
  const [menuVisible, setMenuVisible] = useState(false);
  
  // Track current post ID if on a post page
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  
  // Enhanced joystick animation states
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
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
    // Get joystick element and its dimensions
    const joystick = joystickRef.current;
    const joystickInner = joystickInnerRef.current;
    
    if (!joystick || !joystickInner) return;
    
    // Calculate joystick center position
    const rect = joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate distance from center
    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;
    
    // Calculate distance from center
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Calculate max radius (70% of joystick radius)
    const maxRadius = rect.width * 0.35;
    
    let intensity = 0;
    
    // If the distance is greater than the max radius, normalize to max radius
    if (distance > maxRadius) {
      deltaX = (deltaX / distance) * maxRadius;
      deltaY = (deltaY / distance) * maxRadius;
      intensity = 1; // Maximum intensity
    } else {
      intensity = distance / maxRadius; // Proportional intensity
    }
    
    // Update joystick position state
    setJoystickPosition({ x: deltaX, y: deltaY });
    
    // Set joystick inner element position using CSS variables
    joystickInner.style.setProperty('--x', `${deltaX}px`);
    joystickInner.style.setProperty('--y', `${deltaY}px`);
    joystickInner.style.transition = 'none';
    joystickInner.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    
    // Calculate angle to determine direction for scrolling
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    
    // Determine joystick direction based on position
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    if (absX > absY && absX > 10) {
      if (deltaX > 0) {
        // Scroll logic for right direction
        scrollHorizontal(1);
      } else {
        // Scroll logic for left direction
        scrollHorizontal(-1);
      }
    } else if (absY > absX && absY > 10) {
      if (deltaY > 0) {
        // Scroll down
        scrollVertical(absY / maxRadius);
      } else {
        // Scroll up
        scrollVertical(-absY / maxRadius);
      }
    } else {
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
  const handleActionButtonClick = (action: 'like' | 'comment' | 'rank' | 'save' | 'post') => {
    // Allow post button to work without a post ID
    if (action === 'post') {
      navigate('/create');
      return;
    }
    
    // Other actions require a post ID
    if (!currentPostId) return;
    
    // Handle the appropriate action
    switch(action) {
      case 'like':
        setLikeActive(!likeActive);
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
      {/* Left control (Joystick) based on Image 1 */}
      <div className={`joystick xbox-style ${isJoystickActive ? 'active' : ''} ${isTouched ? 'touched' : ''}`} ref={joystickRef} aria-label="Joystick control for navigation">
        <div 
          ref={joystickInnerRef} 
          className={`joystick-inner ${momentumActive ? 'momentum' : ''}`}
        ></div>
      </div>

      {/* CLIPT button based on Image 2 */}
      <button className="clipt-button" onClick={() => navigate('/')} aria-label="CLIPT button">
        CLIPT
      </button>

      {/* Menu buttons below CLIPT (from Image 2) */}
      <div className="menu-buttons">
        <button 
          className="menu-button menu-left" 
          onClick={() => setMenuVisible(!menuVisible)} 
          aria-label="Toggle game menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        
        {/* Center button - Camera/POST - Updated to match image 2 */}
        <button 
          className="menu-button camera-button"
          onClick={() => navigate('/post')}
          aria-label="Post a new clip"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
        </button>

      </div>

      {/* Game Menu - Updated to match Image 1 */}
      {menuVisible && (
        <div className="game-menu" onClick={(e) => {
          // Close the menu if clicking on the overlay (outside of the content)
          if (e.target === e.currentTarget) {
            setMenuVisible(false);
          }
        }}>
          <div className="game-menu-content">
            <h2>GAME MENU</h2>
            <div className="menu-grid">
              {/* Home */}
              <div className="menu-item" onClick={() => { navigate('/'); setMenuVisible(false); }}>
                <div className="menu-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </div>
                <div className="menu-text">
                  <h3>Home</h3>
                  <p>Main feed</p>
                </div>
                <div className="menu-arrow">▶</div>
              </div>

              {/* Select Game */}
              <div className="menu-item" onClick={() => { navigate('/select-game'); setMenuVisible(false); }}>
                <div className="menu-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
                <div className="menu-text">
                  <h3>Select Game</h3>
                  <p>Choose your game</p>
                </div>
                <div className="menu-arrow">▶</div>
              </div>

              {/* Settings */}
              <div className="menu-item" onClick={() => { navigate('/settings'); setMenuVisible(false); }}>
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
              <div className="menu-item" onClick={() => { navigate('/streaming'); setMenuVisible(false); }}>
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
              <div className="menu-item" onClick={() => { navigate('/profile'); setMenuVisible(false); }}>
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
              <div className="menu-item" onClick={() => { navigate('/messages'); setMenuVisible(false); }}>
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
              <div className="menu-item" onClick={() => { navigate('/notifications'); setMenuVisible(false); }}>
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
              <div className="menu-item" onClick={() => { navigate('/discovery'); setMenuVisible(false); }}>
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
              <div className="menu-item" onClick={() => { navigate('/top-clipts'); setMenuVisible(false); }}>
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
              <div className="menu-item" onClick={() => { navigate('/squads-clipts'); setMenuVisible(false); }}>
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
              <div className="menu-item" onClick={() => { navigate('/clipts'); setMenuVisible(false); }}>
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
      )}

      {/* Action buttons with rainbow rims in diamond layout */}
      <div className="action-buttons diamond-layout">
        {/* Comment button (top - blue) */}
        <button 
          className={`action-button comment-button top ${commentActive ? 'active' : ''}`}
          onClick={() => handleActionButtonClick('comment')}
          aria-label="Comment"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1a8cff" stroke="#1a8cff" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
        
        {/* Like button (left - red) */}
        <button 
          className={`action-button like-button left ${likeActive ? 'active' : ''}`}
          onClick={() => handleActionButtonClick('like')}
          aria-label="Like post"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ff3366" stroke="#ff3366" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
        
        {/* Save button (right - green) - changed from follow to save */}
        <button 
          className={`action-button save-button right ${saveActive ? 'active' : ''}`}
          onClick={() => handleActionButtonClick('save')}
          aria-label="Save video to bookmarks"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#00cc66" stroke="#00cc66" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        
        {/* Trophy button (bottom - yellow) */}
        <button 
          className={`action-button trophy-button bottom ${rankActive ? 'active' : ''}`}
          onClick={() => handleActionButtonClick('rank')}
          aria-label="Rank post"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffcc00" stroke="#ffcc00" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2zM6 9H4.5a2.5 2.5 0 0 1 0-5H6m12 5h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C8.55 18.37 8 18.97 8 19.69V22m6-7.34V17c0 .55.47.98.97 1.21c.48.16 1.03.76 1.03 1.48V22"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default GameBoyControls;
