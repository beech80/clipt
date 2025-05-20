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

interface GameBoyControlsProps {
  currentPostId?: string;
}

interface Window {
  continuousScrollTimer: NodeJS.Timeout | null;
}

declare global {
  interface Window {
    continuousScrollTimer: NodeJS.Timeout | null;
  }
}

// Add the property to the window object if it doesn't exist
if (typeof window !== 'undefined' && window.continuousScrollTimer === undefined) {
  window.continuousScrollTimer = null;
}

const GameBoyControls: React.FC<GameBoyControlsProps> = ({ currentPostId: propCurrentPostId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [currentPath, setCurrentPath] = useState(location.pathname);
  const [currentPostId, setCurrentPostId] = useState<string | null>(propCurrentPostId || null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const [buttonsAnimated, setButtonsAnimated] = useState(false);
  const [particles, setParticles] = useState<any[]>([]);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickDirection, setJoystickDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null);
  const [joystickBaseX, setJoystickBaseX] = useState(0);
  const [joystickBaseY, setJoystickBaseY] = useState(0);
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickHandleRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef(0);
  
  // Add post detection on mount and page changes
  useEffect(() => {
    console.log('Setting up post detection');
    
    // Function to detect and select the most visible post
    const detectAndSelectCurrentPost = () => {
      // Find all posts on the page with multiple selectors to work across different pages
      const allPosts = Array.from(document.querySelectorAll('[data-post-id], .post-card, .post-container'));
      
      if (allPosts.length === 0) {
        console.log('No posts found on current page');
        return;
      }
      
      console.log(`Found ${allPosts.length} posts on the page`);
      
      // Find the post most visible in the viewport
      let mostVisiblePost: Element | null = null;
      let maxVisibility = 0;
      
      allPosts.forEach(post => {
        const rect = post.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
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
                      mostVisiblePost.getAttribute('id') ||
                      mostVisiblePost.getAttribute('data-id');
        
        if (postId && postId !== currentPostId) {
          console.log('Selected post:', postId);
          setCurrentPostId(postId);
          
          // Add a visual indicator to the selected post
          allPosts.forEach(post => post.classList.remove('gameboy-selected-post'));
          mostVisiblePost.classList.add('gameboy-selected-post');
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

    // Create debounced handler
    const debouncedDetectPost = debounce(detectAndSelectCurrentPost, 200);
    
    // Set up scroll listener
    window.addEventListener('scroll', debouncedDetectPost);
    
    // Initial detection
    detectAndSelectCurrentPost();
    
    // Set up mutation observer to detect when new posts are added
    const observer = new MutationObserver((mutations) => {
      let shouldDetect = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          Array.from(mutation.addedNodes).forEach(node => {
            if (node instanceof HTMLElement && 
                (node.hasAttribute('data-post-id') || 
                 node.classList.contains('post-card') || 
                 node.classList.contains('post-container'))) {
              shouldDetect = true;
            }
          });
        }
      });
      
      if (shouldDetect) {
        detectAndSelectCurrentPost();
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Add styling for selected posts
    const style = document.createElement('style');
    style.innerHTML = `
      .gameboy-selected-post {
        position: relative;
        box-shadow: 0 0 0 2px #6c4dc4 !important;
        transition: box-shadow 0.3s ease;
      }
      
      .gameboy-selected-post::after {
        content: '';
        position: absolute;
        top: -6px;
        right: -6px;
        width: 12px;
        height: 12px;
        background-color: #6c4dc4;
        border-radius: 50%;
        animation: pulse-glow 1.5s infinite alternate;
        z-index: 9999;
      }
      
      @keyframes pulse-glow {
        0% { opacity: 0.6; box-shadow: 0 0 3px 2px rgba(108, 77, 196, 0.3); }
        100% { opacity: 1; box-shadow: 0 0 8px 3px rgba(108, 77, 196, 0.6); }
      }
      
      .button-press {
        transform: scale(0.9) !important;
        opacity: 0.8 !important;
        transition: transform 0.15s, opacity 0.15s !important;
      }
    `;
    document.head.appendChild(style);
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', debouncedDetectPost);
      observer.disconnect();
      document.head.removeChild(style);
    };
  }, [currentPostId]);
  
  // Handler for like button click - enhanced to find posts and buttons better
  const handleLike = async () => {
    // Visual feedback on controller button
    const controllerLikeButton = document.querySelector(`[data-action="like"]`);
    if (controllerLikeButton) {
      controllerLikeButton.classList.add('button-press');
      setTimeout(() => {
        controllerLikeButton.classList.remove('button-press');
      }, 300);
    }
    
    if (!currentPostId) {
      console.error('No post selected', { currentPostId });
      toast.error('No post selected. Try scrolling to a post first.');
      return;
    }
    
    console.log('Liking post:', currentPostId);
    
    // Try multiple selectors to find the target post
    const postSelectors = [
      `[data-post-id="${currentPostId}"]`,
      `#post-${currentPostId}`,
      `.post-container[data-id="${currentPostId}"]`,
      `[id="${currentPostId}"]`
    ];
    
    let targetPost: Element | null = null;
    
    // Try each selector until we find a match
    for (const selector of postSelectors) {
      const post = document.querySelector(selector);
      if (post) {
        targetPost = post;
        console.log('Found target post with selector:', selector);
        break;
      }
    }
    
    if (targetPost) {
      // Try multiple selectors for the like button
      const likeButtonSelectors = [
        '.like-button', 
        '[data-action="like"]', 
        '.like-action',
        'button:has(.heart-icon)',
        'button:has([data-feather="heart"])'
      ];
      
      let likeButton: Element | null = null;
      
      for (const selector of likeButtonSelectors) {
        try {
          const button = targetPost.querySelector(selector);
          if (button) {
            likeButton = button;
            console.log('Found like button with selector:', selector);
            break;
          }
        } catch (err) {
          console.error('Error finding like button with selector:', selector, err);
        }
      }
      
      if (likeButton) {        
        // Actually trigger the like button's click event
        likeButton.dispatchEvent(new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        }));
        
        toast.success('Post liked');
        return;
      } else {
        console.error('Like button not found on post', { currentPostId, targetPost });
      }
    } else {
      console.error('Target post not found', { currentPostId });
    }
    
    // Fallback if direct button interaction doesn't work
    try {
      // Check if already liked
      const { data: currentUser } = await supabase.auth.getUser();
      const userId = currentUser?.user?.id;
      
      if (!userId) {
        toast.error('You need to be logged in to like posts');
        return;
      }
      
      const { data: existingLike, error: likeError } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', currentPostId)
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
          .eq('post_id', currentPostId)
          .eq('user_id', userId);
          
        toast.success('Removed like from post');
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({
            post_id: currentPostId,
            user_id: userId,
            created_at: new Date().toISOString()
          });
          
        toast.success('Liked post');
      }
      
      // Trigger a refresh for the post's like count
      document.dispatchEvent(new CustomEvent('refresh-post', {
        detail: { postId: currentPostId }
      }));
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };

  // Handler for comment button click - enhanced to find posts and buttons better
  const handleComment = async () => {
    // Visual feedback on controller button
    const commentButton = document.querySelector(`[data-action="comment"]`);
    if (commentButton) {
      commentButton.classList.add('button-press');
      setTimeout(() => {
        commentButton.classList.remove('button-press');
      }, 300);
    }
    
    if (!currentPostId) {
      toast.error('No post selected. Try scrolling to a post first.');
      return;
    }
    
    console.log('Comment on post:', currentPostId);
    
    // Try multiple selectors to find the target post
    const postSelectors = [
      `[data-post-id="${currentPostId}"]`,
      `#post-${currentPostId}`,
      `.post-container[data-id="${currentPostId}"]`,
      `[id="${currentPostId}"]`
    ];
    
    let targetPost: Element | null = null;
    
    // Try each selector until we find a match
    for (const selector of postSelectors) {
      const post = document.querySelector(selector);
      if (post) {
        targetPost = post;
        console.log('Found target post with selector:', selector);
        break;
      }
    }
    
    if (targetPost) {
      // Try multiple selectors for the comment button
      const commentButtonSelectors = [
        '.comment-button', 
        '[data-action="comment"]', 
        '.comment-action',
        'button:has(.comment-icon)',
        'button:has([data-feather="message-circle"])'
      ];
      
      let commentButton: Element | null = null;
      
      for (const selector of commentButtonSelectors) {
        try {
          const button = targetPost.querySelector(selector);
          if (button) {
            commentButton = button;
            console.log('Found comment button with selector:', selector);
            break;
          }
        } catch (err) {
          console.error('Error finding comment button with selector:', selector, err);
        }
      }
      
      if (commentButton) {
        // Trigger the button
        commentButton.dispatchEvent(new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        }));
        
        toast.success('Comment action triggered');
        return;
      }
    }
    
    // Fallback to the modal approach
    setCommentModalOpen(true);
  };

  // Handler for follow button click - enhanced to find posts and buttons better
  const handleFollow = async () => {
    // Visual feedback on button press
    const followButton = document.querySelector(`[data-action="follow"]`);
    if (followButton) {
      followButton.classList.add('button-press');
      setTimeout(() => {
        followButton.classList.remove('button-press');
      }, 300);
    }
    
    if (!currentPostId) {
      toast.error('No post selected. Try scrolling to a post first.');
      return;
    }
    
    console.log('Following user for post:', currentPostId);
    
    // Try multiple selectors to find the target post
    const postSelectors = [
      `[data-post-id="${currentPostId}"]`,
      `#post-${currentPostId}`,
      `.post-container[data-id="${currentPostId}"]`,
      `[id="${currentPostId}"]`
    ];
    
    let targetPost: Element | null = null;
    
    // Try each selector until we find a match
    for (const selector of postSelectors) {
      const post = document.querySelector(selector);
      if (post) {
        targetPost = post;
        console.log('Found target post with selector:', selector);
        break;
      }
    }
    
    if (targetPost) {
      // Try multiple selectors for the follow button
      const followButtonSelectors = [
        '.follow-button', 
        '[data-action="follow"]', 
        '.follow-action',
        'button:has(.follow-icon)',
        'button:has([data-feather="user-plus"])'
      ];
      
      let followButton: Element | null = null;
      
      for (const selector of followButtonSelectors) {
        try {
          const button = targetPost.querySelector(selector);
          if (button) {
            followButton = button;
            console.log('Found follow button with selector:', selector);
            break;
          }
        } catch (err) {
          console.error('Error finding follow button with selector:', selector, err);
        }
      }
      
      if (followButton) {
        // Trigger the button
        followButton.dispatchEvent(new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        }));
        
        toast.success('Follow action triggered');
        return;
      }
    }
    
    // Default follow logic here
    toast.info('Follow action (direct API fallback not implemented)');
  };

  // Handler for trophy button click - enhanced to find posts and buttons better
  const handleTrophy = async () => {
    // Visual feedback on button press
    const trophyButton = document.querySelector(`[data-action="trophy"]`);
    if (trophyButton) {
      trophyButton.classList.add('button-press');
      setTimeout(() => {
        trophyButton.classList.remove('button-press');
      }, 300);
    }
    
    if (!currentPostId) {
      toast.error('No post selected. Try scrolling to a post first.');
      return;
    }
    
    console.log('Trophy clicked for post:', currentPostId);
    
    // Try multiple selectors to find the target post
    const postSelectors = [
      `[data-post-id="${currentPostId}"]`,
      `#post-${currentPostId}`,
      `.post-container[data-id="${currentPostId}"]`,
      `[id="${currentPostId}"]`
    ];
    
    let targetPost: Element | null = null;
    
    // Try each selector until we find a match
    for (const selector of postSelectors) {
      const post = document.querySelector(selector);
      if (post) {
        targetPost = post;
        console.log('Found target post with selector:', selector);
        break;
      }
    }
    
    if (targetPost) {
      // Try multiple selectors for the trophy button
      const trophyButtonSelectors = [
        '.trophy-button', 
        '[data-action="trophy"]', 
        '.trophy-action',
        'button:has(.trophy-icon)',
        'button:has([data-feather="trophy"])'
      ];
      
      let trophyActionButton: Element | null = null;
      
      for (const selector of trophyButtonSelectors) {
        try {
          const button = targetPost.querySelector(selector);
          if (button) {
            trophyActionButton = button;
            console.log('Found trophy button with selector:', selector);
            break;
          }
        } catch (err) {
          console.error('Error finding trophy button with selector:', selector, err);
        }
      }
      
      if (trophyActionButton) {
        // Trigger the button
        trophyActionButton.dispatchEvent(new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        }));
        
        toast.success('Trophy action triggered');
        return;
      }
    }
    
    // Default trophy logic here
    toast.info('Trophy action (direct API fallback not implemented)');
  };

  // Rest of your original GameBoyControls component code here...
  
  return (
    <div className="gameboy-controls">
      {/* Your original UI code here */}
    </div>
  );
};

export default GameBoyControls;
