
/**
 * Enhanced button handlers for GameBoy controller buttons
 * These functions work with any post structure on the home and clipts pages
 */

import { useComments } from '@/contexts/CommentContext';

/**
 * Handle like button click with improved post/button detection
 */
export const enhancedHandleLike = (currentPostId: string | null) => {
  if (!currentPostId) {
    console.error('No post selected', { currentPostId });
    return false;
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
      
      return true;
    } else {
      console.error('Like button not found on post', { currentPostId, targetPost });
    }
  } else {
    console.error('Target post not found', { currentPostId });
  }
  
  return false;
};

/**
 * Handle comment button click with improved post/button detection
 * Enhanced to use CommentContext for more reliable interaction
 */
export const enhancedHandleComment = (currentPostId: string | null) => {
  if (!currentPostId) {
    console.error('No post selected', { currentPostId });
    return false;
  }
  
  console.log('Comment on post:', currentPostId);
  
  // First try to use the CommentContext if available in the global window object
  if (typeof window !== 'undefined') {
    try {
      // Try to access the openComments function from CommentContext via a custom event
      const commentEvent = new CustomEvent('gameboy_open_comments', { 
        detail: { postId: currentPostId }
      });
      window.dispatchEvent(commentEvent);
      
      // Wait a short moment and check if our event was handled
      setTimeout(() => {
        if ((window as any).__commentEventHandled) {
          console.log('Comment opened via context');
          delete (window as any).__commentEventHandled;
        }
      }, 50);
      
      // We'll return true assuming the event was dispatched
      return true;
    } catch (error) {
      console.error('Error using CommentContext approach:', error);
    }
  }
  
  // Fallback to DOM method if context approach doesn't work
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
      'button:has([data-feather="message-circle"])',
      'button:has(.message-square)',
      'button:has([data-icon="message-square"])'
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
      
      console.log('Comment button clicked via DOM method');
      return true;
    } else {
      console.error('Comment button not found on post', { currentPostId, targetPost });
    }
  } else {
    console.error('Target post not found for commenting', { currentPostId });
  }
  
  return false;
};

/**
 * Handle follow button click with improved post/button detection
 */
export const enhancedHandleFollow = (currentPostId: string | null) => {
  if (!currentPostId) {
    console.error('No post selected', { currentPostId });
    return false;
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
      
      return true;
    }
  }
  
  return false;
};

/**
 * Handle trophy button click with improved post/button detection
 */
export const enhancedHandleTrophy = (currentPostId: string | null) => {
  if (!currentPostId) {
    console.error('No post selected', { currentPostId });
    return false;
  }
  
  console.log('Trophy for post:', currentPostId);
  
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
    
    let trophyButton: Element | null = null;
    
    for (const selector of trophyButtonSelectors) {
      try {
        const button = targetPost.querySelector(selector);
        if (button) {
          trophyButton = button;
          console.log('Found trophy button with selector:', selector);
          break;
        }
      } catch (err) {
        console.error('Error finding trophy button with selector:', selector, err);
      }
    }
    
    if (trophyButton) {
      // Trigger the button
      trophyButton.dispatchEvent(new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      }));
      
      return true;
    }
  }
  
  return false;
};
