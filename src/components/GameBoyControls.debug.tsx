import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Direct fix for GameBoy controls post detection 
 * This should be added to your GameBoyControls.tsx file
 */

// Helper function to add data-post-id attributes to all posts
export function fixPostDetection() {
  console.log('Running post detection fix...');
  
  // Find all posts without data-post-id
  const addDataAttributes = () => {
    console.log('Looking for posts that need data-post-id attributes...');
    
    // Add missing post IDs to post containers
    const posts = document.querySelectorAll('.post-container');
    posts.forEach(post => {
      // Check if it already has the attribute
      if (!post.hasAttribute('data-post-id')) {
        // Try to find the post ID from any child element with data-post-id
        const childWithId = post.querySelector('[data-post-id]');
        if (childWithId) {
          const postId = childWithId.getAttribute('data-post-id');
          post.setAttribute('data-post-id', postId || '');
          console.log(`Added data-post-id=${postId} to post container`);
        }
        
        // Find post ID from post-xxx id in children
        if (!post.hasAttribute('data-post-id')) {
          const childWithPostId = post.querySelector('[id^="post-"]');
          if (childWithPostId) {
            const idValue = childWithPostId.getAttribute('id');
            const postId = idValue ? idValue.replace('post-', '') : '';
            post.setAttribute('data-post-id', postId);
            console.log(`Added data-post-id=${postId} to post container from child id`);
          }
        }
      }
    });
    
    // Also inject data-post-id into PostItem components directly
    const postItems = document.querySelectorAll('.post-container:not([data-post-id])');
    postItems.forEach((post, index) => {
      if (!post.hasAttribute('data-post-id')) {
        // Try to find post ID in a more aggressive way
        
        // Look for hidden input with post ID
        const hiddenInput = post.querySelector('input[type="hidden"][name="postId"]');
        if (hiddenInput) {
          const postId = hiddenInput.getAttribute('value');
          post.setAttribute('data-post-id', postId || `post-${index}`);
          console.log(`Added data-post-id=${postId} from hidden input`);
        } 
        // Look for links with post IDs in href
        else {
          const postLink = post.querySelector('a[href*="/post/"]');
          if (postLink) {
            const href = postLink.getAttribute('href') || '';
            const postIdMatch = href.match(/\/post\/([^\/]+)/);
            if (postIdMatch && postIdMatch[1]) {
              post.setAttribute('data-post-id', postIdMatch[1]);
              console.log(`Added data-post-id=${postIdMatch[1]} from link`);
            }
          } else {
            // Last resort - add a generated ID
            post.setAttribute('data-post-id', `generated-${index}`);
            console.log(`Added generated post ID to post without ID`);
          }
        }
      }
    });
    
    const postsWithIds = document.querySelectorAll('[data-post-id]');
    console.log(`Found ${postsWithIds.length} posts with data-post-id attributes`);
  };
  
  // Find the most visible post to select
  const findMostVisiblePost = () => {
    // Make sure we add data attributes first
    addDataAttributes();
    
    // Now find all posts with data-post-id
    const posts = Array.from(document.querySelectorAll('[data-post-id]'));
    
    console.log(`Finding most visible post among ${posts.length} posts`);
    
    if (posts.length === 0) {
      toast.error('No posts found on this page');
      return null;
    }
    
    // Find the post most visible in the viewport
    let mostVisiblePost: Element | null = null;
    let maxVisibility = 0;
    
    posts.forEach(post => {
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
      const postId = mostVisiblePost.getAttribute('data-post-id');
      console.log(`Most visible post: ${postId} (${maxVisibility.toFixed(2)}% visible)`);
      
      // Add a visual indicator to the selected post
      posts.forEach(post => post.classList.remove('gameboy-selected-post'));
      mostVisiblePost.classList.add('gameboy-selected-post');
      
      // Return the post ID
      return postId;
    }
    
    console.log('No visible posts found');
    return null;
  };
  
  // Add the styling if not already present
  const addStyles = () => {
    if (!document.getElementById('gameboy-styles')) {
      const style = document.createElement('style');
      style.id = 'gameboy-styles';
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
          pointer-events: none;
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
      
      console.log('Added gameboy styles to document');
    }
  };
  
  // Initialize everything
  const initialize = () => {
    addStyles();
    
    // Initial detection
    setTimeout(() => {
      findMostVisiblePost();
    }, 500); // Wait for page to load
    
    // Create a debounced scroll handler
    let scrollTimeout: NodeJS.Timeout | null = null;
    
    const debouncedScrollHandler = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      scrollTimeout = setTimeout(() => {
        findMostVisiblePost();
      }, 200);
    };
    
    // Listen for scroll events
    window.addEventListener('scroll', debouncedScrollHandler);
    
    // Set up observer to watch for new posts
    const observer = new MutationObserver((mutations) => {
      let shouldDetect = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldDetect = true;
        }
      });
      
      if (shouldDetect) {
        setTimeout(() => {
          findMostVisiblePost();
        }, 300);
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Return cleanup function
    return () => {
      window.removeEventListener('scroll', debouncedScrollHandler);
      observer.disconnect();
    };
  };
  
  // Return the initialization function
  return initialize;
}

