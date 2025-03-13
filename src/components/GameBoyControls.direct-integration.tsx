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

const GameBoyControls: React.FC<GameBoyControlsProps> = ({ currentPostId: propCurrentPostId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [currentPath, setCurrentPath] = useState(location.pathname);
  const [currentPostId, setCurrentPostId] = useState<string | null>(propCurrentPostId || null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  
  // Inject directly visible debug logging
  useEffect(() => {
    const debugElement = document.createElement('div');
    debugElement.id = 'gameboy-debug';
    debugElement.style.position = 'fixed';
    debugElement.style.bottom = '150px';
    debugElement.style.right = '10px';
    debugElement.style.backgroundColor = 'rgba(0,0,0,0.7)';
    debugElement.style.color = '#fff';
    debugElement.style.padding = '10px';
    debugElement.style.borderRadius = '5px';
    debugElement.style.zIndex = '9999';
    debugElement.style.fontSize = '12px';
    debugElement.style.maxWidth = '300px';
    debugElement.style.maxHeight = '150px';
    debugElement.style.overflow = 'auto';
    
    document.body.appendChild(debugElement);
    
    const log = (message: string) => {
      const entry = document.createElement('div');
      entry.textContent = message;
      debugElement.appendChild(entry);
      
      // Keep only last 10 messages
      while (debugElement.children.length > 10) {
        debugElement.removeChild(debugElement.firstChild as Node);
      }
    };
    
    // Add to window for debugging
    (window as any).gameboyLog = log;
    
    return () => {
      document.body.removeChild(debugElement);
    };
  }, []);

  // Add post detection on mount and page changes
  useEffect(() => {
    const logToDebug = (message: string) => {
      console.log(message);
      if ((window as any).gameboyLog) {
        (window as any).gameboyLog(message);
      }
    };
    
    logToDebug('Setting up post detection');
    
    // Function to ensure all posts have data-post-id attributes
    const addDataAttributes = () => {
      logToDebug('Adding data-post-id attributes to posts...');
      
      // Add data-post-id to all post-container divs
      const postContainers = document.querySelectorAll('.post-container');
      let attributesAdded = 0;
      
      postContainers.forEach((post, index) => {
        if (!post.hasAttribute('data-post-id')) {
          // Check if the post has an ID we can use
          let postId = '';
          
          // Try to find ID from various sources
          if (post.hasAttribute('id') && post.getAttribute('id')?.startsWith('post-')) {
            postId = post.getAttribute('id')?.replace('post-', '') || '';
          } else {
            // Look for ID in child elements
            const postIdElement = post.querySelector('[data-post-id]');
            if (postIdElement) {
              postId = postIdElement.getAttribute('data-post-id') || '';
            } else {
              // Generate a temporary ID
              postId = `temp-post-${index}`;
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
      const allPosts = Array.from(document.querySelectorAll('[data-post-id], .post-container'));
      
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
                      mostVisiblePost.getAttribute('id')?.replace('post-', '') ||
                      mostVisiblePost.getAttribute('data-id');
        
        if (postId) {
          logToDebug(`Selected post: ${postId} (${(maxVisibility * 100).toFixed(1)}% visible)`);
          setCurrentPostId(postId);
          
          // Add a visual indicator to the selected post
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
    
    // Initial detection
    setTimeout(detectAndSelectCurrentPost, 500);
    
    // Set up mutation observer to detect when new posts are added
    const observer = new MutationObserver((mutations) => {
      let shouldDetect = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          Array.from(mutation.addedNodes).forEach(node => {
            if (node instanceof HTMLElement && 
                (node.hasAttribute('data-post-id') || 
                 node.classList.contains('post-container'))) {
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
    
    // Add styling for selected posts
    const style = document.createElement('style');
    style.innerHTML = `
      .gameboy-selected-post {
        position: relative;
        box-shadow: 0 0 0 3px #6c4dc4 !important;
        transition: box-shadow 0.3s ease;
      }
      
      .gameboy-selected-post::after {
        content: '';
        position: absolute;
        top: -8px;
        right: -8px;
        width: 16px;
        height: 16px;
        background-color: #6c4dc4;
        border-radius: 50%;
        animation: pulse-glow 1.5s infinite alternate;
        z-index: 9999;
      }
      
      @keyframes pulse-glow {
        0% { opacity: 0.6; box-shadow: 0 0 5px 2px rgba(108, 77, 196, 0.3); }
        100% { opacity: 1; box-shadow: 0 0 10px 4px rgba(108, 77, 196, 0.6); }
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
  }, []);
  
  // Universal action handler
  const handlePostAction = (actionType: 'like' | 'comment' | 'follow' | 'trophy') => {
    // Log debug info
    const logToDebug = (message: string) => {
      console.log(message);
      if ((window as any).gameboyLog) {
        (window as any).gameboyLog(message);
      }
    };
    
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
        console.error(`Error with selector ${selector}:`, error);
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
            'button[aria-label="Like post"]'
          ];
          break;
        case 'comment':
          buttonSelectors = [
            '.comment-button', 
            'button:has(svg[data-feather="message-circle"])',
            'button:has(.comment-icon)',
            'button:has(.lucide-message-circle)',
            'button[aria-label="Comment on post"]'
          ];
          break;
        case 'follow':
          buttonSelectors = [
            '.follow-button', 
            'button:has(svg[data-feather="user-plus"])',
            'button:has(.follow-icon)',
            'button:has(.lucide-user-plus)',
            'button[aria-label="Follow user"]'
          ];
          break;
        case 'trophy':
          buttonSelectors = [
            '.trophy-button', 
            'button:has(svg[data-feather="trophy"])',
            'button:has(.trophy-icon)',
            'button:has(.lucide-trophy)',
            'button[aria-label="Give trophy"]'
          ];
          break;
      }
      
      let actionButton: Element | null = null;
      
      // Try each selector
      for (const selector of buttonSelectors) {
        try {
          const buttons = targetPost.querySelectorAll(selector);
          if (buttons.length > 0) {
            actionButton = buttons[0];
            logToDebug(`Found ${actionType} button with selector: ${selector}`);
            break;
          }
        } catch (err) {
          console.error(`Error finding ${actionType} button with selector:`, selector, err);
        }
      }
      
      // If we couldn't find in the target post, look globally
      if (!actionButton) {
        logToDebug('Button not found in post, looking globally...');
        
        for (const selector of buttonSelectors) {
          try {
            // Find all buttons of this type in the document
            const allButtons = document.querySelectorAll(selector);
            
            allButtons.forEach(button => {
              // Check if this button is in or near our target post
              const closestPost = button.closest('[data-post-id]');
              if (closestPost && closestPost.getAttribute('data-post-id') === currentPostId) {
                actionButton = button;
                logToDebug(`Found ${actionType} button globally`);
              }
            });
            
            if (actionButton) break;
          } catch (err) {
            console.error(`Error finding global ${actionType} button with selector:`, selector, err);
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
      console.log('Attempting direct API like for post:', postId);
      
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

  // Rest of your original GameBoyControls component code here...
  
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
        className={`fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-1 sm:pb-2 pointer-events-none`}
      >
        <div className="gameboy-ui-container bg-gaming-900/90 border border-gaming-700 rounded-lg p-3 pointer-events-auto">
          <div className="flex items-center justify-between">
            {/* Menu/Joystick (Left) */}
            <div className="joystick relative w-16 h-16 bg-gray-800 rounded-full border-2 border-gray-700 flex items-center justify-center">
              <div 
                className="joystick-handle w-8 h-8 bg-gray-600 rounded-full cursor-pointer"
              >
                <Menu className="text-white m-auto h-6 w-6" />
              </div>
            </div>
            
            {/* CLIPT Button (Center) */}
            <div 
              onClick={() => navigate('/')}
              className="clipt-button mx-4 p-1 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 cursor-pointer"
            >
              <div className="bg-gaming-900 rounded-full p-3">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 font-bold text-lg px-2">
                  CLIPT
                </span>
              </div>
            </div>
            
            {/* Diamond Buttons (Right) */}
            <div className="diamond-buttons relative w-20 h-20">
              {/* Like/Heart Button (Top) */}
              <button 
                data-action="like"
                onClick={handleLike}
                className="absolute top-0 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-gray-800 rounded-full border-2 border-red-500 flex items-center justify-center"
              >
                <Heart className="text-red-500 h-5 w-5" />
              </button>
              
              {/* Comment Button (Left) */}
              <button 
                data-action="comment"
                onClick={handleComment}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gray-800 rounded-full border-2 border-blue-500 flex items-center justify-center"
              >
                <MessageCircle className="text-blue-500 h-5 w-5" />
              </button>
              
              {/* Trophy Button (Right) */}
              <button 
                data-action="trophy"
                onClick={handleTrophy}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gray-800 rounded-full border-2 border-yellow-500 flex items-center justify-center"
              >
                <Trophy className="text-yellow-500 h-5 w-5" />
              </button>
              
              {/* Follow Button (Bottom) */}
              <button 
                data-action="follow"
                onClick={handleFollow}
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-gray-800 rounded-full border-2 border-green-500 flex items-center justify-center"
              >
                <UserPlus className="text-green-500 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GameBoyControls;
