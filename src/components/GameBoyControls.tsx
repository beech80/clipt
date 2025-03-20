import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useAuth } from '../hooks/useAuth';
import './gameboy-controller.css';
import './joystick-animations.css';
import CommentModal from './comments/CommentModal';
import { toast } from 'sonner';
import {
  Heart,
  MessageCircle,
  Camera,
  Award,
  Bell,
  Settings,
  Menu,
  User,
  UserCheck,
  UserPlus,
  Video,
  Trophy,
  Monitor,
  Users,
  Grid,
  Compass,
  Share
} from 'lucide-react';
import { 
  FiSettings, 
  FiUser, 
  FiBell, 
  FiVideo, 
  FiMessageCircle, 
  FiAward, 
  FiUsers, 
  FiMonitor,
  FiChevronRight
} from 'react-icons/fi';

interface GameBoyControlsProps {
  currentPostId?: string;
}

const GameBoyControls: React.FC<GameBoyControlsProps> = ({ currentPostId: propCurrentPostId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const supabase = useSupabaseClient();
  const { user } = useAuth();
  const [currentPath, setCurrentPath] = useState(location.pathname);
  const [currentPostId, setCurrentPostId] = useState<string | null>(propCurrentPostId || null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedMenuOption, setSelectedMenuOption] = useState<string | null>(null);
  const [navigationOptions] = useState([
    { id: 'clips', name: 'Clipts', icon: <Grid size={18} />, path: '/' },
    { id: 'top-clipts', name: 'Top Clipts', icon: <Trophy size={18} />, path: '/top-clipts' },
    { id: 'squads-clipts', name: 'Squads Clipts', icon: <Users size={18} />, path: '/squads' },
    { id: 'profile', name: 'Profile', icon: <User size={18} />, path: '/profile' },
    { id: 'messages', name: 'Messages', icon: <MessageCircle size={18} />, path: '/messages' },
  ]);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | undefined>(undefined);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [currentPostCreatorId, setCurrentPostCreatorId] = useState<string | null>(null);
  const [rotationDegree, setRotationDegree] = useState<number>(0);
  
  // D-pad states
  const [dPadDirection, setDPadDirection] = useState({ x: 0, y: 0 });
  const [isDPadPressed, setIsDPadPressed] = useState(false);
  const dPadRef = useRef<HTMLDivElement | null>(null);
  const baseRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const scrollAnimationRef = useRef<number | null>(null); // For animation frame
  const lastScrollPosition = useRef<number | null>(null); // For momentum scrolling
  const lastPostIndexRef = useRef<number>(-1); // Track the last post we interacted with
  const startYRef = useRef<number>(0); // Track the start Y position of D-pad
  
  // Helper function to log to debug (console only)
  const logToDebug = (message: string) => {
    console.log(message);
  };
  
  // Effect to close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  useEffect(() => {
    // Detect when the user manually scrolls the page to keep D-pad in sync
    const handleWindowScroll = () => {
      // Only track manual scrolling when the D-pad is not in use
      if (!isDPadPressed && typeof lastScrollPosition.current === 'number') {
        // Store the updated scroll position
        lastScrollPosition.current = window.scrollY;
      }
    };

    // Add scroll event listener for synchronization
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
    };
  }, [isDPadPressed]);

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
    let lastDPadDirection = 0;
    
    const runAnimationLoop = () => {
      // Calculate delta time for smoother animation
      if (!lastScrollY) lastScrollY = window.scrollY;
      const deltaTime = (window.scrollY - lastScrollY) / 16.67; // Normalize to 60fps
      lastScrollY = window.scrollY;
      
      // Get current D-pad Y position directly
      let yPosition = dPadDirection.y;
      
      // Get position from DOM for most accurate value
      if (dPadRef.current) {
        const transform = (dPadRef.current as HTMLDivElement).style.transform;
        if (transform) {
          const match = transform.match(/translate3d\((.+?)px,\s*(.+?)px/);
          if (match && match[2]) {
            yPosition = parseFloat(match[2]);
          }
        }
      }
      
      // Always perform scrolling when there's vertical movement, even if not dragging
      // This is crucial for responsive D-pad control
      if (Math.abs(yPosition) > 1.5) {
        handleScrollFromDPad(yPosition);
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
  }, [dPadDirection]);

  const handleScrollFromDPad = (yPosition: number) => {
    // Early return only if scrolling is explicitly disabled
    if (isDPadPressed === false) return;
    
    // Don't scroll on certain pages where native scrolling is preferred
    const currentPath = window.location.pathname;
    if (currentPath.includes('/comments/')) {
      return; // Don't use D-pad scrolling on comments page
    }
    
    // Constants for calculations
    const maxYPosition = 40; // Maximum expected D-pad movement
    
    // Normalize D-pad position to get values between -1 and 1
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
    
    // Update the D-pad visual position
    if (dPadRef.current) {
      (dPadRef.current as HTMLDivElement).style.transform = 
        `translate3d(${dPadDirection.x}px, ${yPosition}px, 0) rotate(${rotationDegree}deg)`;
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

  // D-pad movement handlers
  const handleDPadMouseDown = (e: React.MouseEvent) => {
    // Prevent default actions and bubbling
    e.preventDefault();
    e.stopPropagation();
    
    // Start pressing and record initial position
    setIsDPadPressed(true);
    startYRef.current = e.clientY;
    
    // Clear any existing animations
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
  };
  
  const handleDPadMouseMove = (e: React.MouseEvent) => {
    if (!isDPadPressed) return;
    
    // Prevent default actions and bubbling
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate position and constrain to D-pad range
    const deltaY = e.clientY - startYRef.current;
    const constrainedY = Math.max(-40, Math.min(40, deltaY));
    
    // Update D-pad position state
    setDPadDirection(prev => ({ ...prev, y: constrainedY }));
    
    // Handle scrolling directly
    handleScrollFromDPad(constrainedY);
    
    // Calculate D-pad rotation based on movement
    const angle = constrainedY * 0.75; // Max 30 degrees rotation
    setRotationDegree(angle);
  };
  
  const handleDPadMouseUp = () => {
    if (!isDPadPressed) return;
    resetDPad();
  };

  // Reset D-pad position and visual effects
  const resetDPad = () => {
    // Only reset if we were pressing
    if (!isDPadPressed) return;
    
    // Reset pressing state
    setIsDPadPressed(false);
    
    // Reset D-pad position with smooth animation
    setDPadDirection({ x: 0, y: 0 });
    setRotationDegree(0);
    
    // Apply the transform directly for immediate visual feedback
    if (dPadRef.current) {
      dPadRef.current.style.transform = 'translate3d(0px, 0px, 0) rotate(0deg)';
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
    
    // Add active class based on D-pad position
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
    
    // Get intensity based on D-pad position for visual feedback
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
    if (!isMenuOpen) {
      setIsMenuOpen(true);
      return;
    }
    
    if (direction === 'up' && selectedMenuOption !== null && menuOptions.findIndex(option => option.id === selectedMenuOption) > 0) {
      setSelectedMenuOption(menuOptions[menuOptions.findIndex(option => option.id === selectedMenuOption) - 1].id);
    } else if (direction === 'down' && selectedMenuOption !== null && menuOptions.findIndex(option => option.id === selectedMenuOption) < menuOptions.length - 1) {
      setSelectedMenuOption(menuOptions[menuOptions.findIndex(option => option.id === selectedMenuOption) + 1].id);
    }
  };

  // Toggle menu open/closed
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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
    if (!isMenuOpen) return;
    
    const option = menuOptions.find(opt => opt.id === optionId);
    if (option) {
      option.action();
      setIsMenuOpen(false);
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
  
  // Add handlers for D-pad
  const handleDPadDirection = (direction: 'up' | 'down' | 'left' | 'right') => {
    console.log(`D-pad pressed: ${direction}`);
    setIsDPadPressed(true);
    
    switch (direction) {
      case 'up':
        setDPadDirection({ x: 0, y: -20 });
        handleScrollFromJoystick(-30);
        break;
      case 'down':
        setDPadDirection({ x: 0, y: 20 });
        handleScrollFromJoystick(30);
        break;
      case 'left':
        setDPadDirection({ x: -20, y: 0 });
        // Navigate back in history
        if (window.history.length > 1) {
          navigate(-1);
        }
        break;
      case 'right':
        setDPadDirection({ x: 20, y: 0 });
        // Handle right navigation - could be used for next/forward
        if (currentPostId) {
          // For example, navigate to next post if available
          const allPosts = Array.from(document.querySelectorAll('[data-post-id]'));
          const currentIndex = allPosts.findIndex(post => post.getAttribute('data-post-id') === currentPostId);
          if (currentIndex !== -1 && currentIndex < allPosts.length - 1) {
            const nextPost = allPosts[currentIndex + 1];
            const nextPostId = nextPost.getAttribute('data-post-id');
            if (nextPostId) {
              handleScrollToPost(nextPostId);
            }
          }
        }
        break;
      default:
        break;
    }
  };

  // Handle scrolling based on joystick input
  const handleScrollFromJoystick = (amount: number) => {
    // Don't scroll on certain pages like comments
    if (window.location.pathname.includes('/comments')) {
      return;
    }

    // Determine if we should do post-by-post navigation or smooth scrolling
    // For larger movements (higher amount), do post-by-post
    if (Math.abs(amount) > 25) {
      const direction = amount > 0 ? 1 : -1;
      handlePostByPostScrolling(direction);
    } else {
      // For smaller movements, do smooth scrolling
      const scrollAmount = amount * 5; // Adjust multiplier for scrolling speed
      startScrollAnimation(scrollAmount);
    }
  };

  // Handler for the main CLIPT button in the center
  const handleMainButtonClick = () => {
    // Navigate to Squads Clipts page
    navigate('/squad-clipts');
  };

  // Handlers for the select and start buttons
  const handleSelectPress = () => {
    // Menu button opens menu
    toggleMenu();
  };

  const handleStartPress = () => {
    // Camera button navigates to post creation page
    navigate('/post/new');
  };

  // Handlers for the action buttons
  const handleXButtonPress = () => {
    // Comment functionality
    console.log('X button pressed - Comment');
    handleCommentClick();
  };

  const handleYButtonPress = () => {
    // Trophy/Achievement functionality
    console.log('Y button pressed - Trophy');
    handleFollowButtonPress();
  };

  // Menu options
  const menuOptions = [
    { 
      id: 'settings', 
      name: 'Settings', 
      description: 'Game preferences',
      icon: <FiSettings />, 
      action: () => navigate('/settings') 
    },
    { 
      id: 'profile', 
      name: 'Profile', 
      description: 'View your profile',
      icon: <FiUser />, 
      action: () => navigate('/profile') 
    },
    { 
      id: 'notifications', 
      name: 'Notifications', 
      description: 'Your notifications',
      icon: <FiBell />, 
      action: () => navigate('/notifications') 
    },
    { 
      id: 'streaming', 
      name: 'Streaming', 
      description: 'Live gameplay',
      icon: <FiVideo />, 
      action: () => navigate('/streaming') 
    },
    { 
      id: 'messages', 
      name: 'Messages', 
      description: 'Chat with players',
      icon: <FiMessageCircle />, 
      action: () => navigate('/messages') 
    },
    { 
      id: 'top-clipts', 
      name: 'Top Clipts', 
      description: 'Hall of fame',
      icon: <FiAward />, 
      action: () => navigate('/top-clipts') 
    },
    { 
      id: 'squads-clipts', 
      name: 'Squads Clipts', 
      description: 'Your squads clipts',
      icon: <FiUsers />, 
      action: () => navigate('/squads') 
    },
    { 
      id: 'clipts', 
      name: 'Clipts', 
      description: 'View all clipts',
      icon: <FiMonitor />, 
      action: () => navigate('/') 
    }
  ];

  const isDPadActive = (direction: 'up' | 'down' | 'left' | 'right') => {
    switch (direction) {
      case 'up':
        return dPadDirection.y < -5;
      case 'down':
        return dPadDirection.y > 5;
      case 'left':
        return dPadDirection.x < -5;
      case 'right':
        return dPadDirection.x > 5;
      default:
        return false;
    }
  };

  const handleDPadTouchEnd = () => {
    setIsDPadPressed(false);
  };

  const handleCameraClick = () => {
    console.log('Camera clicked');
    navigate('/post/new');
  };

  const handleAButtonPress = () => {
    console.log('A button pressed - Comment');
    handleCommentClick();
  };

  const handleBButtonPress = () => {
    console.log('B button pressed - Like');
    setHasLiked(!hasLiked);
    handleLikeClick();
  };

  const handleFollowButtonPress = () => {
    console.log('Follow button pressed');
    setIsFollowing(!isFollowing);
    handleFollowClick();
  };

  const handleLikeClick = async () => {
    if (!user || !currentPostId) {
      toast.error("Login to like this clip");
      return;
    }
    // Like logic
    if (likeLoading) return;
    setLikeLoading(true);
    
    try {
      const response = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', user.id)
        .eq('post_id', currentPostId)
        .single();
      
      if (response.data) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', currentPostId);
        
        setHasLiked(false);
        toast.success("Removed like");
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            post_id: currentPostId,
          });
        
        setHasLiked(true);
        toast.success("Liked the clip!");
      }
      
      // Invalidate posts query to update like count
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error("Failed to like the clip");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleFollowClick = () => {
    if (!user || !currentPostCreatorId) {
      toast.error("Login to follow this user");
      return;
    }
    
    if (followLoading) return;
    setFollowLoading(true);
    
    try {
      if (isFollowing) {
        // Unfollow logic
        console.log(`Unfollowing user ${currentPostCreatorId}`);
        setIsFollowing(false);
        toast.success("Unfollowed user");
      } else {
        // Follow logic
        console.log(`Following user ${currentPostCreatorId}`);
        setIsFollowing(true);
        toast.success("Following user");
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error("Failed to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCommentClick = () => {
    if (!user || !currentPostId) {
      toast.error("Login to comment on this clip");
      return;
    }
    
    setCommentModalOpen(true);
  };

  // Your return JSX - the UI for the GameBoy controller
  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="game-boy-controls">
          {/* D-Pad */}
          <div className="d-pad-container">
            <div className="d-pad" ref={dPadRef}>
              <div className="d-pad-ring"></div>
              <button
                className={`d-pad-up ${isDPadActive('up') ? 'active' : ''}`}
                onClick={() => handleDPadDirection('up')}
                onTouchStart={() => handleDPadDirection('up')}
                onTouchEnd={handleDPadTouchEnd}
              ></button>
              <button
                className={`d-pad-right ${isDPadActive('right') ? 'active' : ''}`}
                onClick={() => handleDPadDirection('right')}
                onTouchStart={() => handleDPadDirection('right')}
                onTouchEnd={handleDPadTouchEnd}
              ></button>
              <button
                className={`d-pad-down ${isDPadActive('down') ? 'active' : ''}`}
                onClick={() => handleDPadDirection('down')}
                onTouchStart={() => handleDPadDirection('down')}
                onTouchEnd={handleDPadTouchEnd}
              ></button>
              <button
                className={`d-pad-left ${isDPadActive('left') ? 'active' : ''}`}
                onClick={() => handleDPadDirection('left')}
                onTouchStart={() => handleDPadDirection('left')}
                onTouchEnd={handleDPadTouchEnd}
              ></button>
            </div>
          </div>

          {/* Center Section */}
          <div className="center-section">
            <button className="main-button" onClick={handleMainButtonClick}>
              <span>CLIPT</span>
            </button>
            <div className="select-start-buttons">
              <button className="select-button" onClick={handleSelectPress}>
                <Menu size={16} />
              </button>
              <button className="start-button" onClick={handleStartPress}>
                <Camera size={16} />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button 
              className={`action-button a-button ${hasLiked ? 'active' : ''}`} 
              onClick={handleAButtonPress}
            >
              <Heart size={20} />
            </button>
            <button 
              className={`action-button b-button ${currentPostId ? '' : ''}`} 
              onClick={handleBButtonPress}
            >
              <Award size={20} />
            </button>
            <button 
              className={`action-button x-button ${commentModalOpen ? 'active' : ''}`} 
              onClick={handleXButtonPress}
            >
              <MessageCircle size={20} />
            </button>
            <button 
              className={`action-button y-button ${isFollowing ? 'active' : ''}`}
              onClick={handleYButtonPress}
            >
              <Trophy size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Menu Modal */}
      {isMenuOpen && (
        <div className="menu-modal" onClick={() => setIsMenuOpen(false)}>
          <div className="menu-container" onClick={(e) => e.stopPropagation()}>
            <div className="menu-header">
              <div className="menu-title">Game Menu</div>
              <button className="close-menu" onClick={() => setIsMenuOpen(false)}>×</button>
            </div>
            <div className="menu-options">
              {menuOptions.map((option) => (
                <div
                  key={option.id}
                  className={`menu-option ${selectedMenuOption === option.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedMenuOption(option.id);
                    option.action();
                    setIsMenuOpen(false);
                  }}
                >
                  <div className="menu-option-icon">{option.icon}</div>
                  <div className="menu-option-content">
                    <div className="menu-option-title">{option.name}</div>
                    <div className="menu-option-description">{option.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Comment Modal */}
      {commentModalOpen && currentPostId && (
        <CommentModal 
          postId={currentPostId} 
          onClose={() => setCommentModalOpen(false)}
          isOpen={commentModalOpen}
        />
      )}
    </>
  );
};

export default GameBoyControls;
