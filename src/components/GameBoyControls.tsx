import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import './gameboy-controller.css';
import './joystick-animations.css';
import CommentModal from './comments/CommentModal';
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
  Share,
  Bookmark
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

// Define the direction indicators interface to include limitReached
interface DirectionIndicatorValues {
  x: number;
  y: number;
  limitReached?: 'top' | 'bottom' | 'none';
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
    { id: 'squads-clipts', name: 'Squads Clipts', icon: <Users size={18} />, path: '/squads-clipts' },
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
  const [inCollection, setInCollection] = useState(false);
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
  const startXRef = useRef<number>(0); // Track the start X position of D-pad
  const dPadCenterXRef = useRef<number | null>(null);
  const dPadCenterYRef = useRef<number | null>(null);
  const currentScrollSpeed = useRef<number>(0);

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

  // Check if post is in collection initially
  useEffect(() => {
    const checkCollection = async () => {
      if (!user || !currentPostId) return;
      
      try {
        const { data, error } = await supabase
          .from('collections')
          .select('id')
          .eq('user_id', user.id)
          .eq('post_id', currentPostId);
          
        if (error) {
          console.error('Error checking collection status:', error);
          return;
        }
        
        setInCollection(data && data.length > 0);
      } catch (err) {
        console.error('Failed to check collection status:', err);
      }
    };
    
    checkCollection();
  }, [user, currentPostId]);

  // Handler for animation frame - apply scrolling effect
  const handleAnimationFrame = () => {
    // Don't animate on comments page
    if (window.location.pathname.includes('/comments')) {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
        scrollAnimationRef.current = null;
      }
      return;
    }
    
    // Get current Y position if available
    const yPosition = dPadDirection.y;
    
    if (Math.abs(yPosition) > 1.5) {
      // Calculate scroll speed based on joystick position
      // Use non-linear curve for more precise control
      const normalizedPosition = yPosition / 40; // Normalize to -1 to 1 range
      
      // Calculate a non-linear curve for better small movement control
      const scrollFactor = Math.pow(Math.abs(normalizedPosition), 1.5) * Math.sign(normalizedPosition);
      
      // Faster scrolling for larger movements, slower for precise movements
      const scrollAmount = scrollFactor * 15;
      
      // Always perform scrolling when there's vertical movement
      // This ensures responsive joystick control
      window.scrollBy(0, scrollAmount);
      
      // Check boundaries to prevent scrolling past content
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const maxScroll = scrollHeight - clientHeight;
      
      // Prevent scrolling past top or bottom
      if ((scrollAmount < 0 && scrollTop <= 0) || 
          (scrollAmount > 0 && scrollTop >= maxScroll - 10)) {
        // At boundary - stop animation
        if (scrollAnimationRef.current) {
          cancelAnimationFrame(scrollAnimationRef.current);
          scrollAnimationRef.current = null;
        }
        return;
      }
    }
    
