import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, MessageSquare, Award, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import './enhanced-joystick.css';
import './rainbow-buttons.css';

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
  const [followActive, setFollowActive] = useState(false);
  const [rankActive, setRankActive] = useState(false);
  const [currentRank, setCurrentRank] = useState(0);
  
  // Game menu state
  const [menuVisible, setMenuVisible] = useState(false);
  
  // Track current post ID if on a post page
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentPost, setCurrentPost] = useState<any>(null);
  
  // Enhanced joystick animation states
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [momentumActive, setMomentumActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Track scroll position and reference
  const [scrollTarget, setScrollTarget] = useState<Element | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollPositionRef = useRef(0);
  const scrollSpeedRef = useRef(0);
  const scrollDirectionRef = useRef<'up' | 'down' | 'none'>('none');
  const lastScrollTime = useRef(Date.now());
  
  // Extract post ID from URL if on a post page and set data-current-page attribute
  useEffect(() => {
    const match = location.pathname.match(/\/post\/([^/?#]+)/);
    const currentPage = location.pathname.replace('/', '');
    
    // Set data-current-page attribute on body for page-specific styling
    document.body.setAttribute('data-current-page', currentPage);
    
    if (match && match[1]) {
      setCurrentPostId(match[1]);
    } else {
      setCurrentPostId(null);
      setLikeActive(false);
      setFollowActive(false);
      setRankActive(false);
      setCurrentRank(0);
    }
  }, [location.pathname]);
  
  // Get current user and fetch post data when post ID changes
  useEffect(() => {
    const fetchUserAndPostData = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
      
      // If we have a post ID, fetch the post data
      if (currentPostId && user) {
        // Fetch post data
        const { data: post, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', currentPostId)
          .single();
          
        if (error) {
          console.error('Error fetching post:', error);
          return;
        }
        
        if (post) {
          setCurrentPost(post);
          
          // Check if user has liked this post
          const { data: likeData } = await supabase
            .from('post_likes')
            .select('*')
            .eq('post_id', currentPostId)
            .eq('user_id', user.id)
            .single();
            
          setLikeActive(!!likeData);
          
          // Check if user is following this post's creator
          const { data: followData } = await supabase
            .from('user_follows')
            .select('*')
            .eq('following_id', post.user_id)
            .eq('follower_id', user.id)
            .single();
            
          setFollowActive(!!followData);
          
          // Check if user has ranked this post and get current rank
          const { data: rankData } = await supabase
            .from('post_ranks')
            .select('rank_value')
            .eq('post_id', currentPostId)
            .eq('user_id', user.id)
            .single();
            
          if (rankData) {
            setRankActive(true);
            setCurrentRank(rankData.rank_value);
          } else {
            setRankActive(false);
            setCurrentRank(0);
          }
        }
      }
    };
    
    fetchUserAndPostData();
  }, [currentPostId]);

  // Set up event listeners for joystick control
  useEffect(() => {
    // Ensure the joystick element exists
    if (!joystickRef.current || !joystickInnerRef.current) return;
    
    // Find the initial scrollable container
    setScrollTarget(findScrollableContainer());
    
    // Start animation loop
    let animationFrameId: number;
    const animate = () => {
      if (isScrolling) {
        animateScroll();
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    
    // Clean up animation frame
    return () => {
      setIsScrolling(false);
      cancelAnimationFrame(animationFrameId);
    };
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
  // Handle mouse/touch down on joystick
  const handleMouseDown = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    
    // Get joystick DOM element
    const joystick = joystickRef.current;
    if (!joystick) return;
    
    // Get size and position of joystick
    const joystickRect = joystick.getBoundingClientRect();
    
    // Set initial position
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Start dragging
    setIsDragging(true);
    setIsJoystickActive(true);
    setIsTouched(true);
    
    // Add event listeners for move and up events
    document.addEventListener('mousemove', handleMouseMove as unknown as EventListener);
    document.addEventListener('touchmove', handleMouseMove as unknown as EventListener, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);
  };
  
  // Handle mouse/touch movement
  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    handleJoystickMovement(clientX, clientY);
    
    // Prevent default to avoid scrolling the page
    if (e.cancelable) e.preventDefault();
  };
  
  // Handle mouse/touch up
  const handleMouseUp = () => {
    if (!isDragging) return;
    
    // Get inner joystick DOM element
    const joystickInner = joystickInnerRef.current;
    if (!joystickInner) return;
    
    // Reset joystick position with a smooth animation
    joystickInner.style.setProperty('--x', '0px');
    joystickInner.style.setProperty('--y', '0px');
    joystickInner.style.transition = 'transform 0.3s ease-out';
    joystickInner.style.transform = 'translate(0, 0)';
    
    // Add momentum class for smoother reset animation
    joystickInner.classList.add('momentum');
    setMomentumActive(true);
    
    // Stop dragging and reset state
    setIsDragging(false);
    setJoystickPosition({ x: 0, y: 0 });
    
    // Apply easing to scrolling to gradually slow down
    let slowdownTimer = setInterval(() => {
      scrollSpeedRef.current *= 0.9;
      
      if (Math.abs(scrollSpeedRef.current) < 0.5) {
        clearInterval(slowdownTimer);
        scrollSpeedRef.current = 0;
        setIsScrolling(false);
        scrollDirectionRef.current = 'none';
      }
    }, 50);
    
    // Remove the event listeners
    document.removeEventListener('mousemove', handleMouseMove as unknown as EventListener);
    document.removeEventListener('touchmove', handleMouseMove as unknown as EventListener);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchend', handleMouseUp);
    
    // Reset touched state after animation completes
    setTimeout(() => {
      setIsTouched(false);
      setIsJoystickActive(false);
      setMomentumActive(false);
      if (joystickInner) {
        joystickInner.classList.remove('momentum');
        joystickInner.style.transition = '';
      }
    }, 300);
  };
  
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

  // Handle menu item click
  const handleMenuItemClick = (path: string) => {
    console.log('Navigating to:', path);
    navigate(path);
    setMenuVisible(false);
  };

  // Handle the select button (menu navigation)
  const handleSelectButtonClick = () => {
    navigate('/game-menu');
  };

  // Handle action button click
  const handleActionButtonClick = async (action: 'like' | 'comment' | 'rank' | 'save' | 'post') => {
    // Allow post button to work without a post ID
    if (action === 'post') {
      navigate('/clip-editor/new');
      return;
    }
    
    // Other actions require a post ID and a user ID
    if (!currentPostId || !currentUserId) {
      if (!currentUserId) {
        toast.error('You must be logged in to perform this action');
      }
      return;
    }
    
    // Handle the appropriate action
    switch(action) {
      case 'like':
        try {
          if (likeActive) {
            // Unlike the post
            const { error } = await supabase
              .from('post_likes')
              .delete()
              .eq('post_id', currentPostId)
              .eq('user_id', currentUserId);
              
            if (error) throw error;
            
            // Update total likes count in posts table
            await supabase.rpc('decrement_post_likes', { post_id: currentPostId });
            
            setLikeActive(false);
            toast.success('Post unliked');
          } else {
            // Like the post
            const { error } = await supabase
              .from('post_likes')
              .insert({ post_id: currentPostId, user_id: currentUserId });
              
            if (error) throw error;
            
            // Update total likes count in posts table
            await supabase.rpc('increment_post_likes', { post_id: currentPostId });
            
            setLikeActive(true);
            toast.success('Post liked');
          }
        } catch (error) {
          console.error('Error toggling like:', error);
          toast.error('Failed to update like status');
        }
        break;
        
      case 'comment':
        // Navigate to comments page
        navigate(`/comments/${currentPostId}`);
        break;
        
      case 'follow':
        try {
          if (!currentPostId || !currentUserId) {
            toast.error('You must be logged in to follow users');
            return;
          }

          // Get post creator ID
          const { data: post, error: postError } = await supabase
            .from('posts')
            .select('user_id')
            .eq('id', currentPostId)
            .single();

          if (postError) throw postError;
          
          const creatorId = post.user_id;
          
          if (followActive) {
            // Unfollow user
            const { error } = await supabase
              .from('user_follows')
              .delete()
              .eq('following_id', creatorId)
              .eq('follower_id', currentUserId);
              
            if (error) throw error;
            
            setFollowActive(false);
            toast.success('User unfollowed');
          } else {
            // Follow user
            const { error } = await supabase
              .from('user_follows')
              .insert({
                following_id: creatorId,
                follower_id: currentUserId,
                created_at: new Date().toISOString()
              });
              
            if (error) throw error;
            
            setFollowActive(true);
            toast.success('Now following user');
          }
        } catch (error) {
          console.error('Error toggling follow:', error);
          toast.error('Failed to update follow status');
        }
        break;
        
      case 'rank':
        try {
          // Toggle through ranks (0, 1, 2, 3) where 0 means no rank
          let newRank = 0;
          
          if (!rankActive) {
            // First rank = 1
            newRank = 1;
          } else if (currentRank < 3) {
            // Increment rank
            newRank = currentRank + 1;
          } else {
            // Reset rank (remove ranking)
            newRank = 0;
          }
          
          if (newRank === 0) {
            // Remove rank
            const { error } = await supabase
              .from('post_ranks')
              .delete()
              .eq('post_id', currentPostId)
              .eq('user_id', currentUserId);
              
            if (error) throw error;
            
            setRankActive(false);
            setCurrentRank(0);
            toast.success('Rank removed');
          } else {
            // Add or update rank
            const { error } = await supabase
              .from('post_ranks')
              .upsert({ 
                post_id: currentPostId, 
                user_id: currentUserId,
                rank_value: newRank
              });
              
            if (error) throw error;
            
            setRankActive(true);
            setCurrentRank(newRank);
            toast.success(`Rank updated to ${newRank} ⭐`);
          }
          
          // Update average rank in posts table
          const { data, error } = await supabase
            .rpc('update_post_rank', { post_id: currentPostId });
            
          if (error) throw error;
        } catch (error) {
          console.error('Error updating rank:', error);
          toast.error('Failed to update rank');
        }
        break;
    }
  };

  // Component JSX
  return (
    <div className="gameboy-controls">
      {/* Joystick with cosmic rainbow border */}
      <div 
        ref={joystickRef} 
        className={`joystick xbox-style rainbow-border ${isTouched ? 'touched' : ''}`}
        onMouseDown={(e) => handleMouseDown(e as unknown as MouseEvent)}
        onTouchStart={(e) => handleMouseDown(e as unknown as TouchEvent)}
        aria-label="Joystick control for navigation"
      >
        <div 
          ref={joystickInnerRef} 
          className={`joystick-inner ${momentumActive ? 'momentum' : ''}`}
          style={{ '--x': `${joystickPosition.x}px`, '--y': `${joystickPosition.y}px` } as React.CSSProperties}
        ></div>
      </div>
      {/* Center controls layout */}
      <div className="center-controls">
        {/* CLIPT logo button with rainbow border */}
        <button 
          className="clipt-logo-button rainbow-border" 
          onClick={() => navigate('/clipts')}
          aria-label="Go to Clipts"
        >
          <span className="clipt-logo-text">CLIPT</span>
        </button>
        
        {/* Menu and Camera buttons row */}
        <div className="menu-camera-row">
          {/* Menu button (hamburger) with rainbow border */}
          <button 
            className="control-button rainbow-border" 
            onClick={handleSelectButtonClick} 
            aria-label="Toggle game menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          
          {/* Camera post button with rainbow border */}
          <button 
            className="control-button rainbow-border"
            onClick={() => navigate('/post-form')}
            aria-label="Create a new post"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect>
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19 6h-4l-2-3H11L9 6H5"></path>
            </svg>
          </button>
        </div>
      </div>
      


      {/* Note: Game Menu moved to a separate route page */}

      {/* Action buttons with rainbow borders in diamond layout */}
      <div className="action-buttons diamond-layout" style={{ position: 'fixed', top: '74%', right: '10px', zIndex: 9999 }}>
        {/* Comment button (top - blue) */}
        <button 
          className={`action-button comment-button top rainbow-border ${commentActive ? 'active' : ''}`}
          onClick={() => handleActionButtonClick('comment')}
          aria-label="Comment"
        >
          <MessageSquare size={20} strokeWidth={2.5} className="gameboy-action-icon" style={{ color: '#4287ff', fill: '#4287ff', stroke: '#4287ff', filter: 'drop-shadow(0 0 10px rgba(66, 135, 255, 1))' }} />
        </button>
        
        {/* Like button (left - red) */}
        <button 
          className={`action-button like-button left rainbow-border ${likeActive ? 'active' : ''}`}
          onClick={() => handleActionButtonClick('like')}
          aria-label="Like post"
        >
          <Heart size={20} strokeWidth={2.5} className="gameboy-action-icon" style={{ color: '#ff4d4d', fill: '#ff4d4d', stroke: '#ff4d4d', filter: 'drop-shadow(0 0 10px rgba(255, 77, 77, 1))' }} />
        </button>
        
        {/* Follow button (right - yellow) */}
        <button 
          className={`action-button follow-button right rainbow-border ${followActive ? 'active' : ''}`}
          onClick={() => handleActionButtonClick('follow')}
          aria-label="Follow user"
        >
          <Bookmark size={20} strokeWidth={2.5} className="gameboy-action-icon" style={{ color: '#ffcc33', fill: '#ffcc33', stroke: '#ffcc33', filter: 'drop-shadow(0 0 10px rgba(255, 204, 51, 1))' }} />
        </button>
        
        {/* Trophy button (bottom - yellow) */}
        <button 
          className={`action-button trophy-button bottom rainbow-border ${rankActive ? 'active' : ''}`}
          onClick={() => handleActionButtonClick('rank')}
          aria-label="Rank post"
        >
          <Award size={20} strokeWidth={2.5} className="gameboy-action-icon" style={{ color: '#4dff88', fill: '#4dff88', stroke: '#4dff88', filter: 'drop-shadow(0 0 10px rgba(77, 255, 136, 1))' }} />
          {rankActive && currentRank > 0 && (
            <span className="rank-indicator" style={{ backgroundColor: '#FFCC00', color: '#000' }}>{currentRank}</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default GameBoyControls;
