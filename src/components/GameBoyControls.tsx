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
  Users,
  Grid,
  Compass
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
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);
  const [navigationOptions] = useState([
    { id: 'clipts', name: 'Clipts', icon: <Grid size={18} />, path: '/clipts' },
    { id: 'top-clipts', name: 'Top Clipts', icon: <Trophy size={18} />, path: '/top-clipts' },
    { id: 'discover', name: 'Discovery', icon: <Compass size={18} />, path: '/discover' },
    { id: 'profile', name: 'Profile', icon: <User size={18} />, path: '/profile' },
    { id: 'messages', name: 'Messages', icon: <MessageCircle size={18} />, path: '/messages' },
    { id: 'notifications', name: 'Notifications', icon: <Bell size={18} />, path: '/notifications' },
    { id: 'streaming', name: 'Streaming', icon: <Video size={18} />, path: '/streaming' },
    { id: 'squads', name: 'Squads Clipts', icon: <Users size={18} />, path: '/squads/clipts' },
    { id: 'settings', name: 'Settings', icon: <Settings size={18} />, path: '/settings' }
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
  const joystickRef = useRef<HTMLDivElement | null>(null);
  const baseRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const scrollAnimationRef = useRef<number | null>(null); // For animation frame
  const lastScrollPosition = useRef<number>(0); // Track last scroll position
  const lastPostIndexRef = useRef<number>(-1); // Track the last post we interacted with
  const startYRef = useRef<number>(0); // Track the start Y position of joystick
  const rotationDegree = useRef<number>(0);
  
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
    if (currentPath !== window.location.pathname) {
      setCurrentPath(window.location.pathname);
      console.log('Path changed to:', window.location.pathname);
      
      // Reset current post ID when navigating away from posts page
      if (!window.location.pathname.includes('/post/') && !window.location.pathname.includes('/clipts')) {
        setCurrentPostId(null);
      }
    }
    
    // Check for current post at regular intervals when on relevant pages
    const shouldDetectPosts = window.location.pathname.includes('/clipts') || 
                              window.location.pathname.includes('/top-clipts') || 
                              window.location.pathname.includes('/discover') || 
                              window.location.pathname === '/';
    
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
  }, [window.location]);

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
  }, [window.location.pathname]);

  // Make the animation loop run continuously for smoother scrolling response
  useEffect(() => {
    let animationFrameId: number | null = null;
    let lastScrollY = window.scrollY;
    let scrollTimer: number | null = null;
    let lastJoystickDirection = 0;
    
    const runAnimationLoop = () => {
      // Calculate delta time for smoother animation
      if (!lastScrollY) lastScrollY = window.scrollY;
      const deltaTime = (window.scrollY - lastScrollY) / 16.67; // Normalize to 60fps
      lastScrollY = window.scrollY;
      
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
      if (Math.abs(yPosition) > 1.5) {
        handleScrollFromJoystick(yPosition);
      }
      
      // Continue animation loop
      scrollAnimationRef.current = requestAnimationFrame(runAnimationLoop);
    };
    
    // Start the animation loop immediately
    scrollAnimationRef.current = requestAnimationFrame(runAnimationLoop);
    
    // Clean up on unmount
    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
    };
  }, [joystickPosition]);

  const handleScrollFromJoystick = (yPosition: number) => {
    // Early return only if scrolling is explicitly disabled
    if (isScrollingEnabled === false) return;
    
    // Don't scroll on certain pages where native scrolling is preferred
    const currentPath = window.location.pathname;
    if (currentPath.includes('/comments/')) {
      return; // Don't use joystick scrolling on comments page
    }
    
    // Constants for calculations
    const maxYPosition = 40; // Maximum expected joystick movement
    
    // Normalize joystick position to get values between -1 and 1
    const normalizedPosition = yPosition / maxYPosition;
    const direction = Math.sign(normalizedPosition);
    
    // Boundary detection
    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    const maxScroll = scrollHeight - clientHeight;
    
    // Prevent scrolling past boundaries
    if ((direction < 0 && scrollTop <= 0) || (direction > 0 && scrollTop >= maxScroll - 10)) {
      return;
    }
    
    // Determine if this is a strong or light movement
    const isStrongMovement = Math.abs(normalizedPosition) > 0.5;
    
    if (isStrongMovement) {
      // For strong movements, use post-by-post navigation
      handlePostByPostScrolling(direction);
    } else {
      // For lighter movements, use continuous scrolling with adaptive speed
      // Use a non-linear curve for better control
      const intensity = Math.pow(Math.abs(normalizedPosition), 1.5); 
      
      // Adaptive base speed - slower when near posts
      const isNearPost = checkIfNearPost();
      const baseScrollSpeed = isNearPost ? 150 : 200;
      
      // Calculate final scroll speed
      const scrollSpeed = direction * intensity * baseScrollSpeed;
      
      // Perform the scroll with smoother behavior
      window.scrollBy({
        top: scrollSpeed,
        behavior: 'auto' // Use 'auto' for responsive feel
      });
    }
    
    // Update the joystick visual position
    if (joystickRef.current) {
      (joystickRef.current as HTMLDivElement).style.transform = 
        `translate3d(${joystickPosition.x}px, ${yPosition}px, 0) rotate(${rotationDegree.current}deg)`;
    }
    
    // Store scroll position for momentum calculations
    lastScrollPosition.current = window.scrollY;
    
    // Update direction indicators
    updateDirectionIndicators(yPosition);
  };

  // Check if we're near a post to adjust scrolling speed
  const checkIfNearPost = () => {
    const viewportCenter = window.innerHeight / 2;
    const elements = document.elementsFromPoint(window.innerWidth / 2, viewportCenter);
    
    // Find the first element that could be a content item
    const contentSelectors = [
      '[data-post-id]', '.post-item', '.clip-item', 
      '.streamer-card', '.video-card', '.content-card',
      'article', '.feed-item', '.list-item'
    ];
    
    const contentItem = elements.find(el => {
      return contentSelectors.some(selector => {
        return el.matches(selector) || el.closest(selector);
      });
    });
    
    if (!contentItem) return false;
    
    // If found, check how close to center
    const targetElement = contentItem.matches(contentSelectors.join(',')) 
      ? contentItem 
      : contentItem.closest(contentSelectors.join(','));
      
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      
      // If we're within 50px of the element center, consider it "near"
      return Math.abs(elementCenter - viewportCenter) < 50;
    }
    
    return false;
  };

  // Handle post-by-post navigation
  const handlePostByPostScrolling = (direction: number) => {
    // Find all scrollable elements using a broad range of selectors
    const allScrollableSelectors = [
      '[data-post-id]', // Main post items
      '.post-item',      // Post items 
      '.clip-item',      // Clip items
      '.streamer-card',  // Streamer cards
      '.video-card',     // Video cards
      '.clickable-card', // Generic clickable cards
      '.feed-item',      // Feed items
      '.list-item',      // List items
      'article',         // Articles
      '.content-card'    // Content cards
    ];
    
    const selector = allScrollableSelectors.join(', ');
    const elementList = Array.from(document.querySelectorAll(selector));
    
    // If no suitable elements are found, fall back to regular scrolling
    if (elementList.length === 0) {
      const scrollAmount = direction * window.innerHeight * 0.7;
      window.scrollBy({
        top: scrollAmount,
        behavior: 'smooth'
      });
      return;
    }
    
    // Find the element closest to the center of the viewport
    const viewportCenter = window.innerHeight / 2;
    const visibleElements = elementList.filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    });
    
    if (visibleElements.length === 0) return;
    
    // Sort by distance from the center of the viewport
    visibleElements.sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      const centerA = rectA.top + rectA.height / 2;
      const centerB = rectB.top + rectB.height / 2;
      return Math.abs(centerA - viewportCenter) - Math.abs(centerB - viewportCenter);
    });
    
    // Get the closest element
    const currentElement = visibleElements[0];
    const currentIndex = elementList.indexOf(currentElement);
    
    // Determine the target element
    let targetIndex = currentIndex + direction;
    
    // Ensure the target index is within bounds
    if (targetIndex < 0) targetIndex = 0;
    if (targetIndex >= elementList.length) targetIndex = elementList.length - 1;
    
    // If we're already at the edge, don't try to scroll further
    if (targetIndex === currentIndex) return;
    
    // Get the target element and scroll to it
    const targetElement = elementList[targetIndex];
    scrollToElement(targetElement);
  };
  
  // Helper function to scroll to a specific element
  const scrollToElement = (element: Element) => {
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const elementTop = rect.top + window.scrollY;
    const elementCenter = elementTop + rect.height / 2;
    const windowCenter = window.innerHeight / 2;
    const scrollTarget = elementCenter - windowCenter;
    
    // Smooth scroll to the element
    window.scrollTo({
      top: scrollTarget,
      behavior: 'smooth'
    });
    
    // Visual feedback for selection
    element.classList.add('joystick-selected-item');
    setTimeout(() => {
      element.classList.remove('joystick-selected-item');
    }, 800);
    
    // Update current post ID if available
    const postId = element.getAttribute('data-post-id');
    if (postId && typeof setCurrentPostId === 'function') {
      setCurrentPostId(postId);
    }
  };

  // Joystick movement handlers
  const handleJoystickMouseDown = (e: React.MouseEvent) => {
    // Prevent default actions and bubbling
    e.preventDefault();
    e.stopPropagation();
    
    // Start dragging and record initial position
    setIsDragging(true);
    startYRef.current = e.clientY;
    
    // Clear any existing animations
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
  };
  
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    // Prevent default actions and bubbling
    e.preventDefault();
    e.stopPropagation();
    
    // Start dragging and record initial position
    setIsDragging(true);
    startYRef.current = e.touches[0].clientY;
    
    // Clear any existing animations
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
  };
  
  const handleJoystickMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    // Prevent default actions and bubbling
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate position and constrain to joystick range
    const deltaY = e.clientY - startYRef.current;
    const constrainedY = Math.max(-40, Math.min(40, deltaY));
    
    // Update joystick position state
    setJoystickPosition(prev => ({ ...prev, y: constrainedY }));
    
    // Handle scrolling directly
    handleScrollFromJoystick(constrainedY);
    
    // Calculate joystick rotation based on movement
    const angle = constrainedY * 0.75; // Max 30 degrees rotation
    rotationDegree.current = angle;
  };
  
  const handleJoystickTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    // Prevent default actions and bubbling
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate position and constrain to joystick range
    const deltaY = e.touches[0].clientY - startYRef.current;
    const constrainedY = Math.max(-40, Math.min(40, deltaY));
    
    // Update joystick position
    setJoystickPosition(prev => ({ ...prev, y: constrainedY }));
    
    // Handle scrolling directly
    handleScrollFromJoystick(constrainedY);
    
    // Calculate rotation based on movement
    const angle = constrainedY * 0.75; // Max 30 degrees rotation
    rotationDegree.current = angle;
  };
  
  const handleJoystickMouseUp = () => {
    if (!isDragging) return;
    resetJoystick();
  };
  
  const handleJoystickTouchEnd = () => {
    if (!isDragging) return;
    resetJoystick();
  };
  
  // Reset joystick position and visual effects
  const resetJoystick = () => {
    // Only reset if we were dragging
    if (!isDragging) return;
    
    // Reset dragging state
    setIsDragging(false);
    
    // Reset joystick position with smooth animation
    setJoystickPosition({ x: 0, y: 0 });
    rotationDegree.current = 0;
    
    // Apply the transform directly for immediate visual feedback
    if (joystickRef.current) {
      joystickRef.current.style.transform = 'translate3d(0px, 0px, 0) rotate(0deg)';
    }
    
    // Reset direction indicators
    const indicators = document.querySelectorAll('.direction-indicator');
    indicators.forEach(indicator => {
      indicator.classList.remove('active', 'disabled');
      (indicator as HTMLElement).style.setProperty('--intensity', '0%');
    });
    
    // If we were scrolling to a specific element, make sure it completes
    const viewportCenter = window.innerHeight / 2;
    const elements = document.elementsFromPoint(window.innerWidth / 2, viewportCenter);
    
    // Find the first element that could be a content item
    const contentSelectors = [
      '[data-post-id]', '.post-item', '.clip-item', 
      '.streamer-card', '.video-card', '.content-card',
      'article', '.feed-item', '.list-item'
    ];
    
    const contentItem = elements.find(el => {
      return contentSelectors.some(selector => {
        return el.matches(selector) || el.closest(selector);
      });
    });
    
    // If we found a content item, make sure it's properly centered
    if (contentItem) {
      const targetElement = contentItem.matches(contentSelectors.join(',')) 
        ? contentItem 
        : contentItem.closest(contentSelectors.join(','));
        
      if (targetElement) {
        // Get its position
        const rect = targetElement.getBoundingClientRect();
        const elementCenter = rect.top + rect.height / 2;
        
        // If it's far from center, scroll to center it
        if (Math.abs(elementCenter - viewportCenter) > 20) {
          scrollToElement(targetElement);
        }
      }
    }
  };

  // Update direction indicators to provide visual feedback
  const updateDirectionIndicators = (yPosition: number) => {
    const upArrow = document.querySelector('.direction-up');
    const downArrow = document.querySelector('.direction-down');
    
    if (!upArrow || !downArrow) return;
    
    // Clear existing classes
    upArrow.classList.remove('active');
    downArrow.classList.remove('active');
    upArrow.classList.remove('disabled');
    downArrow.classList.remove('disabled');
    
    // Add active class based on joystick position
    if (yPosition < -5) {
      upArrow.classList.add('active');
    } else if (yPosition > 5) {
      downArrow.classList.add('active');
    }
    
    // Check if we can scroll further in each direction
    const isAtPageTop = window.scrollY <= 5;
    const isAtPageBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 5;
    
    // Disable indicators if we can't scroll further
    if (isAtPageTop) {
      upArrow.classList.add('disabled');
    }
    
    if (isAtPageBottom) {
      downArrow.classList.add('disabled');
    }
    
    // Get intensity based on joystick position for visual feedback
    const normalizedY = Math.min(Math.abs(yPosition) / 40, 1);
    const intensity = Math.round(normalizedY * 100);
    
    // Add visual intensity indicator
    if (yPosition < -5) {
      (upArrow as HTMLElement).style.setProperty('--intensity', `${intensity}%`);
      (downArrow as HTMLElement).style.setProperty('--intensity', '0%');
    } else if (yPosition > 5) {
      (downArrow as HTMLElement).style.setProperty('--intensity', `${intensity}%`);
      (upArrow as HTMLElement).style.setProperty('--intensity', '0%');
    } else {
      (upArrow as HTMLElement).style.setProperty('--intensity', '0%');
      (downArrow as HTMLElement).style.setProperty('--intensity', '0%');
    }
  };

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
      const isSinglePostPage = window.location.pathname.includes('/post/');
      if (isSinglePostPage) {
        // Extract post ID from URL
        const match = window.location.pathname.match(/\/post\/([^\/]+)/);
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

  // Handle menu navigation with D-pad
  const handleMenuNavigation = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!menuOpen) {
      setMenuOpen(true);
      return;
    }
    
    if (direction === 'up' && selectedOptionIndex > 0) {
      setSelectedOptionIndex(selectedOptionIndex - 1);
    } else if (direction === 'down' && selectedOptionIndex < navigationOptions.length - 1) {
      setSelectedOptionIndex(selectedOptionIndex + 1);
    }
  };

  // Toggle menu open/closed
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Handle select button press
  const handleSelectButton = () => {
    // Optional: Add select button functionality
    console.log('Select button pressed');
  };

  // Handle start button press
  const handleStartButton = () => {
    // Optional: Add start button functionality
    console.log('Start button pressed');
  };

  // Handle selecting a menu option
  const handleMenuSelect = (optionId: string) => {
    if (!menuOpen) return;
    
    const option = navigationOptions.find(opt => opt.id === optionId);
    if (option) {
      navigate(option.path);
      setMenuOpen(false);
    }
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
                className="gameboy-container"
                onMouseDown={handleJoystickMouseDown}
                onTouchStart={handleJoystickTouchStart}
                onMouseMove={handleJoystickMouseMove}
                onTouchMove={handleJoystickTouchMove}
                onMouseUp={handleJoystickMouseUp}
                onTouchEnd={handleJoystickTouchEnd}
                onMouseLeave={handleJoystickMouseUp}
              >
                <div className="joystick-controls">
                  {/* Base shadow for 3D effect */}
                  <div className="joystick-base-shadow"></div>
                  
                  {/* Main base of joystick */}
                  <div className="joystick-base" ref={baseRef}>
                    
                    {/* Joystick handle */}
                    <div 
                      className="joystick-handle"
                      ref={joystickRef}
                      style={{
                        transform: `translate3d(${joystickPosition.x}px, ${joystickPosition.y}px, 0) rotate(${rotationDegree.current}deg)`,
                      }}
                    >
                      <div className="joystick-center"></div>
                    </div>
                  </div>
                </div>
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
                <span className="absolute inset-[2px] bg-[#0D0D18] rounded-full"></span>
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
