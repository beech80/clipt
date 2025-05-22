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
    
    // Calculate distance from center (Pythagorean theorem)
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Limit the maximum joystick movement to the radius of the joystick base
    const maxRadius = rect.width / 2;
    
    // If distance is greater than maxRadius, normalize the movement
    if (distance > maxRadius) {
      const angle = Math.atan2(deltaY, deltaX);
      deltaX = Math.cos(angle) * maxRadius;
      deltaY = Math.sin(angle) * maxRadius;
    }
    
    // Update joystick position with CSS variables
    joystickInner.style.setProperty('--x', `${deltaX}px`);
    joystickInner.style.setProperty('--y', `${deltaY}px`);
    joystickInner.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    
    // Update joystick position state for other components
    setJoystickPosition({ x: deltaX, y: deltaY });
    
    // Normalize the delta values between -1 and 1 for intensity calculation
    const normalizedX = deltaX / maxRadius;
    const normalizedY = deltaY / maxRadius;
    
    // Calculate intensity (distance from center, normalized)
    const intensity = Math.min(1, Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY));
    
    // Find scrollable container based on current route
    if (!scrollTarget) {
      const target = findScrollableContainer();
      if (target) {
        setScrollTarget(target);
      }
    }
    
    // Handle vertical scroll based on joystick position
    if (Math.abs(normalizedY) > 0.3) {
      // If moving up or down significantly
      if (normalizedY < -0.3) {
        // Up
        scrollVertical(-intensity);
      } else if (normalizedY > 0.3) {
        // Down
        scrollVertical(intensity);
      }
    } else {
      // Stop scrolling if within dead zone
      stopScrolling();
    }
  };
  
  // Horizontal scrolling function for situations where horizontal scroll is needed
  const scrollHorizontal = (direction: number) => {
    if (!scrollTarget) return;
    
    const speed = Math.abs(direction) * 20; // Scale speed based on joystick intensity
    
    scrollSpeedRef.current = speed;
    scrollDirectionRef.current = direction < 0 ? 'up' : 'down';
    
    scrollTarget.scrollBy({
      left: direction * speed,
      behavior: 'auto',
    });
  };
  
  // Vertical scrolling with adaptive speed
  const scrollVertical = (intensity: number) => {
    if (!scrollTarget) return;
    
    // Calculate scroll speed based on intensity (non-linear for better control)
    const speed = Math.pow(Math.abs(intensity), 1.5) * 30; // Adjust multiplier for speed
    
    // Set scroll direction
    scrollDirectionRef.current = intensity < 0 ? 'up' : 'down';
    scrollSpeedRef.current = speed;
    
    // Start scrolling if not already
    if (!isScrolling) {
      setIsScrolling(true);
      lastScrollTime.current = Date.now();
      requestAnimationFrame(animateScroll);
    }
  };
  
  // Stop scrolling
  const stopScrolling = () => {
    if (isScrolling) {
      setIsScrolling(false);
      scrollDirectionRef.current = 'none';
      scrollSpeedRef.current = 0;
    }
  };
  
  // Find scrollable container based on current route
  const findScrollableContainer = (): Element | null => {
    const path = location.pathname;
    
    // Check for different content areas based on route
    if (path.includes('post/')) {
      // Post detail page
      return document.querySelector('.post-detail-content') || document.querySelector('.main-content');
    } else if (path.includes('clipts') || path === '/') {
      // Main feed or clips feed
      return document.querySelector('.clips-feed') || document.querySelector('.feed-container');
    } else if (path.includes('profile')) {
      // Profile page
      return document.querySelector('.profile-content') || document.querySelector('.content-area');
    } else if (path.includes('squads')) {
      // Squads page
      return document.querySelector('.squads-content') || document.querySelector('.main-content');
    }
    
    // Default to document for general scrolling
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
    navigate(path);
    setMenuVisible(false);
  };
  
  // Handle the select button (menu navigation)
  const handleSelectButtonClick = () => {
    navigate('/game-menu');
  };
  
  // Handle action button click
  const handleActionButtonClick = async (action: 'like' | 'comment' | 'rank' | 'follow' | 'post') => {
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

  // Render the controller UI
  return (
    <div className="gameboy-controls">
      {/* Left joystick with rainbow border */}
      <div className="left-joystick" style={{ position: 'fixed', bottom: '15px', left: '10px', zIndex: 9999, pointerEvents: 'auto' }}>
        <div 
          className={`joystick xbox-style rainbow-border ${isJoystickActive ? 'active' : ''} ${isTouched ? 'touched' : ''}`} 
          ref={joystickRef} 
          aria-label="Joystick control for navigation"
        >
          <div 
            ref={joystickInnerRef} 
            className={`joystick-inner ${momentumActive ? 'momentum' : ''}`}
          ></div>
        </div>
      </div>
      
      {/* Center Menu Controls */}
      <div className="center-controls" style={{ position: 'fixed', bottom: '25px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', gap: '20px', pointerEvents: 'auto' }}>
        {/* Menu Button (hamburger icon) */}
        <button 
          className="menu-button select-button rainbow-border-button"
          onClick={handleSelectButtonClick}
          aria-label="Open Game Menu"
        >
          <div style={{ fontSize: '22px', color: '#fff' }}>≡</div>
        </button>
        
        {/* Clipt Button - Center */}
        <button 
          className="menu-button clipt-button rainbow-border-button"
          onClick={() => handleMenuItemClick('/')}
          aria-label="Go to Clipt Home"
        >
          <span style={{ color: '#adff2f', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>CLIPT</span>
        </button>
        
        {/* Camera Button */}
        <button 
          className="menu-button post-button rainbow-border-button"
          onClick={() => handleActionButtonClick('post')}
          aria-label="Create New Post"
        >
          <div style={{ fontSize: '20px' }}>📷</div>
        </button>
      </div>
      
      {/* Action buttons with rainbow borders in diamond layout */}
      <div className="action-buttons diamond-layout" style={{ position: 'fixed', bottom: '15px', right: '15px', zIndex: 9999, pointerEvents: 'auto' }}>
        {/* Comment button (top - blue) */}
        <button 
          className={`action-button comment-button top rainbow-border-button ${commentActive ? 'active' : ''}`}
          onClick={() => handleActionButtonClick('comment')}
          aria-label="Comment"
        >
          <MessageSquare className="gameboy-action-icon" />
        </button>
        
        {/* Like button (left - red) */}
        <button 
          className={`action-button like-button left rainbow-border-button ${likeActive ? 'active' : ''}`}
          onClick={() => handleActionButtonClick('like')}
          aria-label="Like post"
        >
          <Heart className="gameboy-action-icon" />
        </button>
        
        {/* Follow button (right - yellow) */}
        <button 
          className={`action-button follow-button right rainbow-border-button ${followActive ? 'active' : ''}`}
          onClick={() => handleActionButtonClick('follow')}
          aria-label="Follow user"
        >
          <Bookmark className="gameboy-action-icon" />
        </button>
        
        {/* Trophy button (bottom - yellow) */}
        <button 
          className={`action-button rank-button bottom rainbow-border-button ${rankActive ? 'active' : ''}`}
          onClick={() => handleActionButtonClick('rank')}
          aria-label="Rank post"
        >
          <Award className="gameboy-action-icon" />
          {rankActive && currentRank > 0 && (
            <span className="rank-indicator">{currentRank}</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default GameBoyControls;
