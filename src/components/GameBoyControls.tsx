import { useEffect, useRef, useState } from 'react';
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
  Monitor
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import './joystick-animations.css'; // Import joystick animations

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
    { name: 'Discovery', icon: <Search className="mr-2 h-4 w-4" />, path: '/discovery' },
    { name: 'Top', icon: <TrendingUp className="mr-2 h-4 w-4" />, path: '/top' },
    { name: 'Top Clipts', icon: <Award className="mr-2 h-4 w-4" />, path: '/top-clipts' },
    { name: 'Clipts', icon: <Monitor className="mr-2 h-4 w-4" />, path: '/clipts' }
  ]);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  
  // Joystick states
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
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
      const postContainers = document.querySelectorAll('.post-container, .post-card, .post-item, [id*="post"]');
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
                // Generate a temporary ID
                postId = `temp-post-${index}-${Date.now()}`;
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
      
      // Find all posts on the page with multiple selectors to work across different pages
      const allPosts = Array.from(document.querySelectorAll(
        '[data-post-id], .post-container, .post-card, .post-item, [id*="post"]'
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
        
        if (percentVisible > maxVisibility) {
          maxVisibility = percentVisible;
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
        }
      } else {
        logToDebug('No visible posts found');
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

    // Create debounced handler
    const debouncedDetectPost = debounce(detectAndSelectCurrentPost, 200);
    
    // Set up scroll listener
    window.addEventListener('scroll', debouncedDetectPost);
    
    // Initial detection with a delay to allow page to render
    setTimeout(detectAndSelectCurrentPost, 500);
    
    // Set up mutation observer to detect when new posts are added
    const observer = new MutationObserver((mutations) => {
      let shouldDetect = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          Array.from(mutation.addedNodes).forEach(node => {
            if (node instanceof HTMLElement && 
                (node.hasAttribute('data-post-id') || 
                 node.classList.contains('post-container') ||
                 node.classList.contains('post-card') ||
                 node.classList.contains('post-item') ||
                 (node.id && node.id.includes('post')))) {
              shouldDetect = true;
            }
          });
        }
      });
      
      if (shouldDetect) {
        setTimeout(detectAndSelectCurrentPost, 300);
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
      observer.disconnect();
      document.head.removeChild(style);
      clearInterval(intervalId);
    };
  }, [currentPath]);
  
  // Joystick movement handlers
  const handleJoystickMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    // Add event listeners to window for mouse movement and release
    window.addEventListener('mousemove', handleJoystickMouseMove);
    window.addEventListener('mouseup', handleJoystickMouseUp);
  };
  
  const handleJoystickMouseMove = (e: MouseEvent) => {
    if (!isDragging || !joystickRef.current || !baseRef.current) return;
    
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
      // Add subtle resistance at the edges for more realistic feel
      const resistanceFactor = 1 + (distance - maxDistance) * 0.05; 
      dx = (dx / distance) * maxDistance / resistanceFactor;
      dy = (dy / distance) * maxDistance / resistanceFactor;
      
      // Add subtle haptic-like visual feedback when hitting the edge
      if (joystickRef.current) {
        joystickRef.current.animate([
          { transform: `translate(${dx * 0.98}px, ${dy * 0.98}px)` },
          { transform: `translate(${dx}px, ${dy}px)` }
        ], {
          duration: 80,
          easing: 'ease-out'
        });
      }
    }
    
    // Update joystick position
    setJoystickPosition({ x: dx, y: dy });
    
    // Handle scrolling based on joystick position with enhanced feedback
    handleScrollFromJoystick(dy);
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
      
      if (direction === 'up' && Math.abs(yPosition) > 3) { // Smaller deadzone for visual feedback
        // Moving up with variable intensity
        upIndicator.classList.add('active');
        joystickHandle.classList.add('joystick-handle-up');
        
        // Apply intensity as a CSS variable
        upIndicator.setAttribute('style', `--intensity: ${intensity}%`);
        joystickHandle.setAttribute('style', `--move-intensity: ${intensity}%`);
      } else if (direction === 'down' && Math.abs(yPosition) > 3) {
        // Moving down with variable intensity
        downIndicator.classList.add('active');
        joystickHandle.classList.add('joystick-handle-down');
        
        // Apply intensity as a CSS variable
        downIndicator.setAttribute('style', `--intensity: ${intensity}%`);
        joystickHandle.setAttribute('style', `--move-intensity: ${intensity}%`);
      } else {
        // Neutral position - reset all
        joystickHandle.setAttribute('style', `--move-intensity: 0%`);
        upIndicator.setAttribute('style', `--intensity: 0%`);
        downIndicator.setAttribute('style', `--intensity: 0%`);
      }
    }
  };
  
  const handleJoystickMouseUp = () => {
    // Store the last position for spring animation
    const lastPosition = { ...joystickPosition };
    
    // Apply spring return animation
    if (joystickRef.current) {
      joystickRef.current.style.setProperty('--last-x', `${lastPosition.x}px`);
      joystickRef.current.style.setProperty('--last-y', `${lastPosition.y}px`);
      joystickRef.current.classList.add('joystick-spring-return');
      
      // Remove the animation class after it completes
      setTimeout(() => {
        if (joystickRef.current) {
          joystickRef.current.classList.remove('joystick-spring-return');
        }
      }, 400); // Match the animation duration
    }
    
    setIsDragging(false);
    
    // Return joystick to center
    setJoystickPosition({ x: 0, y: 0 });
    
    // Reset indicators with all classes for visual cleanup
    if (joystickRef.current) {
      joystickRef.current.classList.remove(
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
      upIndicator.setAttribute('style', '--intensity: 0%');
    }
    
    if (downIndicator) {
      downIndicator.classList.remove('active');
      downIndicator.setAttribute('style', '--intensity: 0%');
    }
    
    // Remove event listeners
    window.removeEventListener('mousemove', handleJoystickMouseMove);
    window.removeEventListener('mouseup', handleJoystickMouseUp);
  };
  
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    // Add event listeners to window for touch movement and release
    window.addEventListener('touchmove', handleJoystickTouchMove, { passive: false });
    window.addEventListener('touchend', handleJoystickTouchEnd);
  };
  
  const handleJoystickTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (!isDragging || !joystickRef.current || !baseRef.current || !e.touches[0]) return;
    
    // Get joystick base position and dimensions
    const baseRect = baseRef.current.getBoundingClientRect();
    const baseCenterX = baseRect.left + baseRect.width / 2;
    const baseCenterY = baseRect.top + baseRect.height / 2;
    
    // Calculate relative position
    let dx = e.touches[0].clientX - baseCenterX;
    let dy = e.touches[0].clientY - baseCenterY;
    
    // Limit joystick movement to a circle with better physics feel
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = baseRect.width / 3; // Limit to 1/3 of base width
    
    if (distance > maxDistance) {
      // Add subtle resistance at the edges for better physical feel
      const resistanceFactor = 1 + (distance - maxDistance) * 0.05;
      dx = (dx / distance) * maxDistance / resistanceFactor;
      dy = (dy / distance) * maxDistance / resistanceFactor;
    }
    
    // Update joystick position
    setJoystickPosition({ x: dx, y: dy });
    
    // Handle scrolling based on joystick position
    handleScrollFromJoystick(dy);
    updateDirectionIndicators(dy);
  };
  
  const handleJoystickTouchEnd = () => {
    // Store the last position for spring animation
    const lastPosition = { ...joystickPosition };
    
    // Apply spring return animation for touch too
    if (joystickRef.current) {
      joystickRef.current.style.setProperty('--last-x', `${lastPosition.x}px`);
      joystickRef.current.style.setProperty('--last-y', `${lastPosition.y}px`);
      joystickRef.current.classList.add('joystick-spring-return');
      
      // Remove the animation class after it completes
      setTimeout(() => {
        if (joystickRef.current) {
          joystickRef.current.classList.remove('joystick-spring-return');
        }
      }, 400); // Match the animation duration
    }
    
    setIsDragging(false);
    
    // Return joystick to center with animation
    setJoystickPosition({ x: 0, y: 0 });
    
    // Reset visual indicators
    if (joystickRef.current) {
      joystickRef.current.classList.remove(
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
      upIndicator.setAttribute('style', '--intensity: 0%');
    }
    
    if (downIndicator) {
      downIndicator.classList.remove('active');
      downIndicator.setAttribute('style', '--intensity: 0%');
    }
    
    // Remove event listeners
    window.removeEventListener('touchmove', handleJoystickTouchMove);
    window.removeEventListener('touchend', handleJoystickTouchEnd);
  };
  
  const handleScrollFromJoystick = (yPosition: number) => {
    // Enhanced physics-based scroll with non-linear acceleration for more realistic feel
    // Use exponential curve for better control at smaller movements and faster scrolling at extremes
    const deadzone = 3; // Small deadzone for better control
    const maxYPosition = 40; // Maximum expected joystick movement
    
    // Normalize y-position and apply deadzone
    if (Math.abs(yPosition) < deadzone) {
      return; // Within deadzone - no scrolling
    }
    
    // Apply non-linear curve for more precision - use a quadratic curve
    const normalizedPosition = yPosition / maxYPosition; // Normalize to -1 to 1 range
    const curveIntensity = 2.2; // Higher = more exponential (more intense at edges)
    const direction = Math.sign(normalizedPosition);
    const magnitude = Math.pow(Math.abs(normalizedPosition), curveIntensity);
    
    // Calculate scroll speed with improved physics feel
    // Maximum speed of 30px per frame for full joystick extension
    const baseScrollSpeed = 30;
    const scrollSpeed = direction * magnitude * baseScrollSpeed;
    
    // Use smooth scrolling for smaller movements, snap scrolling for larger movements
    const scrollBehavior = Math.abs(scrollSpeed) < 10 ? 'smooth' : 'auto';
    
    window.scrollBy({
      top: scrollSpeed,
      behavior: scrollBehavior
    });
    
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
    joystickHandle.classList.remove('low-intensity', 'medium-intensity', 'high-intensity');
    
    // Add appropriate intensity class
    if (intensity > 0.7) {
      joystickHandle.classList.add('high-intensity');
    } else if (intensity > 0.3) {
      joystickHandle.classList.add('medium-intensity');
    } else if (intensity > 0.1) {
      joystickHandle.classList.add('low-intensity');
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
  
  // Universal action handler
  const handlePostAction = (actionType: 'like' | 'comment' | 'follow' | 'trophy') => {
    // Visual feedback on controller button
    const controllerButton = document.querySelector(`[data-action="${actionType}"]`);
    if (controllerButton) {
      controllerButton.classList.add('button-press');
      setTimeout(() => {
        controllerButton.classList.remove('button-press');
      }, 300);
    }
    
    if (!currentPostId) {
      logToDebug(`No post selected for ${actionType} action`);
      toast.error('No post selected. Try scrolling to a post first.');
      return;
    }
    
    logToDebug(`Handling ${actionType} action for post: ${currentPostId}`);
    
    // Try multiple selectors to find the target post
    const postSelectors = [
      `[data-post-id="${currentPostId}"]`,
      `#post-${currentPostId}`,
      `.post-container[data-id="${currentPostId}"]`,
      `[id="${currentPostId}"]`,
      `.post-${currentPostId}`
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
        if (postId === currentPostId) {
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
              } else if (closestPost.getAttribute('data-post-id') === currentPostId) {
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
          logToDebug('Falling back to comment modal');
          setCommentModalOpen(true);
          return;
        } else if (actionType === 'like') {
          // Try direct API like
          handleDirectLike(currentPostId);
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
  
  // Individual action handlers that use the universal handler
  const handleLike = () => handlePostAction('like');
  const handleComment = () => handlePostAction('comment');
  const handleFollow = () => handlePostAction('follow');
  const handleTrophy = () => handlePostAction('trophy');

  // Your return JSX - the UI for the GameBoy controller
  return (
    <>
      {/* Comment Modal */}
      {commentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gaming-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add Comment</h2>
            <textarea 
              className="w-full p-3 rounded-md bg-gaming-700 text-white mb-4"
              placeholder="Write your comment here..."
              rows={4}
            ></textarea>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-600 rounded-md"
                onClick={() => setCommentModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-purple-600 rounded-md"
                onClick={() => {
                  toast.success('Comment added!');
                  setCommentModalOpen(false);
                }}
              >
                Comment
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      >
        <div className="bg-[#0D0D18] w-full pointer-events-auto py-3">
          <div className="flex justify-between items-center px-10 max-w-5xl mx-auto">
            
              {/* Left - Modern Xbox-style Joystick */}
              <div 
                ref={baseRef}
                className="w-24 h-24 bg-gradient-to-b from-[#1A1A24] to-[#0D0D18] rounded-full flex items-center justify-center cursor-pointer relative shadow-lg"
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
                    className="w-14 h-14 bg-gradient-to-b from-[#2A2A36] to-[#151520] rounded-full border border-[#3A3A45] absolute z-10 transition-transform duration-75 cursor-grab active:cursor-grabbing"
                    style={{
                      transform: `translate(${joystickPosition.x}px, ${joystickPosition.y}px)`,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.7)'
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
                <span className="absolute inset-[2px] rounded-full bg-[#0D0D18]"></span>
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
                    <div className="absolute bottom-full mb-2 left-0 w-44 bg-[#1D1D26] rounded-lg shadow-xl p-2 z-50">
                      {navigationOptions.map((option) => (
                        <button
                          key={option.path}
                          className="flex items-center w-full p-2 hover:bg-[#272733] rounded text-white text-sm text-left"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(option.path);
                            setMenuOpen(false);
                          }}
                        >
                          {option.icon}
                          {option.name}
                        </button>
                      ))}
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
                  onClick={handleComment}
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
