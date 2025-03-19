import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  Heart, 
  Camera,
  MessageCircle, 
  Trophy, 
  UserPlus, 
  UserCheck,
  X, 
  Home, 
  Search, 
  Bell, 
  Upload, 
  User,
  TrendingUp,
  Settings,
  Bookmark,
  Video,
  Award,
  Monitor,
  Users
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import './joystick-animations.css'; // Import joystick animations
import CommentModal from './comments/CommentModal';

interface GameBoyControlsProps {
  currentPostId?: string;
}

const GameBoyControls: React.FC<GameBoyControlsProps> = ({ currentPostId: propCurrentPostId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [currentPath, setCurrentPath] = useState(location.pathname);
  const [currentPostId, setCurrentPostId] = useState<string | null>(propCurrentPostId || null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navigationOptions] = useState([
    { name: 'Settings', icon: <Settings className="mr-2 h-4 w-4" />, path: '/settings' },
    { name: 'Streaming', icon: <Video className="mr-2 h-4 w-4" />, path: '/streaming' },
    { name: 'Profile', icon: <User className="mr-2 h-4 w-4" />, path: '/profile' },
    { name: 'Messages', icon: <MessageCircle className="mr-2 h-4 w-4" />, path: '/messages' },
    { name: 'Notifications', icon: <Bell className="mr-2 h-4 w-4" />, path: '/notifications' },
    { name: 'Discovery', icon: <Search className="mr-2 h-4 w-4" />, path: '/discovery' },
    { name: 'Top Clipts', icon: <Award className="mr-2 h-4 w-4" />, path: '/top-clipts' },
    { name: 'Squads Clipts', icon: <Users className="mr-2 h-4 w-4" />, path: '/' },
    { name: 'Clipts', icon: <Monitor className="mr-2 h-4 w-4" />, path: '/clipts' }
  ]);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | undefined>(undefined);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Joystick states
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false); // Track if currently scrolling
  const [isScrollingEnabled, setIsScrollingEnabled] = useState(true);
  const joystickRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const scrollAnimationRef = useRef<number | null>(null); // For animation frame
  const lastScrollPosition = useRef<number | null>(null); // Track last scroll position
  
  // Helper function to log to debug (console only)
  const logToDebug = (message: string) => {
    console.log(message);
  };
  
  // Effect to close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    // Detect when the user manually scrolls the page to keep joystick in sync
    const handleWindowScroll = () => {
      // Only track manual scrolling when the joystick is not in use
      if (!isDragging && typeof lastScrollPosition.current === 'number') {
        // Store the updated scroll position
        lastScrollPosition.current = window.scrollY;
      }
    };

    // Add scroll event listener for synchronization
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
    };
  }, [isDragging]);

  useEffect(() => {
    // Add post detection on each navigation
    if (currentPath !== location.pathname) {
      setCurrentPath(location.pathname);
      console.log('Path changed to:', location.pathname);
      
      // Reset current post ID when navigating away from posts page
      if (!location.pathname.includes('/post/') && !location.pathname.includes('/clipts')) {
        setCurrentPostId(null);
      }
    }
    
    // Check for current post at regular intervals when on relevant pages
    const shouldDetectPosts = location.pathname.includes('/clipts') || 
                              location.pathname.includes('/top-clipts') || 
                              location.pathname.includes('/discover') || 
                              location.pathname === '/';
    
    if (shouldDetectPosts) {
      const timer = setInterval(() => {
        const detectedPostId = detectMostVisiblePost();
        // Check if we detected a post and it's different from current
        if (detectedPostId && detectedPostId !== currentPostId) {
          setCurrentPostId(detectedPostId);
          // Check follow status whenever current post changes
          checkFollowStatus(detectedPostId);
        }
      }, 1000); // Check every second for post changes
      
      return () => clearInterval(timer);
    }
  }, [location, currentPath]);

  // Use effect to ensure all posts have proper data attributes
  useEffect(() => {
    // Add post detection on mount and page changes
    logToDebug('Setting up post detection');
    
    // Function to ensure all posts have data-post-id attributes
    const addPostDataAttributes = () => {
      // Find all post containers
      const postItems = document.querySelectorAll('.post-item-container, .post-container, .post-card, .post-item, [id*="post"], .post, article');
      
      postItems.forEach((post, index) => {
        // Check if post already has an ID
        if (!post.hasAttribute('data-post-id')) {
          // Try to find the post ID in a child element
          const idElement = post.querySelector('[data-post-id]');
          if (idElement) {
            const postId = idElement.getAttribute('data-post-id');
            post.setAttribute('data-post-id', postId || 'unknown');
          } else {
            // Generate temporary ID if needed
            post.setAttribute('data-post-id', `post-${index}-${Date.now()}`);
          }
        }
      });
      
      // Initial detection
      detectMostVisiblePost();
    };
    
    // Run initially
    addPostDataAttributes();
    
    // Setup mutation observer to watch for new posts
    const observer = new MutationObserver((mutations) => {
      let shouldDetect = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any added nodes might be posts
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (node instanceof HTMLElement && 
                (node.classList.contains('post-item-container') || 
                 node.classList.contains('post-container') ||
                 node.classList.contains('post'))) {
              shouldDetect = true;
              break;
            }
          }
        }
      });
      
      if (shouldDetect) {
        // Only run if we potentially added new posts
        addPostDataAttributes();
      }
    });
    
    // Observe the main content area for changes
    const contentArea = document.querySelector('main') || document.body;
    observer.observe(contentArea, { childList: true, subtree: true });
    
    // Add scroll event listener to detect most visible post while scrolling
    window.addEventListener('scroll', detectMostVisiblePost, { passive: true });
    
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', detectMostVisiblePost);
    };
  }, [location.pathname]);

  // Make the animation loop run continuously for smoother scrolling response
  useEffect(() => {
    let animationFrameId: number | null = null;
    let lastScrollY = window.scrollY;
    let scrollTimer: number | null = null;
    
    const runAnimationLoop = () => {
      // Get current joystick position
      const yPosition = joystickPosition.y;
      
      // Check for joystick movement
      if (Math.abs(yPosition) > 1.5 && !location.pathname.includes('/comments/')) {
        handleScrollFromJoystick(yPosition);
        
        // Check if user has released joystick but page is still scrolling
        if (Math.abs(yPosition) < 2 && Math.abs(window.scrollY - lastScrollY) > 5) {
          // Slow down scrolling momentum gradually
          if (scrollTimer) clearTimeout(scrollTimer);
          scrollTimer = window.setTimeout(() => {
            // Find nearest post to snap to after scrolling stops
            snapToNearestPost();
          }, 300);
        }
      }
      
      // Track scroll position
      lastScrollY = window.scrollY;
      
      // Continue animation loop
      animationFrameId = requestAnimationFrame(runAnimationLoop);
    };
    
    // Helper to snap to the nearest post center after scrolling
    const snapToNearestPost = () => {
      const posts = document.querySelectorAll('[data-post-id]');
      if (!posts.length) return;
      
      let closestPost = null;
      let minDistance = Infinity;
      const viewportCenter = window.innerHeight / 2;
      
      // Find the post closest to the center of the viewport
      posts.forEach(post => {
        const rect = post.getBoundingClientRect();
        const postCenter = rect.top + (rect.height / 2);
        const distance = Math.abs(postCenter - viewportCenter);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestPost = post;
        }
      });
      
      // Snap to the closest post if it's within a reasonable distance
      if (closestPost && minDistance < window.innerHeight * 0.4) {
        const rect = closestPost.getBoundingClientRect();
        const postCenter = rect.top + (rect.height / 2);
        const scrollAdjustment = postCenter - viewportCenter;
        
        window.scrollBy({
          top: scrollAdjustment,
          behavior: 'smooth'
        });
      }
    };
    
    // Start animation loop
    animationFrameId = requestAnimationFrame(runAnimationLoop);
    
    // Clean up on unmount
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
    };
  }, [joystickPosition, location.pathname]);

  const handleScrollFromJoystick = (yPosition: number) => {
    // Early return only if scrolling is explicitly disabled
    if (isScrollingEnabled === false) return;
    
    // Don't scroll on certain pages where native scrolling is preferred
    const currentPath = location.pathname;
    if (currentPath.includes('/comments/')) {
      return; // Don't use joystick scrolling on comments page
    }
    
    // Define constants for calculations
    const maxYPosition = 40; // Maximum expected joystick movement
    
    // More responsive curve with variable intensity based on joystick position
    // This creates a more natural feeling when scrolling small vs large amounts
    const normalizedPosition = yPosition / maxYPosition; // Normalize to -1 to 1 range
    const direction = Math.sign(normalizedPosition);
    
    // Enhanced adaptive curve - more controlled for post-by-post scrolling
    const adaptiveCurve = Math.abs(normalizedPosition) < 0.3 ? 
      0.7 : // More linear/responsive for small movements
      1.2;  // Less aggressive acceleration for larger movements
    
    const magnitude = Math.pow(Math.abs(normalizedPosition), adaptiveCurve);
    
    // Reduced base scroll speed for more controlled scrolling
    const baseScrollSpeed = 120; // Lower speed for more controlled scrolling
    let scrollSpeed = direction * magnitude * baseScrollSpeed;
    
    // When joystick is nearly still, slow scrolling even more
    if (Math.abs(normalizedPosition) < 0.15) {
      scrollSpeed *= 0.5; // Further reduce for very small movements
    }
    
    // Check if we're close to the center of a post - if so, slow down scrolling
    const posts = document.querySelectorAll('[data-post-id]');
    const viewportCenter = window.innerHeight / 2;
    
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const rect = post.getBoundingClientRect();
      const postCenter = rect.top + (rect.height / 2);
      
      // If a post is near the center of viewport, reduce scroll speed
      if (Math.abs(postCenter - viewportCenter) < rect.height * 0.3) {
        // Reduce speed when near center of a post
        scrollSpeed *= 0.7;
        break;
      }
    }
    
    // Always do post detection for responsive UI
    detectMostVisiblePost();
    
    // Directly apply scrolling for maximum responsiveness
    window.scrollBy({
      top: scrollSpeed,
      behavior: 'auto' // Always use auto for responsive feel
    });
    
    // Make sure the joystick visually stays in the correct position
    if (joystickRef.current) {
      const currentTransform = (joystickRef.current as HTMLDivElement).style.transform;
      if (!currentTransform || !currentTransform.includes(`${yPosition}px`)) {
        const xPos = joystickPosition.x;
        (joystickRef.current as HTMLDivElement).style.transform = `translate3d(${xPos}px, ${yPosition}px, 0)`;
      }
    }
    
    // Store scroll position
    lastScrollPosition.current = window.scrollY;
    
    // Update visual feedback
    updateDirectionIndicators(yPosition);
  };
  
  // Joystick movement handlers
  const handleJoystickMouseDown = (e: React.MouseEvent) => {
    // Prevent default actions and bubbling
    e.preventDefault();
    e.stopPropagation();
    
    // Actively set the joystick as being dragged
    setIsDragging(true);
    
    // Initial joystick movement when first clicked
    if (joystickRef.current && baseRef.current) {
      const baseRect = baseRef.current.getBoundingClientRect();
      const baseCenterX = baseRect.left + baseRect.width / 2;
      const baseCenterY = baseRect.top + baseRect.height / 2;
      
      // Calculate relative position
      let dx = e.clientX - baseCenterX;
      let dy = e.clientY - baseCenterY;
      
      // Limit movement
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = baseRect.width / 3;
      if (distance > maxDistance) {
        dx = (dx / distance) * maxDistance;
        dy = (dy / distance) * maxDistance;
      }
      
      // Immediate movement on click
      (joystickRef.current as HTMLDivElement).style.transition = 'none';
      (joystickRef.current as HTMLDivElement).style.transform = `translate(${dx}px, ${dy}px)`;
      setJoystickPosition({ x: dx, y: dy });
      
      // Immediately handle scrolling
      handleScrollFromJoystick(dy);
      updateDirectionIndicators(dy);
    }
    
    // Ensure we have clean event listeners by removing any existing ones first
    window.removeEventListener('mousemove', handleJoystickMouseMove);
    window.removeEventListener('mouseup', handleJoystickMouseUp);
    
    // Add event listeners to window for mouse movement and release
    window.addEventListener('mousemove', handleJoystickMouseMove);
    window.addEventListener('mouseup', handleJoystickMouseUp);
    
    // Start the scroll animation loop
    startScrollAnimation();
  };
  
  const handleJoystickMouseMove = (e: MouseEvent) => {
    if (!isDragging || !joystickRef.current || !baseRef.current) return;
    
    // Prevent default browser behavior
    e.preventDefault();
    e.stopPropagation();
    
    // Get joystick base position and dimensions
    const baseRect = baseRef.current.getBoundingClientRect();
    const baseCenterX = baseRect.left + baseRect.width / 2;
    const baseCenterY = baseRect.top + baseRect.height / 2;
    
    // Calculate relative position
    let dx = e.clientX - baseCenterX;
    let dy = e.clientY - baseCenterY;
    
    // Limit joystick movement to a circle with improved physical response
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = baseRect.width / 3; // Limit to 1/3 of base width
    
    if (distance > maxDistance) {
      // Scale the position to stay within the max distance
      dx = (dx / distance) * maxDistance;
      dy = (dy / distance) * maxDistance;
    }
    
    // Apply some smooth interpolation for more natural movement
    const previousX = joystickPosition.x;
    const previousY = joystickPosition.y;
    
    // Smooth interpolation factor (0-1)
    // Lower = more smoothing but more lag, higher = less smoothing but more responsive
    const smoothingFactor = 0.7;
    
    // Apply smoothing
    dx = previousX + (dx - previousX) * smoothingFactor;
    dy = previousY + (dy - previousY) * smoothingFactor;
    
    // Directly update DOM for immediate response
    if (joystickRef.current) {
      // Set CSS variables for animation
      (joystickRef.current as HTMLDivElement).style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      
      // Override any transitions during active dragging
      (joystickRef.current as HTMLDivElement).style.transition = 'none';
    }
    
    // Update state for React components (but DOM is already updated)
    setJoystickPosition({ x: dx, y: dy });
    
    // Immediately trigger scroll for responsive feel
    handleScrollFromJoystick(dy);
    
    // Update visual indicators
    updateDirectionIndicators(dy);
  };
  // Enhanced direction indicators with smoother transitions and variable intensity
  const updateDirectionIndicators = (yPosition: number) => {
    const joystickHandle = joystickRef.current;
    const upIndicator = document.querySelector('.joystick-up-indicator');
    const downIndicator = document.querySelector('.joystick-down-indicator');
    
    if (joystickHandle && upIndicator && downIndicator) {
      // Normalize the position to calculate intensity (0-100%)
      const maxYPosition = 40; // Maximum expected joystick movement
      const intensity = Math.min(Math.abs(yPosition) / maxYPosition * 100, 100);
      
      // Apply intensity as a CSS variable for smoother visual feedback
      const direction = yPosition < 0 ? 'up' : yPosition > 0 ? 'down' : 'neutral';
      
      // Reset all states first
      upIndicator.classList.remove('active');
      downIndicator.classList.remove('active');
      joystickHandle.classList.remove('joystick-handle-up', 'joystick-handle-down');
      
      // Preserve the current transform in the style attribute
      const currentTransform = (joystickHandle as HTMLDivElement).style.transform || `translate(${joystickPosition.x}px, ${joystickPosition.y}px)`;
      
      if (direction === 'up' && Math.abs(yPosition) > 2) { // Smaller deadzone for visual feedback
        // Moving up with variable intensity
        upIndicator.classList.add('active');
        joystickHandle.classList.add('joystick-handle-up');
        
        // Apply intensity as a CSS variable while preserving transform
        (upIndicator as HTMLElement).style.setProperty('--intensity', `${intensity}%`);
        (joystickHandle as HTMLElement).style.setProperty('--move-intensity', `${intensity}%`);
      } else if (direction === 'down' && Math.abs(yPosition) > 2) {
        // Moving down with variable intensity
        downIndicator.classList.add('active');
        joystickHandle.classList.add('joystick-handle-down');
        
        // Apply intensity as a CSS variable while preserving transform
        (downIndicator as HTMLElement).style.setProperty('--intensity', `${intensity}%`);
        (joystickHandle as HTMLElement).style.setProperty('--move-intensity', `${intensity}%`);
      } else {
        // Neutral position - reset intensity but keep transform
        (joystickHandle as HTMLElement).style.setProperty('--move-intensity', '0%');
        (upIndicator as HTMLElement).style.setProperty('--intensity', '0%');
        (downIndicator as HTMLElement).style.setProperty('--intensity', '0%');
      }
    }
  };
  
  const handleJoystickMouseUp = () => {
    // Stop dragging
    setIsDragging(false);
    
    // Remove event listeners
    window.removeEventListener('mousemove', handleJoystickMouseMove);
    window.removeEventListener('mouseup', handleJoystickMouseUp);
    
    // Stop the scrolling animation
    stopScrollAnimation();
    
    // Store the last position for spring animation
    const lastPosition = { ...joystickPosition };
    
    // Apply spring return animation
    if (joystickRef.current) {
      // Set CSS variables for animation
      (joystickRef.current as HTMLDivElement).style.setProperty('--last-x', `${lastPosition.x}px`);
      (joystickRef.current as HTMLDivElement).style.setProperty('--last-y', `${lastPosition.y}px`);
      
      // Force GPU acceleration for smoother animation
      (joystickRef.current as HTMLDivElement).style.willChange = 'transform';
      
      // Add the spring animation class
      (joystickRef.current as HTMLDivElement).classList.add('joystick-spring-return');
      
      // Directly set transform for immediate visual feedback
      (joystickRef.current as HTMLDivElement).style.transform = 'translate3d(0px, 0px, 0px)';
      
      // Remove the animation class after it completes
      setTimeout(() => {
        if (joystickRef.current) {
          (joystickRef.current as HTMLDivElement).classList.remove('joystick-spring-return');
          // Reset willChange after animation to free up resources
          (joystickRef.current as HTMLDivElement).style.willChange = 'auto';
        }
      }, 500); // Match the animation duration in joystick-animations.css
    }
    
    // Return joystick to center in state
    setJoystickPosition({ x: 0, y: 0 });
    
    // Reset UI indicators
    if (joystickRef.current) {
      (joystickRef.current as HTMLDivElement).classList.remove(
        'joystick-handle-up', 
        'joystick-handle-down',
        'low-intensity',
        'medium-intensity',
        'high-intensity'
      );
    }
    
    const upIndicator = document.querySelector('.joystick-up-indicator');
    const downIndicator = document.querySelector('.joystick-down-indicator');
    
    if (upIndicator) {
      upIndicator.classList.remove('active');
      (upIndicator as HTMLElement).setAttribute('style', '--intensity: 0%');
    }
    
    if (downIndicator) {
      downIndicator.classList.remove('active');
      (downIndicator as HTMLElement).setAttribute('style', '--intensity: 0%');
    }
  };
  
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    // Prevent default to avoid browser gestures
    e.preventDefault();
    e.stopPropagation();
    
    // Set dragging state
    setIsDragging(true);
    
    // Initial joystick movement when first touched
    if (joystickRef.current && baseRef.current && e.touches[0]) {
      const baseRect = baseRef.current.getBoundingClientRect();
      const baseCenterX = baseRect.left + baseRect.width / 2;
      const baseCenterY = baseRect.top + baseRect.height / 2;
      
      // Calculate initial position relative to center
      let dx = e.touches[0].clientX - baseCenterX;
      let dy = e.touches[0].clientY - baseCenterY;
      
      // Limit to circle
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = baseRect.width / 3;
      
      if (distance > maxDistance) {
        dx = (dx / distance) * maxDistance;
        dy = (dy / distance) * maxDistance;
      }
      
      // Immediate movement on touch
      (joystickRef.current as HTMLDivElement).style.transition = 'none';
      (joystickRef.current as HTMLDivElement).style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      
      // Update state
      setJoystickPosition({ x: dx, y: dy });
      
      // Handle scroll immediately for responsive feel
      handleScrollFromJoystick(dy);
      
      // Update visual feedback
      updateDirectionIndicators(dy);
    }
    
    // Clean up previous listeners
    window.removeEventListener('touchmove', handleJoystickTouchMove);
    window.removeEventListener('touchend', handleJoystickTouchEnd);
    window.removeEventListener('touchcancel', handleJoystickTouchEnd);
    
    // Add event listeners to window
    window.addEventListener('touchmove', handleJoystickTouchMove, { passive: false });
    window.addEventListener('touchend', handleJoystickTouchEnd);
    window.addEventListener('touchcancel', handleJoystickTouchEnd);
    
    // Start the scrolling animation
    startScrollAnimation();
  };
  
  const handleJoystickTouchMove = (e: TouchEvent) => {
    // Skip if not actively dragging or missing references
    if (!isDragging || !joystickRef.current || !baseRef.current || !e.touches[0]) {
      return;
    }
    
    // Prevent default browser behavior to avoid scrolling the page
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate joystick position relative to its base
    const touch = e.touches[0];
    const baseRect = baseRef.current.getBoundingClientRect();
    const baseCenterX = baseRect.left + baseRect.width / 2;
    const baseCenterY = baseRect.top + baseRect.height / 2;
    
    // Get touch position relative to joystick center
    let dx = touch.clientX - baseCenterX;
    let dy = touch.clientY - baseCenterY;
    
    // Limit the movement to a circle
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = baseRect.width / 3;
    
    if (distance > maxDistance) {
      // Scale the position to stay within the max distance
      dx = (dx / distance) * maxDistance;
      dy = (dy / distance) * maxDistance;
    }
    
    // Apply some smooth interpolation for more natural movement
    const previousX = joystickPosition.x;
    const previousY = joystickPosition.y;
    
    // Smooth interpolation factor (0-1)
    const smoothingFactor = 0.7;
    
    // Apply smoothing
    dx = previousX + (dx - previousX) * smoothingFactor;
    dy = previousY + (dy - previousY) * smoothingFactor;
    
    // Update joystick position with immediate DOM update
    if (joystickRef.current) {
      (joystickRef.current as HTMLDivElement).style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      (joystickRef.current as HTMLDivElement).style.transition = 'none';
    }
    
    // Update state (though visual is already updated)
    setJoystickPosition({ x: dx, y: dy });
    
    // Apply scrolling based on vertical movement
    handleScrollFromJoystick(dy);
    
    // Update visual indicators
    updateDirectionIndicators(dy);
  };
  
  const handleJoystickTouchEnd = () => {
    // Stop dragging
    setIsDragging(false);
    
    // Prevent ghost touches by removing listeners
    window.removeEventListener('touchmove', handleJoystickTouchMove);
    window.removeEventListener('touchend', handleJoystickTouchEnd);
    window.removeEventListener('touchcancel', handleJoystickTouchEnd);
    
    // Stop scrolling animation
    stopScrollAnimation();
    
    // Save current position for physics-based return animation
    const lastPosition = { ...joystickPosition };
    
    // Apply smooth spring return animation
    if (joystickRef.current) {
      // Set CSS variables for animation
      (joystickRef.current as HTMLDivElement).style.setProperty('--last-x', `${lastPosition.x}px`);
      (joystickRef.current as HTMLDivElement).style.setProperty('--last-y', `${lastPosition.y}px`);
      
      // Optimize rendering with GPU acceleration
      (joystickRef.current as HTMLDivElement).style.willChange = 'transform';
      
      // Add spring animation class
      (joystickRef.current as HTMLDivElement).classList.add('joystick-spring-return');
      
      // Set initial transform for smooth return
      (joystickRef.current as HTMLDivElement).style.transform = 'translate3d(0px, 0px, 0px)';
      
      // Clean up after animation completes
      setTimeout(() => {
        if (joystickRef.current) {
          (joystickRef.current as HTMLDivElement).classList.remove('joystick-spring-return');
          (joystickRef.current as HTMLDivElement).style.willChange = 'auto';
        }
      }, 500); // Match animation duration
    }
    
    // Reset joystick position in state
    setJoystickPosition({ x: 0, y: 0 });
    
    // Reset UI indicators
    const upIndicator = document.querySelector('.joystick-up-indicator');
    const downIndicator = document.querySelector('.joystick-down-indicator');
    
    if (joystickRef.current) {
      joystickRef.current.classList.remove(
        'joystick-handle-up', 
        'joystick-handle-down',
        'low-intensity',
        'medium-intensity',
        'high-intensity'
      );
    }
    
    if (upIndicator) {
      upIndicator.classList.remove('active');
      (upIndicator as HTMLElement).setAttribute('style', '--intensity: 0%');
    }
    
    if (downIndicator) {
      downIndicator.classList.remove('active');
      (downIndicator as HTMLElement).setAttribute('style', '--intensity: 0%');
    }
  };
  
  // Animation loop for smooth scrolling
  const startScrollAnimation = () => {
    setIsScrolling(true);
    
    // Cancel any existing animation frame
    if (scrollAnimationRef.current !== null) {
      cancelAnimationFrame(scrollAnimationRef.current);
    }
    
    // Don't start scroll animation on the comments page
    if (location.pathname.includes('/comments/')) {
      return;
    }
    
    // Reset timestamp for fresh animation
    let lastTimestamp: number | null = null;
    
    // Animation function with improved timing
    const animateScroll = () => {
      // Calculate delta time for smoother animation
      if (!lastTimestamp) lastTimestamp = performance.now();
      const deltaTime = (performance.now() - lastTimestamp) / 16.67; // Normalize to 60fps
      lastTimestamp = performance.now();
      
      // Get current joystick Y position directly
      let yPosition = joystickPosition.y;
      
      // Get position from DOM for most accurate value
      if (joystickRef.current) {
        const transform = (joystickRef.current as HTMLDivElement).style.transform;
        if (transform) {
          const match = transform.match(/translate3d\((.+?)px,\s*(.+?)px/);
          if (match && match[2]) {
            yPosition = parseFloat(match[2]);
          }
        }
      }
      
      // Always perform scrolling when there's vertical movement, even if not dragging
      // This is crucial for responsive joystick control
      if (Math.abs(yPosition) > 1.5 && !location.pathname.includes('/comments/')) {
        handleScrollFromJoystick(yPosition);
      }
      
      // Continue animation loop
      scrollAnimationRef.current = requestAnimationFrame(animateScroll);
    };
    
    // Start the animation loop immediately
    scrollAnimationRef.current = requestAnimationFrame(animateScroll);
  };
  
  // Stop the scrolling animation
  const stopScrollAnimation = () => {
    setIsScrolling(false);
    
    // Cancel the animation frame
    if (scrollAnimationRef.current !== null) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
  };
  
  const syncJoystickWithScroll = useCallback(() => {
    if (!isDragging && joystickRef.current) {
      // Reset to center position when not dragging
      (joystickRef.current as HTMLDivElement).style.transform = 'translate3d(0px, 0px, 0px)';
      setJoystickPosition({ x: 0, y: 0 });
    }
  }, [isDragging, setJoystickPosition]);

  // Call the sync function on scroll end
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScrollEnd = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // When scrolling stops, sync the joystick position
        syncJoystickWithScroll();
      }, 150); // Delay to ensure scroll has fully stopped
    };
    
    window.addEventListener('scroll', handleScrollEnd, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScrollEnd);
      clearTimeout(scrollTimeout);
    };
  }, [syncJoystickWithScroll]);

  // Optimized universal action handler for faster response
  const handlePostAction = (actionType: 'like' | 'comment' | 'follow' | 'trophy') => {
    // Provide immediate visual feedback on controller button
    const controllerButton = document.querySelector(`[data-action="${actionType}"]`);
    if (controllerButton) {
      controllerButton.classList.add('button-press');
      // Use shorter animation time for faster feedback
      setTimeout(() => {
        controllerButton.classList.remove('button-press');
      }, 200);
    }
    
    // Force post detection before taking action to ensure we're using the most current post
    // This is crucial - detect the post FIRST before acting on it
    const detectedPostId = detectMostVisiblePost();
    const targetPostId = detectedPostId || currentPostId;
    
    if (!targetPostId) {
      logToDebug(`No post selected for ${actionType} action`);
      toast.error('No post selected. Try scrolling to a post first.');
      return;
    }
    
    logToDebug(`Handling ${actionType} action for post: ${targetPostId}`);
    
    // Optimized selector list ordered by most common/fastest selectors first
    const postSelectors = [
      `[data-post-id="${targetPostId}"]`,
      `#post-${targetPostId}`,
      `.post-item[data-id="${targetPostId}"]`,
      `.post-container[data-id="${targetPostId}"]`,
      `[id="${targetPostId}"]`,
      `.post-${targetPostId}`
    ];
    
    let targetPost: Element | null = null;
    
    // Try each selector until we find a match
    for (const selector of postSelectors) {
      try {
        const post = document.querySelector(selector);
        if (post) {
          targetPost = post;
          logToDebug(`Found target post with selector: ${selector}`);
          break;
        }
      } catch (err) {
        console.error(`Error finding target post with selector:`, selector, err);
      }
    }
    
    if (!targetPost) {
      logToDebug('Target post not found, looking at all posts...');
      
      // Try to find post among all posts with data-post-id
      const allPosts = document.querySelectorAll('[data-post-id]');
      let foundPost = false;
      
      allPosts.forEach(post => {
        const postId = post.getAttribute('data-post-id');
        if (postId === targetPostId) {
          targetPost = post;
          foundPost = true;
          logToDebug('Found post by iterating through all posts');
        }
      });
      
      if (!foundPost) {
        logToDebug('Post not found with any method');
        toast.error('Post not found. Try scrolling to make it visible.');
        return;
      }
    }
    
    if (targetPost) {
      // Determine button selectors based on action type
      let buttonSelectors: string[] = [];
      
      switch (actionType) {
        case 'like':
          buttonSelectors = [
            '.like-button', 
            'button:has(svg[data-feather="heart"])',
            'button:has(.heart-icon)',
            'button:has(.lucide-heart)',
            'button[aria-label*="like" i]',
            'button[title*="like" i]',
            '[data-action="like"]'
          ];
          break;
        case 'comment':
          buttonSelectors = [
            '.comment-button', 
            'button:has(svg[data-feather="message-circle"])',
            'button:has(.comment-icon)',
            'button:has(.lucide-message-circle)',
            'button[aria-label*="comment" i]',
            'button[title*="comment" i]',
            '[data-action="comment"]'
          ];
          break;
        case 'follow':
          buttonSelectors = [
            '.follow-button', 
            'button:has(svg[data-feather="user-plus"])',
            'button:has(.follow-icon)',
            'button:has(.lucide-user-plus)',
            'button[aria-label*="follow" i]',
            'button[title*="follow" i]',
            '[data-action="follow"]'
          ];
          break;
        case 'trophy':
          buttonSelectors = [
            '.trophy-button', 
            'button:has(svg[data-feather="trophy"])',
            'button:has(.trophy-icon)',
            'button:has(.lucide-trophy)',
            'button[aria-label*="trophy" i]',
            'button[title*="trophy" i]',
            '[data-action="trophy"]'
          ];
          break;
      }
      
      let actionButton: Element | null = null;
      
      // Try each selector within the post first
      for (const selector of buttonSelectors) {
        try {
          const buttons = targetPost.querySelectorAll(selector);
          if (buttons.length > 0) {
            actionButton = buttons[0];
            logToDebug(`Found ${actionType} button within post using selector: ${selector}`);
            break;
          }
        } catch (err) {
          console.error(`Error finding ${actionType} button with selector:`, selector, err);
        }
      }
      
      // If we couldn't find in the target post, look globally with proximity check
      if (!actionButton) {
        logToDebug('Button not found in post, looking globally...');
        
        for (const selector of buttonSelectors) {
          try {
            // Find all buttons of this type in the document
            const allButtons = document.querySelectorAll(selector);
            
            allButtons.forEach(button => {
              // Check if this button is in or near our target post
              let closestPost = button.closest('[data-post-id]');
              if (!closestPost) {
                // Try to find post by proximity if it's not a direct parent
                const buttonRect = button.getBoundingClientRect();
                const postRect = targetPost!.getBoundingClientRect();
                
                // Check if button is near our target post
                const horizontalOverlap = 
                  (buttonRect.left <= postRect.right && buttonRect.right >= postRect.left);
                const verticalOverlap = 
                  (buttonRect.top <= postRect.bottom && buttonRect.bottom >= postRect.top);
                
                if (horizontalOverlap && verticalOverlap) {
                  actionButton = button;
                  logToDebug(`Found ${actionType} button by proximity`);
                }
              } else if (closestPost.getAttribute('data-post-id') === targetPostId) {
                actionButton = button;
                logToDebug(`Found ${actionType} button via closest post`);
              }
            });
            
            if (actionButton) break;
          } catch (err) {
            console.error(`Error finding global ${actionType} button:`, err);
          }
        }
      }
      
      if (actionButton) {
        logToDebug(`Clicking ${actionType} button`);
        
        // Actually trigger the button's click event
        actionButton.dispatchEvent(new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        }));
        
        toast.success(`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} action triggered`);
        return;
      } else {
        logToDebug(`${actionType} button not found on post`);
        
        // Fallback for different actions
        if (actionType === 'comment') {
          logToDebug('Falling back to comment page');
          // Navigate directly to comments page instead of opening the modal
          if (targetPostId) {
            setActiveCommentPostId(targetPostId);
            setCommentModalOpen(true);
            console.log(`Opening comment modal for post ID: ${targetPostId}`);
          } else {
            toast.error('No post selected');
          }
          return;
        } else if (actionType === 'like') {
          // Try direct API like
          handleDirectLike(targetPostId);
          return;
        } else {
          toast.error(`Could not find ${actionType} button. Try another post.`);
        }
      }
    }
  };
  
  // Direct API like when button click fails
  const handleDirectLike = async (postId: string) => {
    try {
      logToDebug('Attempting direct API like for post: ' + postId);
      
      const { data: currentUser } = await supabase.auth.getUser();
      const userId = currentUser?.user?.id;
      
      if (!userId) {
        toast.error('You need to be logged in to like posts');
        return;
      }
      
      // Check if already liked
      const { data: existingLike, error: likeError } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (likeError) {
        console.error('Error checking like status:', likeError);
      }
      
      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
          
        toast.success('Removed like from post');
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: userId,
            created_at: new Date().toISOString()
          });
          
        toast.success('Liked post');
      }
      
      // Trigger a refresh for the post's like count
      document.dispatchEvent(new CustomEvent('refresh-post', {
        detail: { postId }
      }));
      
      // Invalidate any React Query caches for this post
      queryClient.invalidateQueries({ queryKey: ['likes', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };
  
  // Direct API follow when button click fails
  const handleDirectFollow = async (postId: string) => {
    try {
      logToDebug('Attempting direct API follow for post: ' + postId);
      
      const { data: currentUser } = await supabase.auth.getUser();
      const userId = currentUser?.user?.id;
      
      if (!userId) {
        toast.error('You need to be logged in to follow users');
        return;
      }
      
      // First, get the post to find the creator's ID
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();
      
      if (postError || !postData) {
        console.error('Error fetching post data:', postError);
        toast.error('Error finding post creator');
        return;
      }
      
      const creatorId = postData.user_id;
      
      if (creatorId === userId) {
        toast.info('You cannot follow yourself');
        return;
      }
      
      // Check if already following
      const { data: existingFollow, error: followError } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', userId)
        .eq('following_id', creatorId)
        .maybeSingle();
      
      if (followError) {
        console.error('Error checking follow status:', followError);
      }
      
      if (existingFollow) {
        // Already following, so unfollow
        const { error: unfollowError } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', userId)
          .eq('following_id', creatorId);
          
        if (unfollowError) {
          console.error('Error unfollowing user:', unfollowError);
          toast.error('Failed to unfollow user');
          return;
        }
          
        toast.success('Unfollowed creator');
        setIsFollowing(false);
      } else {
        // Follow the creator
        const { error: followInsertError } = await supabase
          .from('follows')
          .insert({
            follower_id: userId,
            following_id: creatorId,
            created_at: new Date().toISOString()
          });
          
        if (followInsertError) {
          console.error('Error following user:', followInsertError);
          toast.error('Failed to follow user');
          return;
        }
          
        toast.success('Now following this creator');
        setIsFollowing(true);
      }
      
      // Trigger a refresh for the post's follow status
      document.dispatchEvent(new CustomEvent('refresh-follow-status', {
        detail: { userId: creatorId }
      }));
      
      // Invalidate any React Query caches
      queryClient.invalidateQueries({ queryKey: ['follows'] });
      queryClient.invalidateQueries({ queryKey: ['profile', creatorId] });
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    }
  };
  
  // Check if user is following a post creator
  const checkFollowStatus = async (postId: string) => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      const userId = currentUser?.user?.id;
      
      if (!userId) return false;
      
      // First, get the post creator's ID
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();
      
      if (postError || !postData) return false;
      
      const creatorId = postData.user_id;
      
      // Check if already following
      const { data: existingFollow, error: followError } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', userId)
        .eq('following_id', creatorId)
        .maybeSingle();
      
      if (followError) return false;
      
      setIsFollowing(!!existingFollow);
      return !!existingFollow;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  };

  // Individual action handlers that use the universal handler
  const handleLike = () => handlePostAction('like');
  const handleComment = () => {
    // First check if we have a current post ID
    if (!currentPostId) {
      // Try to detect post if we don't have one
      const isSinglePostPage = location.pathname.includes('/post/');
      if (isSinglePostPage) {
        // Extract post ID from URL
        const match = location.pathname.match(/\/post\/([^\/]+)/);
        if (match && match[1]) {
          const newPostId = match[1];
          console.log(`Detected post ID from URL: ${newPostId}`);
          setActiveCommentPostId(newPostId);
          setCommentModalOpen(true);
          return;
        }
      }
      
      toast.error("No post selected. Try scrolling to a post first.");
      return;
    }
    
    // We have a currentPostId, now try to open comments
    console.log(`Opening comment modal for post: ${currentPostId}`);
    setActiveCommentPostId(currentPostId);
    setCommentModalOpen(true);
    
    // For better UX, show a visual indication of which post is selected
    const selectedPost = document.querySelector(`[data-post-id="${currentPostId}"]`);
    if (selectedPost) {
      // Add a pulsing effect to show which post was selected
      selectedPost.classList.add('comment-target-pulse');
      
      // Remove the effect after animation completes
      setTimeout(() => {
        selectedPost.classList.remove('comment-target-pulse');
      }, 1000);
    }
  };
  const handleFollow = () => {
    // Try the universal approach first
    handlePostAction('follow');
    
    // Get the current post ID with improved reliability
    const detectedPostId = detectMostVisiblePost();
    const targetPostId = detectedPostId || currentPostId;
    
    if (targetPostId) {
      // Update follow status for UI feedback
      checkFollowStatus(targetPostId);
      
      // If the post is found but the button click failed, try direct API follow
      setTimeout(() => {
        handleDirectFollow(targetPostId);
      }, 500);
    } else {
      toast.error('No post selected. Try scrolling to a post first.');
    }
  };
  const handleTrophy = () => handlePostAction('trophy');

  // Enhanced comment button handler
  const handleCommentClick = () => {
    // Enhanced post detection for comments
    const currentPostId = getCurrentPostId();
    
    if (currentPostId) {
      console.log('Comment button clicked for post:', currentPostId);
      
      // Add visual feedback - pulse animation on the selected post
      const postElement = document.querySelector(`[data-post-id="${currentPostId}"], #post-${currentPostId}`);
      if (postElement) {
        // Add a pulse effect to indicate the targeted post
        postElement.classList.add('comment-target-pulse');
        // Remove it after animation completes
        setTimeout(() => postElement.classList.remove('comment-target-pulse'), 800);
      }
      
      // Navigate to the full-page comments view
      navigate(`/comments-full/${currentPostId}`);
      
      // Store the last interacted post ID to maintain context
      try {
        localStorage.setItem('clipt-last-comment-post', currentPostId);
      } catch (e) {
        console.error('Failed to store post ID:', e);
      }
    } else {
      // Fallback - notify user
      toast.info('Select a post to comment on', {
        position: 'bottom-center',
        duration: 2000,
      });
      
      // Try to scroll to the first visible post to help user
      const firstVisiblePost = Array.from(document.querySelectorAll('.post-item, [data-post-id], [id^="post-"]')).find(
        post => {
          const rect = post.getBoundingClientRect();
          return rect.top >= 0 && rect.bottom <= window.innerHeight;
        }
      );
      
      if (firstVisiblePost) {
        firstVisiblePost.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Function to get the current post ID with improved reliability
  const getCurrentPostId = () => {
    // First check if we have a selected post ID in state
    if (currentPostId) {
      return currentPostId;
    }
    
    // Then check session storage as backup
    try {
      const storedPostId = sessionStorage.getItem('clipt-last-selected-post');
      if (storedPostId) {
        return storedPostId;
      }
    } catch (e) {
      console.error('Failed to access session storage:', e);
    }
    
    // Last resort - find the most visible post on screen
    return detectMostVisiblePost();
  };

  // Helper function to detect the most visible post on screen with optimized performance
  const detectMostVisiblePost = (): string | null => {
    // Get all post elements that have a data-post-id attribute
    const posts = document.querySelectorAll('[data-post-id]');
    if (!posts.length) return null;
    
    let maxVisiblePost = null;
    let maxVisibleArea = 0;
    
    // Calculate viewport dimensions
    const viewportHeight = window.innerHeight;
    const viewportTop = window.scrollY;
    const viewportBottom = viewportTop + viewportHeight;
    const viewportCenter = viewportTop + (viewportHeight / 2);
    
    // Find the post with the largest visible area
    posts.forEach((post) => {
      const rect = post.getBoundingClientRect();
      const postTop = rect.top + window.scrollY;
      const postBottom = postTop + rect.height;
      
      // Skip if post is not visible at all
      if (postBottom < viewportTop || postTop > viewportBottom) return;
      
      // Calculate visible area of the post
      const visibleTop = Math.max(postTop, viewportTop);
      const visibleBottom = Math.min(postBottom, viewportBottom);
      const visibleHeight = visibleBottom - visibleTop;
      
      // Give bonus points for posts closer to the center of the viewport
      const distanceToCenter = Math.abs((postTop + postBottom) / 2 - viewportCenter);
      const centerBonus = 1 - (distanceToCenter / viewportHeight);
      
      // Combine visible area and center bonus
      const visibleArea = visibleHeight * centerBonus;
      
      if (visibleArea > maxVisibleArea) {
        maxVisibleArea = visibleArea;
        maxVisiblePost = post;
      }
    });
    
    // Get postId if a visible post was found
    if (maxVisiblePost) {
      const postId = maxVisiblePost.getAttribute('data-post-id');
      
      // Update current post ID if it changed
      if (postId && postId !== currentPostId) {
        setCurrentPostId(postId);
        console.log('Current post changed to:', postId);
      }
      
      return postId || null;
    }
    
    return null;
  };

  // Add subtle styling for the comment target pulse animation
  const style = document.createElement('style');
  style.innerHTML = `
    .gameboy-selected-post {
      outline: 2px solid rgba(61, 90, 254, 0.3);
      transition: outline 0.3s ease;
    }
    
    .comment-target-pulse {
      animation: comment-pulse 0.8s ease;
    }
    
    @keyframes comment-pulse {
      0% { box-shadow: 0 0 0 0 rgba(61, 90, 254, 0.4); }
      50% { box-shadow: 0 0 0 8px rgba(61, 90, 254, 0.1); }
      100% { box-shadow: 0 0 0 0 rgba(61, 90, 254, 0); }
    }
  `;
  
  // Your return JSX - the UI for the GameBoy controller
  return (
    <>
      {/* Enhanced Comment Modal using the proper component */}
      {commentModalOpen && activeCommentPostId && (
        <CommentModal 
          isOpen={commentModalOpen}
          onClose={() => {
            setCommentModalOpen(false);
            setActiveCommentPostId(undefined);
          }}
          postId={activeCommentPostId}
        />
      )}
      
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      >
        <div className="bg-[#0D0D18] w-full pointer-events-auto py-3 shadow-lg">
          <div className="flex justify-between items-center px-10 max-w-5xl mx-auto">
            
              {/* Left - Modern Xbox-style Joystick */}
              <div 
                ref={baseRef}
                className="w-24 h-24 bg-gradient-to-b from-[#1A1A24] to-[#0D0D18] rounded-full flex items-center justify-center cursor-pointer relative shadow-lg select-none"
                onMouseDown={handleJoystickMouseDown}
                onTouchStart={handleJoystickTouchStart}
              >
                {/* Joystick base with realistic grooves */}
                <div className="w-20 h-20 bg-gradient-to-b from-[#272733] to-[#1D1D26] rounded-full flex items-center justify-center relative overflow-hidden">
                  {/* Circular groove effect - more pronounced */}
                  <div className="absolute inset-1 rounded-full border-[3px] border-[#0D0D18] opacity-70"></div>
                  <div className="absolute inset-3 rounded-full border-[1px] border-[#3A3A45] opacity-30"></div>
                  
                  {/* Directional indicators with glow effect */}
                  <div className="joystick-up-indicator absolute -top-1 left-1/2 transform -translate-x-1/2 opacity-80 text-white">
                    <div className="w-2 h-3 bg-gradient-to-b from-[#876AF5] to-[#6A4EDB] rounded"></div>
                  </div>
                  <div className="joystick-down-indicator absolute -bottom-1 left-1/2 transform -translate-x-1/2 opacity-80 text-white">
                    <div className="w-2 h-3 bg-gradient-to-b from-[#876AF5] to-[#6A4EDB] rounded"></div>
                  </div>
                  <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 opacity-80 text-white">
                    <div className="h-2 w-3 bg-gradient-to-r from-[#876AF5] to-[#6A4EDB] rounded"></div>
                  </div>
                  <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 opacity-80 text-white">
                    <div className="h-2 w-3 bg-gradient-to-r from-[#876AF5] to-[#6A4EDB] rounded"></div>
                  </div>
                  
                  {/* Xbox-like thumbstick */}
                  <div 
                    ref={joystickRef}
                    className="joystick-handle w-14 h-14 bg-gradient-to-b from-[#2A2A36] to-[#151520] rounded-full border border-[#3A3A45] absolute z-10 cursor-grab active:cursor-grabbing select-none"
                    style={{
                      transform: `translate3d(${joystickPosition.x}px, ${joystickPosition.y}px, 0)`,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.7)', 
                      willChange: 'transform, box-shadow', // Optimize both properties
                      touchAction: 'none', /* Prevent default touch actions */
                      transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.17, 0.84, 0.44, 1), box-shadow 0.1s ease'
                    }}
                  >
                    {/* Realistic concave thumbstick surface */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#151520] to-[#272733] opacity-80">
                      {/* Texture circles for grip */}
                      <div className="absolute inset-[4px] rounded-full border-[1px] border-[#3A3A45] opacity-40"></div>
                      <div className="absolute inset-[8px] rounded-full border-[1px] border-[#3A3A45] opacity-40"></div>
                      {/* Center dot for Xbox-like appearance */}
                      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#3A3A45]"></div>
                    </div>
                  </div>
                </div>
                {/* Outer ring highlight to enhance 3D effect */}
                <div className="absolute inset-[-1px] rounded-full border border-[#3A3A45] opacity-20"></div>
              </div>
            
            {/* Center */}
            <div className="flex flex-col items-center space-y-3">
              {/* CLIPT button with gradient border */}
              <div 
                onClick={() => navigate('/clipts')}
                className="w-16 h-16 bg-[#0D0D18] rounded-full cursor-pointer flex items-center justify-center relative"
              >
                {/* Gradient border using pseudo-element */}
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 animate-pulse" style={{ opacity: 0.7 }}></span>
                <span className="absolute inset-[2px] bg-[#0D0D18] rounded-sm"></span>
                <span className="relative text-white font-bold text-sm z-10">CLIPT</span>
              </div>
              
              {/* Menu and Camera buttons */}
              <div className="flex space-x-6">
                {/* Navigation menu button */}
                <div 
                  className="w-10 h-10 bg-[#1D1D26] rounded-full flex items-center justify-center cursor-pointer relative navigation-menu-container"
                  onClick={() => setMenuOpen(!menuOpen)}
                  ref={menuRef}
                >
                  <Menu className="text-white h-4 w-4" />
                  
                  {/* Navigation menu popup */}
                  {menuOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                      {/* Close button */}
                      <button 
                        onClick={() => setMenuOpen(false)} 
                        className="absolute top-8 right-8 w-10 h-10 rounded-full bg-[#1D1D26] flex items-center justify-center border border-[#3A3A45]"
                      >
                        <X className="h-5 w-5 text-white" />
                      </button>
                      
                      {/* Game-style menu container */}
                      <div className="w-[90%] max-w-md bg-[#0D0D18] border-4 border-[#3A3A45] rounded-lg p-1 animate-in fade-in-90 zoom-in-90 duration-300">
                        {/* Menu header with pixel-like border - GameBoy style window */}
                        <div className="relative bg-[#0D0D18] border-b-4 border-dashed border-[#3A3A45] mb-2">
                          <div className="absolute top-0 left-0 w-3 h-3 bg-[#3A3A45] rounded-sm -translate-x-1 -translate-y-1"></div>
                          <div className="absolute top-0 right-0 w-3 h-3 bg-[#3A3A45] rounded-sm translate-x-1 -translate-y-1"></div>
                          <h2 className="text-center py-4 text-lg font-bold text-white bg-gradient-to-r from-purple-500/20 to-blue-500/20">
                            GAME MENU
                          </h2>
                        </div>
                        
                        {/* Game-style menu items in a grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
                          {navigationOptions.map((option, index) => (
                            <button
                              key={option.name}
                              className={`flex items-center justify-between border border-[#4a4dff] p-2 hover:bg-[#252968] transition-all duration-200 group relative overflow-hidden ${
                                option.name === 'Squads Clipts' ? 'bg-[#2e1a4a] border-[#9f7aea] relative' : 'bg-[#1a1d45]'
                              }`}
                              onClick={() => {
                                navigate(option.path);
                                setMenuOpen(false);
                              }}
                            >
                              {/* Icon container with gameboy-like button effect */}
                              <div className="flex items-center justify-center h-10 w-10 bg-gradient-to-br from-[#333339] to-[#1F1F25] rounded-md mr-4 shadow-inner relative group-hover:from-purple-700 group-hover:to-blue-700 transition-colors duration-300">
                                <div className="absolute inset-[2px] bg-[#0D0D18] rounded-sm"></div>
                                {React.cloneElement(option.icon as React.ReactElement, { 
                                  className: "h-5 w-5 text-purple-400 group-hover:text-white transition-colors duration-300" 
                                })}
                              </div>
                              
                              <div className="flex flex-col">
                                {/* Menu text with subtle glow effect on hover */}
                                <span className="group-hover:text-purple-300 font-medium transition-all duration-300 text-base">
                                  {option.name}
                                </span>
                                
                                {/* Description line - optional */}
                                <span className="text-xs text-gray-400 group-hover:text-blue-300 transition-colors">
                                  {option.name === 'Settings' && 'Configure your game'}
                                  {option.name === 'Streaming' && 'Live gameplay'}
                                  {option.name === 'Profile' && 'Your player stats'}
                                  {option.name === 'Messages' && 'Chat with players'}
                                  {option.name === 'Notifications' && 'Your notifications'}
                                  {option.name === 'Discovery' && 'Find new games'}
                                  {option.name === 'Top Clipts' && 'Hall of fame'}
                                  {option.name === 'Squads Clipts' && 'Your squads clipts'}
                                  {option.name === 'Clipts' && 'View all clipts'}
                                </span>
                              </div>
                              
                              {/* Arrow indicator */}
                              <span className="ml-auto opacity-70 group-hover:opacity-100 transition-opacity text-purple-400 text-lg">►</span>
                              
                              {/* Pixel dots in corners */}
                              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#3A3A45]"></div>
                              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#3A3A45]"></div>
                              <div className="absolute top-1 left-1 w-1 h-1 bg-[#3A3A45]"></div>
                              <div className="absolute top-1 right-1 w-1 h-1 bg-[#3A3A45]"></div>
                              
                              {/* Subtle highlight effect on hover */}
                              <div className="absolute bottom-0 left-0 h-[3px] w-0 bg-gradient-to-r from-purple-500 to-blue-500 group-hover:w-full transition-all duration-300"></div>
                            </button>
                          ))}
                        </div>
                        
                        {/* Footer with game-like credits */}
                        <div className="mt-4 border-t-2 border-dashed border-[#3A3A45] py-3 px-4 text-center">
                          
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Post button (Camera icon) - Enhanced with purple highlight */}
                <div 
                  className="w-10 h-10 bg-[#1D1D26] rounded-full flex items-center justify-center cursor-pointer relative group"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/post/new');
                    // Log for debugging
                    console.log('Navigating to post creation page');
                  }}
                >
                  <div className="absolute inset-0 rounded-full bg-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <Camera className="text-white h-4 w-4 group-hover:text-purple-300 transition-colors duration-300" />
                </div>
              </div>
            </div>
            
            {/* Right - Action Buttons in diamond shape (Xbox style) */}
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 mb-3">
                {/* Top button (Comment) */}
                <button 
                  data-action="comment"
                  onClick={handleCommentClick}
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-11 h-11 bg-[#151520] rounded-full border-2 border-blue-500 flex items-center justify-center"
                >
                  <MessageCircle className="text-blue-500 h-5 w-5" />
                </button>
                
                {/* Left button (Like) */}
                <button 
                  data-action="like"
                  onClick={handleLike}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 w-11 h-11 bg-[#151520] rounded-full border-2 border-red-500 flex items-center justify-center"
                >
                  <Heart className="text-red-500 h-5 w-5" fill="#ef4444" />
                </button>
                
                {/* Right button (Trophy) */}
                <button 
                  data-action="trophy"
                  onClick={handleTrophy}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 w-11 h-11 bg-[#151520] rounded-full border-2 border-yellow-500 flex items-center justify-center"
                >
                  <Trophy className="text-yellow-500 h-5 w-5" />
                </button>
                
                {/* Bottom button (Follow/Unfollow) */}
                <button 
                  data-action="follow"
                  onClick={handleFollow}
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-11 h-11 bg-[#151520] rounded-full border-2 border-green-500 flex items-center justify-center"
                >
                  {isFollowing ? (
                    <UserCheck className="text-green-500 h-5 w-5" />
                  ) : (
                    <UserPlus className="text-green-500 h-5 w-5" />
                  )}
                </button>
              </div>
              

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GameBoyControls;
