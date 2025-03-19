import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  Heart, 
  Camera,
  MessageCircle, 
  Trophy, 
  UserPlus, 
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
  
  // Joystick states
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false); // Track if currently scrolling
  const joystickRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const scrollAnimationRef = useRef<number | null>(null); // For animation frame
  
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
  
  // Add post detection on mount and page changes
  useEffect(() => {
    logToDebug('Setting up post detection');
    
    // Function to ensure all posts have data-post-id attributes
    const addDataAttributes = () => {
      logToDebug('Adding data-post-id attributes to posts...');
      
      // Add data-post-id to all post-container divs
      const postContainers = document.querySelectorAll('.post-container, .post-card, .post-item, [id*="post"], .post, article');
      let attributesAdded = 0;
      
      postContainers.forEach((post, index) => {
        if (!post.hasAttribute('data-post-id')) {
          // Check if the post has an ID we can use
          let postId = '';
          
          // Try to find ID from various sources
          if (post.hasAttribute('id') && post.getAttribute('id')?.includes('post')) {
            postId = post.getAttribute('id')?.replace(/post-?/i, '') || '';
          } else {
            // Look for ID in child elements
            const postIdElement = post.querySelector('[data-post-id]');
            if (postIdElement) {
              postId = postIdElement.getAttribute('data-post-id') || '';
            } else {
              // Try to find in href if there's a link to post
              const postLink = post.querySelector('a[href*="/post/"]');
              if (postLink) {
                const href = postLink.getAttribute('href') || '';
                const match = href.match(/\/post\/([^\/]+)/);
                if (match && match[1]) {
                  postId = match[1];
                }
              } else {
                // Look for hidden input fields that might contain post IDs
                const hiddenInput = post.querySelector('input[type="hidden"][name*="post"]');
                if (hiddenInput) {
                  postId = hiddenInput.getAttribute('value') || '';
                } else {
                  // Generate a temporary ID
                  postId = `temp-post-${index}-${Date.now()}`;
                }
              }
            }
          }
          
          // Set the attribute
          post.setAttribute('data-post-id', postId);
          attributesAdded++;
        }
      });
      
      logToDebug(`Added data-post-id to ${attributesAdded} posts`);
    };
    
    // Function to detect and select the most visible post
    const detectAndSelectCurrentPost = () => {
      // First ensure all posts have data-post-id
      addDataAttributes();
      
      // Check if we're on a single post page
      const isSinglePostPage = location.pathname.includes('/post/');
      if (isSinglePostPage) {
        // Extract post ID from URL
        const match = location.pathname.match(/\/post\/([^\/]+)/);
        if (match && match[1]) {
          const postId = match[1];
          logToDebug(`Single post page detected. Using post ID from URL: ${postId}`);
          setCurrentPostId(postId);
          return;
        }
      }
      
      // Find all posts on the page with multiple selectors to work across different pages
      const allPosts = Array.from(document.querySelectorAll(
        '[data-post-id], .post-container, .post-card, .post-item, [id*="post"], .post, article'
      ));
      
      if (allPosts.length === 0) {
        logToDebug('No posts found on current page');
        return;
      }
      
      logToDebug(`Found ${allPosts.length} posts on the page`);
      
      // Find the post most visible in the viewport
      let mostVisiblePost: Element | null = null;
      let maxVisibility = 0;
      
      allPosts.forEach(post => {
        const rect = post.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Skip posts that are not in the viewport at all
        if (rect.bottom < 0 || rect.top > windowHeight) {
          return;
        }
        
        // Skip very small elements (likely not actual posts)
        if (rect.height < 50) {
          return;
        }
        
        // Calculate how much of the post is visible
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(windowHeight, rect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const percentVisible = visibleHeight / rect.height;
        
        // Bonus for being in the center of the viewport
        const centerFactor = 1 - Math.abs((visibleTop + visibleBottom) / 2 - windowHeight / 2) / windowHeight;
        const visibilityScore = percentVisible * (1 + centerFactor);
        
        if (visibilityScore > maxVisibility) {
          maxVisibility = visibilityScore;
          mostVisiblePost = post;
        }
      });
      
      if (mostVisiblePost) {
        // Get the post ID - try multiple attributes
        const postId = mostVisiblePost.getAttribute('data-post-id') || 
                       mostVisiblePost.getAttribute('id')?.replace(/post-?/i, '') ||
                       mostVisiblePost.getAttribute('data-id');
        
        if (postId) {
          logToDebug(`Selected post: ${postId} (${(maxVisibility * 100).toFixed(1)}% visible)`);
          setCurrentPostId(postId);
          
          // Add a subtle indicator to the selected post
          allPosts.forEach(post => post.classList.remove('gameboy-selected-post'));
          mostVisiblePost.classList.add('gameboy-selected-post');
          
          // Store the post ID in a session variable for backup
          try {
            sessionStorage.setItem('clipt-last-selected-post', postId);
          } catch (e) {
            console.error('Failed to store post ID in session storage:', e);
          }
        }
      } else {
        logToDebug('No visible posts found');
        
        // Try to get last selected post from session storage
        try {
          const lastSelectedPost = sessionStorage.getItem('clipt-last-selected-post');
          if (lastSelectedPost) {
            logToDebug(`Using last selected post from session storage: ${lastSelectedPost}`);
            setCurrentPostId(lastSelectedPost);
          }
        } catch (e) {
          console.error('Failed to retrieve post ID from session storage:', e);
        }
      }
    };

    // Debounce function to prevent too many calls
    function debounce(func: Function, wait: number) {
      let timeout: any = null;
      return function(...args: any) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          func.apply(context, args);
        }, wait);
      };
    }
    
    // Create debounced handler with much shorter delay for better responsiveness
    // Use 50ms for more immediate responses while still preventing excessive performance impact
    const debouncedDetectPost = debounce(detectAndSelectCurrentPost, 50);
    
    // Set up scroll listener
    window.addEventListener('scroll', debouncedDetectPost, { passive: true });
    
    // Set up additional events that might indicate content changes
    window.addEventListener('click', debouncedDetectPost);
    window.addEventListener('touchend', debouncedDetectPost);
    
    // Initial detection with a shorter delay (300ms) to allow page to render but be more responsive
    setTimeout(detectAndSelectCurrentPost, 300);
    
    // Add detection on key scrolling events for immediate feedback
    window.addEventListener('scrollend', detectAndSelectCurrentPost, { passive: true });
    
    // Set up mutation observer to detect when new posts are added with optimized detection logic
    const observer = new MutationObserver((mutations) => {
      // Use a throttle flag to avoid excessive calls
      let shouldDetect = false;
      
      mutations.forEach(mutation => {
        // Only check if we haven't already decided to detect posts
        if (!shouldDetect && mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Fast check - first look at direct added nodes
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (node instanceof HTMLElement && (
                node.hasAttribute('data-post-id') || 
                node.classList.contains('post-container') ||
                node.classList.contains('post-card') ||
                node.classList.contains('post-item') ||
                node.classList.contains('post') ||
                node.id?.includes('post')
              )) {
              shouldDetect = true;
              break; // Exit early once we know we need to detect
            }
          }
        }
      });
      
      if (shouldDetect) {
        // Use requestAnimationFrame for more efficient timing on visual updates
        requestAnimationFrame(() => detectAndSelectCurrentPost());
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Add subtle styling for selected posts (more subdued than before)
    const style = document.createElement('style');
    style.innerHTML = `
      .gameboy-selected-post {
        position: relative;
        box-shadow: 0 0 0 2px rgba(108, 77, 196, 0.3) !important;
      }
      
      .button-press {
        transform: scale(0.9) !important;
        opacity: 0.8 !important;
        transition: transform 0.15s, opacity 0.15s !important;
      }
    `;
    document.head.appendChild(style);
    
    // Detect page changes
    const handlePathChange = () => {
      if (location.pathname !== currentPath) {
        setCurrentPath(location.pathname);
        // Re-detect posts after path change
        setTimeout(detectAndSelectCurrentPost, 1000);
      }
    };
    
    // Check location periodically
    const intervalId = setInterval(handlePathChange, 500);
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', debouncedDetectPost);
      window.removeEventListener('click', debouncedDetectPost);
      window.removeEventListener('touchend', debouncedDetectPost);
      observer.disconnect();
      document.head.removeChild(style);
      clearInterval(intervalId);
    };
  }, [currentPath]);
  
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
    
    // Directly update DOM for immediate response
    if (joystickRef.current) {
      // Set CSS variables for animation
      (joystickRef.current as HTMLDivElement).style.transform = `translate(${dx}px, ${dy}px)`;
      
      // Override any transitions during active dragging
      (joystickRef.current as HTMLDivElement).style.transition = 'none';
    }
    
    // Update state for React components (but DOM is already updated)
    setJoystickPosition({ x: dx, y: dy });
    
    // Immediately trigger scroll for responsive feel
    handleScrollFromJoystick(dy);
    
    // Update visual indicators for feedback
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
      
      // Add the spring animation class
      (joystickRef.current as HTMLDivElement).classList.add('joystick-spring-return');
      
      // Directly set transform for immediate visual feedback
      (joystickRef.current as HTMLDivElement).style.transform = 'translate(0px, 0px)';
      
      // Remove the animation class after it completes
      setTimeout(() => {
        if (joystickRef.current) {
          (joystickRef.current as HTMLDivElement).classList.remove('joystick-spring-return');
        }
      }, 550); // Match the animation duration
    }
    
    // Return joystick to center in state
    setJoystickPosition({ x: 0, y: 0 });
    
    // Reset indicatorswith all classes for visual cleanup
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
    
    // Remove event listeners
    window.removeEventListener('mousemove', handleJoystickMouseMove);
    window.removeEventListener('mouseup', handleJoystickMouseUp);
  };
  
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    // CRITICAL: These prevent statements were blocking touch events from registering properly
    // Allow default behavior but still stop propagation to prevent other elements from capturing the event
    // e.preventDefault(); - REMOVED
    e.stopPropagation();
    
    console.log('Touch start detected');
    setIsDragging(true);
    
    // Initial joystick movement on first touch - ENHANCED
    if (joystickRef.current && baseRef.current && e.touches[0]) {
      const baseRect = baseRef.current.getBoundingClientRect();
      const baseCenterX = baseRect.left + baseRect.width / 2;
      const baseCenterY = baseRect.top + baseRect.height / 2;
      
      // Calculate relative position
      let dx = e.touches[0].clientX - baseCenterX;
      let dy = e.touches[0].clientY - baseCenterY;
      
      // Log touch position for debugging
      console.log(`Touch position: dx=${dx}, dy=${dy}`);
      
      // Limit movement
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = baseRect.width / 3;
      if (distance > maxDistance) {
        dx = (dx / distance) * maxDistance;
        dy = (dy / distance) * maxDistance;
      }
      
      // FORCEFULLY move the joystick with no transition delay
      if (joystickRef.current) {
        (joystickRef.current as HTMLDivElement).style.transition = 'none';
        (joystickRef.current as HTMLDivElement).style.transform = `translate(${dx}px, ${dy}px)`;
        
        // Force a reflow to ensure the style changes take effect immediately
        void (joystickRef.current as HTMLDivElement).offsetWidth;
        
        console.log('Applied transform:', `translate(${dx}px, ${dy}px)`);
        
        // Add visible highlight to ensure user sees movement
        (joystickRef.current as HTMLDivElement).style.boxShadow = '0 0 15px rgba(135, 106, 245, 0.8)';
      }
      
      // Update state after DOM change for consistency
      setJoystickPosition({ x: dx, y: dy });
      
      // Immediately handle scrolling
      handleScrollFromJoystick(dy);
      updateDirectionIndicators(dy);
    }
    
    // Clean up any existing event listeners first
    window.removeEventListener('touchmove', handleJoystickTouchMove);
    window.removeEventListener('touchend', handleJoystickTouchEnd);
    
    // Add event listeners to window for touch movement and release
    // CRITICAL: passive:false allows preventDefault() in the move handler
    window.addEventListener('touchmove', handleJoystickTouchMove, { passive: false });
    window.addEventListener('touchend', handleJoystickTouchEnd);
    
    // Start the scroll animation loop
    startScrollAnimation();
  };
  
  const handleJoystickTouchMove = (e: TouchEvent) => {
    // Prevent default to stop scrolling of the page
    e.preventDefault();
    e.stopPropagation();
    
    // Early return if conditions aren't met
    if (!isDragging || !joystickRef.current || !baseRef.current || !e.touches[0]) {
      console.log('Touch move conditions not met');
      return;
    }
    
    console.log('Touch move detected');
    
    // Get joystick base position and dimensions
    const baseRect = baseRef.current.getBoundingClientRect();
    const baseCenterX = baseRect.left + baseRect.width / 2;
    const baseCenterY = baseRect.top + baseRect.height / 2;
    
    // Calculate relative position
    let dx = e.touches[0].clientX - baseCenterX;
    let dy = e.touches[0].clientY - baseCenterY;
    
    console.log(`Touch move: dx=${dx}, dy=${dy}`);
    
    // Limit joystick movement to a circle with better physics feel
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = baseRect.width / 3; // Limit to 1/3 of base width
    
    if (distance > maxDistance) {
      // Scale the position to stay within the max distance
      dx = (dx / distance) * maxDistance;
      dy = (dy / distance) * maxDistance;
    }
    
    // FORCEFULLY update DOM for immediate response
    if (joystickRef.current) {
      // Remove any transition for immediate movement
      (joystickRef.current as HTMLDivElement).style.transition = 'none';
      (joystickRef.current as HTMLDivElement).style.transform = `translate(${dx}px, ${dy}px)`;
      
      // Force a reflow to ensure the style is applied immediately
      void (joystickRef.current as HTMLDivElement).offsetWidth;
      
      // Add visible highlight
      (joystickRef.current as HTMLDivElement).style.boxShadow = '0 0 15px rgba(135, 106, 245, 0.8)';
      
      console.log('Applied touch move transform:', `translate(${dx}px, ${dy}px)`);
    }
    
    // Update joystick position in state
    setJoystickPosition({ x: dx, y: dy });
    
    // Immediately trigger scroll for responsive feel
    handleScrollFromJoystick(dy);
    
    // Update visual indicators
    updateDirectionIndicators(dy);
  };
  
  const handleJoystickTouchEnd = () => {
    console.log('Touch end detected');
    
    // Store last position before resetting for spring animation
    if (joystickRef.current) {
      const lastPosition = { ...joystickPosition };
      
      // Set CSS variables for spring animation
      (joystickRef.current as HTMLDivElement).style.setProperty('--last-x', `${lastPosition.x}px`);
      (joystickRef.current as HTMLDivElement).style.setProperty('--last-y', `${lastPosition.y}px`);
      
      // Add spring return animation class
      (joystickRef.current as HTMLDivElement).classList.add('joystick-spring-return');
      
      // Remove highlight
      (joystickRef.current as HTMLDivElement).style.boxShadow = '';
    }
    
    // Stop dragging
    setIsDragging(false);
    
    // Reset joystick position in state
    setJoystickPosition({ x: 0, y: 0 });
    
    // Remove event listeners
    window.removeEventListener('touchmove', handleJoystickTouchMove);
    window.removeEventListener('touchend', handleJoystickTouchEnd);
    
    // Stop the scrolling animation
    stopScrollAnimation();
    
    // Store the last position for spring animation
    const lastPosition = { ...joystickPosition };
    
    // Apply spring return animation for touch too
    if (joystickRef.current) {
      // Set CSS variables for animation
      (joystickRef.current as HTMLDivElement).style.setProperty('--last-x', `${lastPosition.x}px`);
      (joystickRef.current as HTMLDivElement).style.setProperty('--last-y', `${lastPosition.y}px`);
      
      // Add the spring animation class
      (joystickRef.current as HTMLDivElement).classList.add('joystick-spring-return');
      
      // Directly set transform for immediate visual feedback
      (joystickRef.current as HTMLDivElement).style.transform = 'translate(0px, 0px)';
      
      // Remove the animation class after it completes
      setTimeout(() => {
        if (joystickRef.current) {
          (joystickRef.current as HTMLDivElement).classList.remove('joystick-spring-return');
        }
      }, 550); // Match the animation duration
    }
    
    // Return joystick to center in state
    setJoystickPosition({ x: 0, y: 0 });
    
    // Reset visual indicators
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
    
    // Remove event listeners
    window.removeEventListener('touchmove', handleJoystickTouchMove);
    window.removeEventListener('touchend', handleJoystickTouchEnd);
  };
  
  // Animation loop for smooth scrolling
  const startScrollAnimation = () => {
    setIsScrolling(true);
    
    // Cancel any existing animation frame
    if (scrollAnimationRef.current !== null) {
      cancelAnimationFrame(scrollAnimationRef.current);
    }
    
    // Get timestamp for smooth animation
    let lastTimestamp: number | null = null;
    
    // Start the scrolling animation loop with timing control for smoother movement
    const animateScroll = (timestamp: number) => {
      // Calculate delta time for smoother animation
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaTime = (timestamp - lastTimestamp) / 16.67; // Normalize to 60fps
      lastTimestamp = timestamp;
      
      // Get current joystick Y position directly from the DOM for most up-to-date value
      let yPosition = joystickPosition.y;
      
      // If the joystick ref exists, try to get the transform directly
      if (joystickRef.current) {
        const transform = (joystickRef.current as HTMLDivElement).style.transform;
        if (transform) {
          const match = transform.match(/translate\((.+?)px,\s*(.+?)px\)/);
          if (match && match[2]) {
            yPosition = parseFloat(match[2]);
          }
        }
      }
      
      // Perform scrolling if needed with deltaTime for smooth consistent speed
      if (isDragging && Math.abs(yPosition) > 0) {
        // Apply deltaTime to normalize speed across different frame rates
        const normalizedYPosition = yPosition * (deltaTime || 1);
        handleScrollFromJoystick(normalizedYPosition);
      }
      
      // Continue the animation loop if still dragging
      if (isDragging) {
        scrollAnimationRef.current = requestAnimationFrame(animateScroll);
      }
    };
    
    // Start the animation loop
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
  
  const handleScrollFromJoystick = (yPosition: number) => {
    // Super-responsive physics-based scrolling with even better precision and feedback
    const deadzone = 0.3; // Smaller deadzone for better responsiveness
    const maxYPosition = 40; // Maximum expected joystick movement
    
    // Quick deadzone check for performance
    if (Math.abs(yPosition) < deadzone) {
      return; // Within deadzone - no scrolling
    }
    
    // More responsive curve with variable intensity based on joystick position
    // This creates a more natural feeling when scrolling small vs large amounts
    const normalizedPosition = yPosition / maxYPosition; // Normalize to -1 to 1 range
    const direction = Math.sign(normalizedPosition);
    
    // Adaptive curve intensity - smoother at lower speeds, more acceleration at higher speeds
    const adaptiveCurve = Math.abs(normalizedPosition) < 0.5 ? 
      0.9 : // More linear/responsive for small movements
      1.2;  // More acceleration for large movements
    
    const magnitude = Math.pow(Math.abs(normalizedPosition), adaptiveCurve);
    
    // Increased base scroll speed for more immediate feedback
    const baseScrollSpeed = 140; // Higher speed for faster scrolling
    const scrollSpeed = direction * magnitude * baseScrollSpeed;
    
    // Request a post detection on the next frame if we're scrolling significantly
    if (Math.abs(scrollSpeed) > 30) {
      // Schedule post detection at next animation frame for perfect synchronization
      requestAnimationFrame(detectMostVisiblePost);
    }
    
    // Use the newer Window.scroll() method with better performance
    window.scrollBy({
      top: scrollSpeed,
      behavior: 'auto' // Always use auto for responsiveness
    });
    
    // Make sure the joystick visually stays in the correct position with smoother movement
    if (joystickRef.current) {
      const currentTransform = (joystickRef.current as HTMLDivElement).style.transform;
      if (!currentTransform || !currentTransform.includes(`${yPosition}px`)) {
        const xPos = joystickPosition.x;
        (joystickRef.current as HTMLDivElement).style.transform = `translate(${xPos}px, ${yPosition}px)`;
      }
    }
    
    // Update visual feedback for better user experience
    updateJoystickFeedback(yPosition);
  };
  
  // Additional function for enhanced visual feedback
  const updateJoystickFeedback = (yPosition: number) => {
    const joystickHandle = joystickRef.current;
    if (!joystickHandle) return;
    
    // Add intensity classes based on how far the joystick is pushed
    const intensity = Math.abs(yPosition) / 40; // 0 to 1 range
    
    // Remove all existing intensity classes
    (joystickHandle as HTMLDivElement).classList.remove('low-intensity', 'medium-intensity', 'high-intensity');
    
    // Add appropriate intensity class
    if (intensity > 0.7) {
      (joystickHandle as HTMLDivElement).classList.add('high-intensity');
    } else if (intensity > 0.3) {
      (joystickHandle as HTMLDivElement).classList.add('medium-intensity');
    } else if (intensity > 0.1) {
      (joystickHandle as HTMLDivElement).classList.add('low-intensity');
    }
  };
  
  // Enhanced continuous scrolling with adaptive frame rate for smoother experience
  useEffect(() => {
    let lastTimestamp = 0;
    let animationFrameId: number;
    
    const scrollAnimation = (timestamp: number) => {
      if (!isDragging) return;
      
      // Calculate delta time for consistent scrolling regardless of frame rate
      const deltaTime = timestamp - lastTimestamp;
      
      // Only update on appropriate intervals (targeting ~60fps)
      if (deltaTime > 16) {
        lastTimestamp = timestamp;
        
        // Apply the joystick scrolling with frame-rate independent speed
        if (joystickPosition.y !== 0) {
          handleScrollFromJoystick(joystickPosition.y);
        }
      }
      
      // Continue the animation loop
      animationFrameId = requestAnimationFrame(scrollAnimation);
    };
    
    if (isDragging) {
      // Start the animation frame loop for smoother performance
      animationFrameId = requestAnimationFrame(scrollAnimation);
    }
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isDragging, joystickPosition]);
  
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
      } catch (error) {
        console.error(`Error finding target post with selector:`, selector, error);
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
        // Already following, show a message but keep the follow
        toast.success('Already following this creator');
      } else {
        // Follow the creator
        await supabase
          .from('follows')
          .insert({
            follower_id: userId,
            following_id: creatorId,
            created_at: new Date().toISOString()
          });
          
        toast.success('Now following this creator');
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
  const detectMostVisiblePost = () => {
    // Use a more specific and comprehensive selector to capture all post types
    // This improves targeting accuracy while maintaining performance
    const allPosts = Array.from(document.querySelectorAll(
      '.post-item, [data-post-id], [id^="post-"], .post-container, .post-card, article[id*="post"], .post'
    ));
    
    if (allPosts.length === 0) {
      return null;
    }
    
    let mostVisiblePost = null;
    let maxVisibility = 0;
    
    // Use viewportHeight once to improve performance
    const viewportHeight = window.innerHeight;
    const viewportCenter = viewportHeight / 2;
    
    allPosts.forEach(post => {
      const rect = post.getBoundingClientRect();
      
      // Fast check for visibility - post must be at least partially visible
      if (rect.bottom < 0 || rect.top > viewportHeight) {
        return;
      }
      
      // Skip very small elements more aggressively (likely not actual posts)
      if (rect.height < 40) {
        return;
      }
      
      // Calculate what percentage of the post is visible - optimized math
      const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
      const percentVisible = visibleHeight / rect.height;
      
      // Give stronger preference to posts near the center for more intuitive selection
      const distanceFromCenter = Math.abs((rect.top + rect.bottom) / 2 - viewportCenter);
      const centerFactor = 1 - (distanceFromCenter / viewportHeight) * 1.5; // Increased center weight
      
      // Enhanced scoring formula that prioritizes posts more clearly in view
      const visibilityScore = percentVisible * (1 + centerFactor) * (percentVisible > 0.7 ? 1.5 : 1);
      
      if (visibilityScore > maxVisibility) {
        maxVisibility = visibilityScore;
        mostVisiblePost = post;
      }
    });
    
    if (mostVisiblePost) {
      // Get post ID from various possible attributes
      const postId = mostVisiblePost.getAttribute('data-post-id') || 
                     mostVisiblePost.getAttribute('id')?.replace(/post-?/i, '') ||
                     mostVisiblePost.getAttribute('data-id');
      
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
        <div className="bg-[#0D0D18] w-full pointer-events-auto py-3">
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
                      transform: `translate(${joystickPosition.x}px, ${joystickPosition.y}px)`,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.7)', 
                      willChange: 'transform',
                      touchAction: 'none', /* Prevent default touch actions */
                      transition: isDragging ? 'none' : 'transform 0.05s ease-out'
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
                                <div className="absolute inset-[2px] bg-[#0D0D18] rounded-sm flex items-center justify-center">
                                  {React.cloneElement(option.icon as React.ReactElement, { 
                                    className: "h-5 w-5 text-purple-400 group-hover:text-white transition-colors duration-300" 
                                  })}
                                </div>
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
                
                {/* Bottom button (Follow) */}
                <button 
                  data-action="follow"
                  onClick={handleFollow}
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-11 h-11 bg-[#151520] rounded-full border-2 border-green-500 flex items-center justify-center"
                >
                  <UserPlus className="text-green-500 h-5 w-5" />
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