/**
 * Functions to find and click buttons on the selected post
 */

// Function to handle like action
export function handlePostAction(currentPostId: string | null, actionType: 'like' | 'comment' | 'follow' | 'trophy') {
  if (!currentPostId) {
    console.error(`Cannot ${actionType} post: No post selected`);
    toast.error(`No post selected. Try scrolling to a post first.`);
    return false;
  }
  
  // Ensure all posts have data-post-id attributes
  const addDataAttributes = () => {
    console.log('Ensuring all posts have data-post-id attributes...');
    
    // Add missing post IDs to post containers
    const posts = document.querySelectorAll('.post-container');
    posts.forEach(post => {
      // Check if it already has the attribute
      if (!post.hasAttribute('data-post-id')) {
        // Try to find the post ID from any child element with data-post-id
        const childWithId = post.querySelector('[data-post-id]');
        if (childWithId) {
          const postId = childWithId.getAttribute('data-post-id');
          post.setAttribute('data-post-id', postId || '');
        }
      }
    });
  };
  
  // Make sure all posts have data attributes
  addDataAttributes();
  
  console.log(`Handling ${actionType} action for post:`, currentPostId);
  
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
        console.log('Found target post with selector:', selector);
        break;
      }
    } catch (error) {
      console.error(`Error with selector ${selector}:`, error);
    }
  }
  
  if (!targetPost) {
    console.log('Target post not found, trying with all posts...');
    
    // Last resort: find all posts with visible IDs
    const allPosts = document.querySelectorAll('[data-post-id], .post-container');
    
    // See if any of them match our current post ID
    allPosts.forEach(post => {
      const postId = post.getAttribute('data-post-id');
      if (postId === currentPostId) {
        targetPost = post;
        console.log('Found target post by iterating through all posts');
      }
    });
    
    // If we still don't have a target post, use the first visible post
    if (!targetPost && allPosts.length > 0) {
      targetPost = allPosts[0];
      console.log('Using first visible post as target');
    }
  }
  
  if (targetPost) {
    // Determine button selectors based on action type
    let buttonSelectors: string[] = [];
    
    switch (actionType) {
      case 'like':
        buttonSelectors = [
          '.like-button', 
          'button:has(svg[data-feather="heart"]), button:has(svg.lucide-heart)',
          'button:has(.heart-icon)',
          'button:has(.like-icon)',
          'button.heart-btn',
          'button[aria-label="Like post"]'
        ];
        break;
      case 'comment':
        buttonSelectors = [
          '.comment-button', 
          'button:has(svg[data-feather="message-circle"]), button:has(svg.lucide-message-circle)',
          'button:has(.comment-icon)',
          'button.comment-btn',
          'button[aria-label="Comment on post"]'
        ];
        break;
      case 'follow':
        buttonSelectors = [
          '.follow-button', 
          'button:has(svg[data-feather="user-plus"]), button:has(svg.lucide-user-plus)',
          'button:has(.follow-icon)',
          'button.follow-btn',
          'button[aria-label="Follow user"]'
        ];
        break;
      case 'trophy':
        buttonSelectors = [
          '.trophy-button', 
          'button:has(svg[data-feather="trophy"]), button:has(svg.lucide-trophy)',
          'button:has(.trophy-icon)',
          'button.trophy-btn',
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
          console.log(`Found ${actionType} button with selector:`, selector);
          break;
        }
      } catch (err) {
        console.error(`Error finding ${actionType} button with selector:`, selector, err);
      }
    }
    
    // If we didn't find a button in the post, check the entire document
    if (!actionButton) {
      console.log(`Button not found in post, looking globally...`);
      
      for (const selector of buttonSelectors) {
        try {
          const buttons = document.querySelectorAll(selector);
          buttons.forEach(button => {
            // Check if this button is related to our target post
            const closestPost = button.closest('[data-post-id]');
            if (closestPost && closestPost.getAttribute('data-post-id') === currentPostId) {
              actionButton = button;
              console.log(`Found ${actionType} button globally with selector:`, selector);
            }
          });
          
          if (actionButton) break;
        } catch (err) {
          console.error(`Error finding global ${actionType} button with selector:`, selector, err);
        }
      }
    }
    
    if (actionButton) {
      console.log(`Clicking ${actionType} button:`, actionButton);
      
      // Actually trigger the button's click event
      actionButton.dispatchEvent(new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      }));
      
      toast.success(`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} action triggered`);
      return true;
    } else {
      console.error(`${actionType} button not found on post`, { currentPostId, targetPost });
      toast.error(`Could not find ${actionType} button. Try scrolling to a different post.`);
    }
  } else {
    console.error('Target post not found', { currentPostId });
    toast.error('Post not found. Try scrolling to make sure a post is visible.');
  }
  
  return false;
}

// Export a utility that can be used to find the current post and interact with it
export const GameBoyPostHelpers = {
  fixPostDetection,
  handlePostAction
};

export default GameBoyPostHelpers;
