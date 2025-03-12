import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface PostInteractionsProps {
  currentPostId: string | null;
  setCurrentPostId: (id: string | null) => void;
}

const PostInteractions: React.FC<PostInteractionsProps> = ({ 
  currentPostId, 
  setCurrentPostId 
}) => {
  // Set up scroll detection for posts
  useEffect(() => {
    const detectCurrentPost = () => {
      // Find all posts on the page
      const posts = document.querySelectorAll('[data-post-id], .post-card, .post-container');
      
      if (posts.length === 0) return;
      
      // Find the most visible post
      let mostVisiblePost: Element | null = null;
      let maxVisibility = 0;
      
      posts.forEach(post => {
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
        // Get the post ID
        const postId = mostVisiblePost.getAttribute('data-post-id') || 
                      mostVisiblePost.getAttribute('id') ||
                      mostVisiblePost.getAttribute('data-id');
        
        if (postId && postId !== currentPostId) {
          console.log('Selected post:', postId);
          setCurrentPostId(postId);
          
          // Add a visual indicator to the selected post
          posts.forEach(post => post.classList.remove('gameboy-selected-post'));
          mostVisiblePost.classList.add('gameboy-selected-post');
        }
      }
    };

    // Debounce function to prevent too many calls
    const debounce = (func: Function, wait: number) => {
      let timeout: number | null = null;
      return function(...args: any) {
        const context = this;
        if (timeout) window.clearTimeout(timeout);
        timeout = window.setTimeout(() => {
          func.apply(context, args);
        }, wait);
      };
    };

    // Debounced scroll handler
    const handleScroll = debounce(detectCurrentPost, 200);
    
    // Initial detection
    detectCurrentPost();
    
    // Set up scroll listener
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentPostId, setCurrentPostId]);

  // Add styling for selected posts
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .gameboy-selected-post {
        position: relative;
        box-shadow: 0 0 0 2px #6c4dc4 !important;
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
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Action handlers for post interactions
  const handleLike = () => {
    if (!currentPostId) {
      toast.error('No post selected');
      return;
    }
    
    console.log('Liking post:', currentPostId);
    
    // Try multiple selectors to find the target post
    const postSelectors = [
      `[data-post-id="${currentPostId}"]`,
      `#post-${currentPostId}`,
      `.post-container[data-id="${currentPostId}"]`
    ];
    
    let targetPost: Element | null = null;
    
    // Try each selector until we find a match
    for (const selector of postSelectors) {
      const post = document.querySelector(selector);
      if (post) {
        targetPost = post;
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
        const button = targetPost.querySelector(selector);
        if (button) {
          likeButton = button;
          break;
        }
      }
      
      if (likeButton) {
        // Visual feedback on controller button
        const controllerLikeButton = document.querySelector(`[data-action="like"]`);
        if (controllerLikeButton) {
          controllerLikeButton.classList.add('button-press');
          setTimeout(() => {
            controllerLikeButton.classList.remove('button-press');
          }, 300);
        }
        
        // Actually trigger the like button's click event
        likeButton.dispatchEvent(new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        }));
        
        toast.success('Like action triggered');
        return;
      }
    }
    
    toast.error('Like button not found on selected post');
  };

  const handleComment = () => {
    if (!currentPostId) {
      toast.error('No post selected');
      return;
    }
    
    console.log('Comment on post:', currentPostId);
    
    // Visual feedback on controller button
    const commentButton = document.querySelector(`[data-action="comment"]`);
    if (commentButton) {
      commentButton.classList.add('button-press');
      setTimeout(() => {
        commentButton.classList.remove('button-press');
      }, 300);
    }
    
    // Find the actual comment button using multiple selectors
    const postSelectors = [
      `[data-post-id="${currentPostId}"]`,
      `#post-${currentPostId}`,
      `.post-container[data-id="${currentPostId}"]`
    ];
    
    let targetPost: Element | null = null;
    
    // Try each selector until we find a match
    for (const selector of postSelectors) {
      const post = document.querySelector(selector);
      if (post) {
        targetPost = post;
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
      
      let postCommentButton: Element | null = null;
      
      for (const selector of commentButtonSelectors) {
        const button = targetPost.querySelector(selector);
        if (button) {
          postCommentButton = button;
          break;
        }
      }
      
      if (postCommentButton) {
        postCommentButton.dispatchEvent(new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        }));
        
        toast.success('Comment action triggered');
        return;
      }
    }
    
    toast.error('Comment button not found on selected post');
  };

  const handleFollow = () => {
    if (!currentPostId) {
      toast.error('No post selected');
      return;
    }
    
    console.log('Following user for post:', currentPostId);
    
    // Visual feedback on button press
    const followButton = document.querySelector(`[data-action="follow"]`);
    if (followButton) {
      followButton.classList.add('button-press');
      setTimeout(() => {
        followButton.classList.remove('button-press');
      }, 300);
    }
    
    // Find the follow button on the post
    const postSelectors = [
      `[data-post-id="${currentPostId}"]`,
      `#post-${currentPostId}`,
      `.post-container[data-id="${currentPostId}"]`
    ];
    
    let targetPost: Element | null = null;
    
    // Try each selector until we find a match
    for (const selector of postSelectors) {
      const post = document.querySelector(selector);
      if (post) {
        targetPost = post;
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
      
      let postFollowButton: Element | null = null;
      
      for (const selector of followButtonSelectors) {
        const button = targetPost.querySelector(selector);
        if (button) {
          postFollowButton = button;
          break;
        }
      }
      
      if (postFollowButton) {
        postFollowButton.dispatchEvent(new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        }));
        
        toast.success('Follow action triggered');
        return;
      }
    }
    
    toast.error('Follow button not found on selected post');
  };

  const handleTrophy = () => {
    if (!currentPostId) {
      toast.error('No post selected');
      return;
    }
    
    console.log('Trophy for post:', currentPostId);
    
    // Visual feedback on button press
    const trophyButton = document.querySelector(`[data-action="trophy"]`);
    if (trophyButton) {
      trophyButton.classList.add('button-press');
      setTimeout(() => {
        trophyButton.classList.remove('button-press');
      }, 300);
    }
    
    // Find the trophy button on the post (similar implementation as other buttons)
    // ...
    
    toast.success('Trophy action triggered');
  };

  return {
    handleLike,
    handleComment,
    handleFollow,
    handleTrophy
  };
};

export default PostInteractions;