    // Continue animation loop
    scrollAnimationRef.current = requestAnimationFrame(handleAnimationFrame);
  };

  // Make the animation loop start when dpad is used
  useEffect(() => {
    // Start animation when dpad position changes
    if (Math.abs(dPadDirection.y) > 1.5 && !scrollAnimationRef.current) {
      scrollAnimationRef.current = requestAnimationFrame(handleAnimationFrame);
    }
    
    return () => {
      // Cleanup only if component unmounts
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
        scrollAnimationRef.current = null;
      }
    };
  }, [dPadDirection]);

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
      // Increase scrolling speed to make it more responsive
      const scrollAmount = amount * 8; // Increased from 5 to 8 for faster scrolling
      
      // Apply scroll directly for immediate response
      window.scrollBy({
        top: scrollAmount,
        behavior: 'auto'
      });
      
      // Check if we're at the boundaries
      const scrollPosition = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      
      // Update visual indicators if at boundaries
      if (scrollPosition <= 0 && amount < 0) {
        // At top and trying to scroll up
        updateDirectionIndicators({ x: 0, y: -20, limitReached: 'top' });
      } else if (scrollPosition >= maxScroll - 5 && amount > 0) {
        // At bottom and trying to scroll down
        updateDirectionIndicators({ x: 0, y: 20, limitReached: 'bottom' });
      }
    }
  };

  // D-pad movement handlers
  const handleDPadMouseDown = (e: React.MouseEvent) => {
    // Prevent default actions and bubbling
    e.preventDefault();
    e.stopPropagation();
    
    // Start pressing and record initial position
    setIsDPadPressed(true);
    
    // Calculate the D-pad center
    if (dPadRef.current) {
      const rect = dPadRef.current.getBoundingClientRect();
      dPadCenterXRef.current = rect.left + rect.width / 2;
      dPadCenterYRef.current = rect.top + rect.height / 2;
      
      // Add pressed class for visual feedback
      dPadRef.current.classList.add('pressed');
    }
    
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
    
    // Calculate position relative to center
    const deltaX = e.clientX - dPadCenterXRef.current;
    const deltaY = e.clientY - dPadCenterYRef.current;
    
    // Calculate distance from center
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Constrain to maximum displacement
    const MAX_DISPLACEMENT = 40;
    const ratio = Math.min(1, MAX_DISPLACEMENT / distance);
    
    // Calculate constrained position
    const constrainedX = deltaX * ratio;
    const constrainedY = deltaY * ratio;
    
    // Update D-pad position state
    setDPadDirection({ x: constrainedX, y: constrainedY });
    
    // Update visual position
    if (dPadRef.current) {
      dPadRef.current.style.transform = `translate3d(${constrainedX/3}px, ${constrainedY/3}px, 0)`;
    }
    
    // Handle scrolling directly for Y movement
    if (Math.abs(constrainedY) > 5) {
      const scrollAmount = constrainedY * 0.5;
      handleScrollFromJoystick(scrollAmount);
    }
  };
  
  const handleDPadMouseUp = (e: React.MouseEvent) => {
    if (!isDPadPressed) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Reset D-pad visual state
    if (dPadRef.current) {
      dPadRef.current.classList.remove('pressed');
      dPadRef.current.style.transform = '';
    }
    
    // Stop pressing
    setIsDPadPressed(false);
    
    // Reset direction
    setDPadDirection({ x: 0, y: 0 });
  };

  const handleDPadTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Start tracking touch
    setIsDPadPressed(true);
    
    // Get the touch coordinates
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    
    // Calculate the D-pad center
    if (dPadRef.current) {
      const rect = dPadRef.current.getBoundingClientRect();
      dPadCenterXRef.current = rect.left + rect.width / 2;
      dPadCenterYRef.current = rect.top + rect.height / 2;
      
      // Visual feedback - add pressed class
      dPadRef.current.classList.add('pressed');
    }
    
    // Clear any existing animations
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
  };

  const handleDPadTouchMove = (e: React.TouchEvent) => {
    if (!isDPadPressed) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Get current touch coordinates
    const touch = e.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;
    
    // Calculate displacement from center
    const deltaX = currentX - dPadCenterXRef.current;
    const deltaY = currentY - dPadCenterYRef.current;
    
    // Calculate distance from center
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Constrain to maximum displacement
    const MAX_DISPLACEMENT = 40;
    const displacementRatio = Math.min(1, MAX_DISPLACEMENT / Math.max(1, distance));
    
    // Calculate constrained position
    const constrainedX = deltaX * displacementRatio;
    const constrainedY = deltaY * displacementRatio;
    
    // Update joystick position
    setDPadDirection({ x: constrainedX, y: constrainedY });
    
    // Update visual position - makes the joystick move visually when touched
    if (dPadRef.current) {
      dPadRef.current.style.transform = `translate3d(${constrainedX/3}px, ${constrainedY/3}px, 0)`;
    }
    
    // Handle scrolling with more sensitivity for mobile
    if (Math.abs(constrainedY) > 5) { // Lower threshold for better response
      const scrollAmount = constrainedY * 1.0; // Higher multiplier for better mobile response
      handleScrollFromJoystick(scrollAmount);
    }
    
    // Update direction indicators for visual feedback
    updateDirectionIndicators({ x: constrainedX, y: constrainedY });
  };

  const handleDPadTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Reset D-pad visual state
    if (dPadRef.current) {
      dPadRef.current.classList.remove('pressed');
      dPadRef.current.style.transform = '';
    }
    
    // Stop pressing
    setIsDPadPressed(false);
    
    // Reset direction
    setDPadDirection({ x: 0, y: 0 });
    
    // Snap to nearest post for better UX
    setTimeout(() => snapToNearestPost(), 200);
    
    // Clear direction indicators
    updateDirectionIndicators({ x: 0, y: 0, limitReached: 'none' });
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
  const updateDirectionIndicators = (values: DirectionIndicatorValues) => {
    // Get direction indicators
    const upArrow = document.querySelector('.direction-up');
    const downArrow = document.querySelector('.direction-down');
    const leftArrow = document.querySelector('.direction-left');
    const rightArrow = document.querySelector('.direction-right');
    
    if (!upArrow || !downArrow || !leftArrow || !rightArrow) return;
    
    // Clear existing classes
    upArrow.classList.remove('direction-active', 'direction-limit');
    downArrow.classList.remove('direction-active', 'direction-limit');
    leftArrow.classList.remove('direction-active', 'direction-limit');
    rightArrow.classList.remove('direction-active', 'direction-limit');
    
    // Add active class based on direction
    if (values.y < -10) {
      upArrow.classList.add('direction-active');
      
      // If we've reached the top limit
      if (values.limitReached === 'top') {
        upArrow.classList.add('direction-limit');
      }
    }
    
    if (values.x > 10) {
      rightArrow.classList.add('direction-active');
    }
    
    if (values.y > 10) {
      downArrow.classList.add('direction-active');
      
      // If we've reached the bottom limit
      if (values.limitReached === 'bottom') {
        downArrow.classList.add('direction-limit');
      }
    }
    
    if (values.x < -10) {
      leftArrow.classList.add('direction-active');
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

  // Handle post-by-post navigation
  const handlePostByPostScrolling = (direction: number) => {
    // Don't perform post scrolling on the comments page
    if (window.location.pathname.includes('/comments')) {
      return;
    }
    
    const viewportCenter = window.innerHeight / 2;
    
    // Find all potential post elements - more comprehensive selectors
    const contentSelectors = [
      '[data-post-id]', '.post-item', '.clip-item', 
      '.post-card', '.video-card', '.feed-item',
      'article', '.content-item', '.streamer-card'
    ];
    
    // Combine selectors for a more efficient query
    const allPosts = Array.from(document.querySelectorAll(contentSelectors.join(',')));
    
    if (allPosts.length === 0) {
      console.log('No posts found for post-by-post navigation');
      return;
    }
    
    // Find which post is closest to the center viewport
    let closestPost = null;
    let closestIndex = -1;
    let minDistance = Infinity;
    
    allPosts.forEach((post, index) => {
      const rect = post.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      const distance = Math.abs(elementCenter - viewportCenter);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPost = post;
        closestIndex = index;
      }
    });
    
    // If we found the closest post, find the next or previous one
    if (closestIndex !== -1) {
      // Calculate the target index based on direction
      const targetIndex = closestIndex + direction;
      
      // Make sure the target index is valid
      if (targetIndex >= 0 && targetIndex < allPosts.length) {
        const targetPost = allPosts[targetIndex];
        
        // Add a visual highlight for feedback
        targetPost.classList.add('gameboy-selected-post');
        
        // Smooth scroll to the target post
        targetPost.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        
        // If the post has a post ID, update the current post ID state
        const postId = targetPost.getAttribute('data-post-id');
        if (postId) {
          setCurrentPostId(postId);
          // Store in session for state persistence
          try {
            sessionStorage.setItem('clipt-last-selected-post', postId);
          } catch (e) {
            console.error('Failed to save post ID to session:', e);
          }
        }
        
        // Clear the visual highlight after animation completes
        setTimeout(() => {
          targetPost.classList.remove('gameboy-selected-post');
        }, 1000);
      } else {
        // If we're at the boundary, provide feedback
        if (targetIndex < 0) {
          // At first post, show top boundary reached
          updateDirectionIndicators({ x: 0, y: -20, limitReached: 'top' });
        } else {
          // At last post, show bottom boundary reached
          updateDirectionIndicators({ x: 0, y: 20, limitReached: 'bottom' });
        }
      }
    }
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

  // Handle select button press - used in the JSX
  const handleSelectPress = () => {
    handleSelectButton();
  };

  // Handle start button press - used in the JSX
  const handleStartPress = () => {
    handleStartButton();
  };

  // Handle main CLIPT button press
  const handleMainButtonClick = () => {
    console.log('Main CLIPT button pressed');
    // Navigate to home feed or toggle main menu
    navigate('/');
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
      action: () => navigate('/squads-clipts') 
    },
    { 
      id: 'clipts', 
      name: 'Clipts', 
      description: 'View all clipts (videos)',
      icon: <FiMonitor />, 
      action: () => navigate('/clipts') 
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

  const handleCameraClick = () => {
    console.log('Camera clicked');
    navigate('/post/new');
  };

  // Function to handle Collection action (B button)
  const handleCollection = async () => {
    if (!user || !currentPostId) {
      toast.error("Login to add this clip to your collection");
      return;
    }

    try {
      // Show immediate feedback
      toast.loading("Processing collection action...");
      
      // Use the Supabase client from props or hooks
      if (!supabase) {
        console.error('No Supabase client available');
        toast.error('Could not connect to database. Please try again later.');
        return;
      }
      
      // Check if the post is already in the collection
      const { data: existingCollections, error: checkError } = await supabase
        .from('collections')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', currentPostId);

      if (checkError) {
        console.error('Error checking collection status:', checkError);
        toast.error('Could not check collection status: ' + checkError.message);
        return;
      }

      if (existingCollections && existingCollections.length > 0) {
        // Post is in collection, remove it
        const { error: removeError } = await supabase
          .from('collections')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', currentPostId);

        if (removeError) {
          console.error('Error removing from collection:', removeError);
          toast.error('Could not remove from collection: ' + removeError.message);
          return;
        }

        setInCollection(false);
        toast.success('Removed from your collection');
      } else {
        // Post not in collection, add it
        const { error: addError } = await supabase
          .from('collections')
          .insert([{
            user_id: user.id,
            post_id: currentPostId,
            created_at: new Date().toISOString()
          }]);

        if (addError) {
          console.error('Error adding to collection:', addError);
          toast.error('Could not add to collection: ' + addError.message);
          return;
        }

        setInCollection(true);
        toast.success('Added to your collection!');
        
        // Refresh collections data
        queryClient.invalidateQueries(['collections']);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Collection operation failed:', error);
      toast.error(`Collection operation failed: ${errorMessage}`);
    }
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

  const handleButtonAPress = () => {
    // Green (top) button - Comments
    // This toggles the comments modal
    handleCommentClick();
  };

  const handleButtonBPress = () => {
    // Red (right) button - Collection
    handleCollection();
  };

  const handleButtonXPress = () => {
    // Blue (left) button - Like
    if (currentPostId) {
      handleLike();
    } else {
      console.log('No post selected to like');
      toast.info('Navigate to a post to like');
    }
  };

  const handleButtonYPress = () => {
    // Yellow (bottom) button - Trophy
    handleTrophy();
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

  // Function to snap to the nearest post for better UX
  const snapToNearestPost = () => {
    // Only snap if we're not on the comments page
    if (window.location.pathname.includes('/comments')) {
      return;
    }
    
    const viewportCenter = window.innerHeight / 2;
    
    // Find all potential post elements - more comprehensive selectors
    const postSelectors = [
      '[data-post-id]', '.post-item', '.clip-item', 
      '.post-card', '.video-card', '.feed-item',
      'article', '.content-item', '.streamer-card'
    ];
    
    // Combine selectors for a more efficient query
    const allPosts = Array.from(document.querySelectorAll(postSelectors.join(',')));
    
    if (allPosts.length === 0) {
      console.log('No posts found to snap to');
      return;
    }
    
    // Find the post nearest to the viewport center
    let nearestPost = null;
    let minDistance = Infinity;
    
    allPosts.forEach(post => {
      const rect = post.getBoundingClientRect();
      const postCenter = rect.top + rect.height / 2;
      const distance = Math.abs(postCenter - viewportCenter);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestPost = post;
      }
    });
    
    // Snap to the nearest post if found and not already centered
    if (nearestPost && minDistance > 10) {
      // Highlight the post for visual feedback
      nearestPost.classList.add('gameboy-selected-post');
      
      // Smooth scroll to center it
      nearestPost.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      
      // Remove highlight after animation completes
      setTimeout(() => {
        nearestPost?.classList.remove('gameboy-selected-post');
      }, 1000);
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
  const handleTrophy = () => {
    if (!user || !currentPostId) {
      toast.error("Login to give trophy");
      return;
    }
    
    // Trophy logic
    toast.success("Trophy given! 🏆");
    console.log("Trophy given to post", currentPostId);
  };

  // Your return JSX - the UI for the GameBoy controller
  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="game-boy-controls">
          {/* D-Pad */}
          <div className="d-pad-container">
            <div 
              className="d-pad" 
              ref={dPadRef} 
              onTouchStart={handleDPadTouchStart} 
              onTouchMove={handleDPadTouchMove}
              onTouchEnd={handleDPadTouchEnd}
              onMouseDown={handleDPadMouseDown}
              onMouseMove={handleDPadMouseMove}
              onMouseUp={handleDPadMouseUp}
              onMouseLeave={handleDPadMouseUp}
            >
              <div className="d-pad-ring"></div>
              <div className="joystick-indicator"></div>
              <div className="direction-indicators">
                <div className={`direction-indicator direction-up ${isDPadActive('up') ? 'direction-active' : ''}`}></div>
                <div className={`direction-indicator direction-right ${isDPadActive('right') ? 'direction-active' : ''}`}></div>
                <div className={`direction-indicator direction-down ${isDPadActive('down') ? 'direction-active' : ''}`}></div>
                <div className={`direction-indicator direction-left ${isDPadActive('left') ? 'direction-active' : ''}`}></div>
              </div>
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
              onClick={handleButtonAPress}
            >
              <MessageCircle size={20} />
            </button>
            <button 
              className={`action-button b-button ${inCollection ? 'active' : ''}`}
              onClick={handleButtonBPress}
            >
              <Bookmark size={20} />
            </button>
            <button 
              className={`action-button x-button ${commentModalOpen ? 'active' : ''}`} 
              onClick={handleButtonXPress}
            >
              <Heart size={20} />
            </button>
            <button 
              className={`action-button y-button`}
              onClick={handleButtonYPress}
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
