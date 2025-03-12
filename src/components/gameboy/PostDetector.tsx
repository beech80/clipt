import React, { useEffect } from 'react';
import { toast } from 'sonner';

interface PostDetectorProps {
  currentPostId: string | null;
  setCurrentPostId: (id: string | null) => void;
}

/**
 * Component that handles post detection in the viewport
 * This helps the GameBoy controller buttons know which post to interact with
 */
const PostDetector: React.FC<PostDetectorProps> = ({ 
  currentPostId, 
  setCurrentPostId 
}) => {
  // Set up post detection on mount
  useEffect(() => {
    console.log('Setting up post detection');
    
    // Function to detect and select the most visible post
    const detectAndSelectCurrentPost = () => {
      // Find all posts on the page with multiple selectors to work across different pages
      const allPosts = [
        ...Array.from(document.querySelectorAll('[data-post-id]')),
        ...Array.from(document.querySelectorAll('.post-card')),
        ...Array.from(document.querySelectorAll('.post-container'))
      ];
      
      // Filter out duplicates
      const uniquePosts = Array.from(new Set(allPosts));
      
      if (uniquePosts.length === 0) {
        console.log('No posts found on current page');
        return;
      }
      
      console.log(`Found ${uniquePosts.length} posts on the page`);
      
      // Find the post most visible in the viewport
      let mostVisiblePost: Element | null = null;
      let maxVisibility = 0;
      
      uniquePosts.forEach(post => {
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
          uniquePosts.forEach(post => post.classList.remove('gameboy-selected-post'));
          mostVisiblePost.classList.add('gameboy-selected-post');
          
          // Apply a subtle toast notification
          toast('Post selected');
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
  }, [currentPostId, setCurrentPostId]);

  return null; // This is a non-visual component
};

export default PostDetector;
