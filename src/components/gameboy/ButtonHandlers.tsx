/**
 * Enhanced button handlers for GameBoy controller buttons
 * These functions work with any post structure on the home and clipts pages
 */

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
 */
export const enhancedHandleComment = (currentPostId: string | null) => {
  if (!currentPostId) {
    console.error('No post selected', { currentPostId });
    return false;
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
      
      return true;
    }
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
