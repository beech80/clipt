import React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useComments } from '@/contexts/CommentContext';
import { toast } from 'sonner';

interface ActionButtonsProps {
  postId?: string;
  onAction?: (action: string) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ postId, onAction }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openComments } = useComments();

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Try to get the post ID using the same detection logic as handleComment
    const isPostPage = window.location.pathname.match(/^\/post\/([^/?#]+)/);
    const isSquadPage = window.location.pathname.includes('/squads/') || window.location.pathname.includes('/squad/');
    
    console.log("[Like] Current URL:", window.location.pathname);
    
    // Try to get the post ID from various sources
    let currentPostId = postId;
    
    // If no postId passed, try to extract it from URL
    if (!currentPostId && isPostPage) {
      const match = window.location.pathname.match(/\/post\/([^/?#]+)/);
      if (match && match[1]) {
        currentPostId = match[1];
        console.log("[Like] Extracted post ID from URL:", currentPostId);
      }
    }
    
    // For squad posts that might have a different URL pattern
    if (!currentPostId && isSquadPage) {
      const match = window.location.pathname.match(/\/squad(?:s)?\/([^/?#]+)/);
      if (match && match[1]) {
        currentPostId = match[1];
        console.log("[Like] Extracted squad post ID from URL:", currentPostId);
      }
    }
    
    // Try to get post ID from the DOM if we still don't have it
    if (!currentPostId) {
      // Look for data attributes that might contain post ID
      const postElement = document.querySelector('[data-post-id]');
      if (postElement instanceof HTMLElement && postElement.dataset.postId) {
        currentPostId = postElement.dataset.postId;
        console.log("[Like] Found post ID in DOM:", currentPostId);
      }
    }

    if (!currentPostId) {
      toast.error('No post selected to like');
      return;
    }

    try {
      // Check if user already liked this post
      const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', user.id)
        .eq('post_id', currentPostId)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', currentPostId);
        
        toast.success('Unliked post');
      } else {
        // Like
        await supabase
          .from('likes')
          .insert([{ user_id: user.id, post_id: currentPostId }]);
        
        toast.success('Liked post!');
      }
      
      // Refresh any post data that might be in view
      const postElement = document.querySelector(`[data-post-id="${currentPostId}"]`);
      if (postElement) {
        // Add a temporary visual feedback
        postElement.classList.add('liked-pulse');
        setTimeout(() => {
          postElement.classList.remove('liked-pulse');
        }, 1000);
      }
      
    } catch (error) {
      toast.error('Failed to like post. Please try again.');
    }
  };

  const handleComment = () => {
    // Check if we're on a post page or squad post page
    const isPostPage = window.location.pathname.match(/^\/post\/([^/?#]+)/);
    const isSquadPage = window.location.pathname.includes('/squads/') || window.location.pathname.includes('/squad/');
    
    console.log("Current URL:", window.location.pathname);
    console.log("Is post page:", isPostPage);
    console.log("Is squad page:", isSquadPage);
    console.log("Current postId prop:", postId);
    
    // Try to get the post ID from various sources
    let currentPostId = postId;
    
    // If no postId passed, try to extract it from URL
    if (!currentPostId && isPostPage) {
      const match = window.location.pathname.match(/\/post\/([^/?#]+)/);
      if (match && match[1]) {
        currentPostId = match[1];
        console.log("Extracted post ID from URL:", currentPostId);
      }
    }
    
    // For squad posts that might have a different URL pattern
    if (!currentPostId && isSquadPage) {
      const match = window.location.pathname.match(/\/squad(?:s)?\/([^/?#]+)/);
      if (match && match[1]) {
        currentPostId = match[1];
        console.log("Extracted squad post ID from URL:", currentPostId);
      }
    }
    
    // Try to get post ID from the DOM if we still don't have it
    if (!currentPostId) {
      // Look for data attributes that might contain post ID
      const postElement = document.querySelector('[data-post-id]');
      if (postElement instanceof HTMLElement && postElement.dataset.postId) {
        currentPostId = postElement.dataset.postId;
        console.log("Found post ID in DOM:", currentPostId);
      }
    }
    
    // If we have a post ID, open the comments modal
    if (currentPostId) {
      console.log("Opening comments modal for post:", currentPostId);
      openComments(currentPostId);
      if (onAction) onAction('comment');
      return;
    }
    
    // Last resort: if we're on what looks like a post page but couldn't extract the ID,
    // try to find the comments section directly
    if (isPostPage || isSquadPage) {
      const commentsSection = document.getElementById('comments');
      if (commentsSection) {
        commentsSection.scrollIntoView({ behavior: 'smooth' });
        toast.success('Comments section opened');
        return;
      }
    }
    
    // If we don't have a postId and aren't on a post/squad page
    toast.info('Navigate to a post to comment');
  };

  const handleFollow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Try to get the post ID using the same detection logic as handleComment
    const isPostPage = window.location.pathname.match(/^\/post\/([^/?#]+)/);
    const isProfilePage = window.location.pathname.match(/^\/profile\/([^/?#]+)/);
    
    console.log("[Follow] Current URL:", window.location.pathname);
    
    // Try to get the post ID from various sources
    let currentPostId = postId;
    
    // If no postId passed, try to extract it from URL
    if (!currentPostId && isPostPage) {
      const match = window.location.pathname.match(/\/post\/([^/?#]+)/);
      if (match && match[1]) {
        currentPostId = match[1];
        console.log("[Follow] Extracted post ID from URL:", currentPostId);
      }
    }
    
    // If we're on a profile page, we can extract the profile ID directly
    if (isProfilePage) {
      const match = window.location.pathname.match(/\/profile\/([^/?#]+)/);
      if (match && match[1]) {
        const profileId = match[1];
        console.log("[Follow] On profile page, using profile ID directly:", profileId);
        
        try {
          // Import the follow-helper dynamically to avoid circular dependencies
          const { followUser } = await import('@/lib/follow-helper');
          const result = await followUser(profileId);
          
          // Success is handled inside followUser with toast notifications
          if (onAction) onAction('follow');
          return;
        } catch (error) {
          console.error("Error following profile directly:", error);
          toast.error("Failed to follow. Please try again.");
          return;
        }
      }
    }
    
    // Try to get post ID from the DOM if we still don't have it
    if (!currentPostId) {
      const postElements = document.querySelectorAll('[data-post-id]');
      if (postElements.length === 1) {
        currentPostId = postElements[0].getAttribute('data-post-id') || '';
        console.log("[Follow] Found post ID in DOM:", currentPostId);
      } else if (postElements.length > 1) {
        // Get the most visible post element
        let mostVisiblePost = null;
        let maxVisibility = 0;
        
        postElements.forEach(element => {
          const rect = element.getBoundingClientRect();
          const visibility = Math.min(
            rect.bottom, window.innerHeight
          ) - Math.max(rect.top, 0);
          
          if (visibility > maxVisibility) {
            maxVisibility = visibility;
            mostVisiblePost = element;
          }
        });
        
        if (mostVisiblePost) {
          currentPostId = mostVisiblePost.getAttribute('data-post-id') || '';
          console.log("[Follow] Using most visible post ID:", currentPostId);
        }
      }
    }
    
    if (!currentPostId) {
      toast.error('Cannot follow: No post or profile selected');
      return;
    }

    try {
      // Get post creator id
      const { data: post } = await supabase
        .from('posts')
        .select('user_id, profiles:user_id(username)')
        .eq('id', currentPostId)
        .single();
      
      if (!post) {
        toast.error('Post not found');
        return;
      }

      // Don't allow following yourself
      if (user.id === post.user_id) {
        toast.error('You cannot follow yourself');
        return;
      }

      // Add pulse animation to the follow button
      const followButton = document.querySelector('.follow-button');
      if (followButton) {
        followButton.classList.add('animate-pulse');
      }

      // Import the follow-helper dynamically to avoid circular dependencies
      const { followUser } = await import('@/lib/follow-helper');
      const result = await followUser(post.user_id);
      
      // Remove animation after completion
      setTimeout(() => {
        if (followButton) {
          followButton.classList.remove('animate-pulse');
        }
      }, 500);
      
      if (onAction) onAction('follow');
    } catch (error) {
      console.error("Error in handleFollow:", error);
      toast.error('Failed to follow. Please try again.');
      
      // Remove animation in case of error
      const followButton = document.querySelector('.follow-button');
      if (followButton) {
        followButton.classList.remove('animate-pulse');
      }
    }
  };

  const handleRank = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Try to get the post ID using the same detection logic as handleComment
    const isPostPage = window.location.pathname.match(/^\/post\/([^/?#]+)/);
    const isSquadPage = window.location.pathname.includes('/squads/') || window.location.pathname.includes('/squad/');
    
    console.log("[Rank] Current URL:", window.location.pathname);
    
    // Try to get the post ID from various sources
    let currentPostId = postId;
    
    // If no postId passed, try to extract it from URL
    if (!currentPostId && isPostPage) {
      const match = window.location.pathname.match(/\/post\/([^/?#]+)/);
      if (match && match[1]) {
        currentPostId = match[1];
        console.log("[Rank] Extracted post ID from URL:", currentPostId);
      }
    }
    
    // For squad posts that might have a different URL pattern
    if (!currentPostId && isSquadPage) {
      const match = window.location.pathname.match(/\/squad(?:s)?\/([^/?#]+)/);
      if (match && match[1]) {
        currentPostId = match[1];
        console.log("[Rank] Extracted squad post ID from URL:", currentPostId);
      }
    }
    
    // Try to get post ID from the DOM if we still don't have it
    if (!currentPostId) {
      // Look for data attributes that might contain post ID
      const postElement = document.querySelector('[data-post-id]');
      if (postElement instanceof HTMLElement && postElement.dataset.postId) {
        currentPostId = postElement.dataset.postId;
        console.log("[Rank] Found post ID in DOM:", currentPostId);
      }
    }

    if (!currentPostId) {
      toast.error('No post selected to rank');
      return;
    }

    try {
      // Check if user already ranked this post
      const { data: existingVote } = await supabase
        .from('clip_votes')
        .select('*')
        .eq('user_id', user.id)
        .eq('post_id', currentPostId)
        .single();

      if (existingVote) {
        // Remove rank
        await supabase
          .from('clip_votes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', currentPostId);
        
        toast.success('Rank removed');
      } else {
        // Rank
        await supabase
          .from('clip_votes')
          .insert([{ user_id: user.id, post_id: currentPostId }]);
        
        toast.success('Clip ranked!');
      }
      
      // Refresh any post data that might be in view
      const postElement = document.querySelector(`[data-post-id="${currentPostId}"]`);
      if (postElement) {
        // Add a temporary visual feedback
        postElement.classList.add('ranked-pulse');
        setTimeout(() => {
          postElement.classList.remove('ranked-pulse');
        }, 1000);
      }
      
    } catch (error) {
      toast.error('Failed to rank clip. Please try again.');
    }
  };

  const modernButtonStyle = `
    w-[34px] h-[34px]
    rounded-full
    flex items-center justify-center 
    text-white 
    border border-gray-800
    shadow-lg
    hover:shadow-xl hover:scale-105
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50
  `;

  return (
    <div className="relative w-[70px] h-[70px] flex items-center justify-center">
      {/* Heart button (top) */}
      <button
        onClick={() => {
          handleLike();
          if (onAction) onAction('like');
        }}
        className="absolute -top-5 left-1/2 -translate-x-1/2 w-[32px] h-[32px] rounded-full bg-[#151924] flex items-center justify-center border border-red-500"
        aria-label="Like"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
            fill="#ef4444" 
          />
        </svg>
      </button>
      
      {/* Message button (left) */}
      <button
        onClick={() => {
          handleComment();
          if (onAction) onAction('comment');
        }}
        className="absolute top-1/2 -left-5 -translate-y-1/2 w-[32px] h-[32px] rounded-full bg-[#151924] flex items-center justify-center border border-blue-500"
        aria-label="Comment"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" 
            fill="#3b82f6" 
          />
        </svg>
      </button>
      
      {/* User button (right) */}
      <button
        onClick={() => {
          handleFollow();
          if (onAction) onAction('follow');
        }}
        className="absolute top-1/2 -right-5 -translate-y-1/2 w-[32px] h-[32px] rounded-full bg-[#151924] flex items-center justify-center border border-green-500"
        aria-label="Follow"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" 
            fill="#22c55e" 
          />
        </svg>
      </button>
      
      {/* Trophy button (bottom) */}
      <button
        onClick={() => {
          handleRank();
          if (onAction) onAction('rank');
        }}
        className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-[32px] h-[32px] rounded-full bg-[#151924] flex items-center justify-center border border-yellow-500"
        aria-label="Rank"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2z" 
            fill="#eab308" 
          />
        </svg>
      </button>
      
      {/* POST button */}
      <button
        onClick={() => navigate('/post/new')}
        className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-[32px] h-[32px] rounded-full bg-[#151924] flex items-center justify-center border border-purple-500"
        aria-label="Post"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M12 15.2C13.7674 15.2 15.2 13.7674 15.2 12C15.2 10.2326 13.7674 8.8 12 8.8C10.2326 8.8 8.8 10.2326 8.8 12C8.8 13.7674 10.2326 15.2 12 15.2Z" 
            fill="#a855f7" 
          />
          <path 
            d="M9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z" 
            fill="#a855f7" 
          />
        </svg>
        <span className="absolute text-[9px] font-bold text-purple-500 -bottom-5">POST</span>
      </button>
    </div>
  );
};

export default ActionButtons;
