import React, { useEffect, useState } from 'react';

interface Post {
  id: string;
  element: HTMLElement;
}

export const usePostDetector = (enabled: boolean = true) => {
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  // Find all posts on the page
  useEffect(() => {
    if (!enabled) return;
    
    const findPosts = () => {
      const postElements = document.querySelectorAll('[data-post-id]');
      const newPosts: Post[] = [];
      
      postElements.forEach((element) => {
        const postId = element.getAttribute('data-post-id');
        if (postId) {
          newPosts.push({
            id: postId,
            element: element as HTMLElement,
          });
        }
      });
      
      setPosts(newPosts);
    };
    
    // Find posts initially and when DOM changes
    const observer = new MutationObserver(findPosts);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
    
    // Initial search
    findPosts();
    
    return () => {
      observer.disconnect();
    };
  }, [enabled]);

  // Detect which post is most visible in the viewport
  useEffect(() => {
    if (!enabled || posts.length === 0) return;
    
    const checkVisiblePosts = () => {
      let maxVisiblePost: Post | null = null;
      let maxVisibleArea = 0;
      
      posts.forEach((post) => {
        const rect = post.element.getBoundingClientRect();
        const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
        
        if (visibleHeight > maxVisibleArea && visibleHeight > 0) {
          maxVisibleArea = visibleHeight;
          maxVisiblePost = post;
        }
      });
      
      setActivePost(maxVisiblePost);
    };
    
    window.addEventListener('scroll', checkVisiblePosts);
    // Check initially
    checkVisiblePosts();
    
    return () => {
      window.removeEventListener('scroll', checkVisiblePosts);
    };
  }, [posts, enabled]);

  return activePost;
};

export default usePostDetector;
