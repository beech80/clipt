import React, { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ActionButtonsProps {
  postId: string;
  onAction?: (action: string) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ postId, onAction }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Debug logging for postId
  useEffect(() => {
    console.log("ActionButtons received postId:", postId);
  }, [postId]);

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      // Check if user already liked this post
      const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
        
        toast.success('Unliked post');
      } else {
        // Like
        await supabase
          .from('likes')
          .insert([{ user_id: user.id, post_id: postId }]);
        
        toast.success('Liked post!');
      }
    } catch (error) {
      toast.error('Failed to like post. Please try again.');
    }
  };

  const handleComment = () => {
    console.log("Comment button clicked, postId:", postId);
    
    if (postId) {
      // Check if already on post page
      const currentPath = window.location.pathname;
      const postPath = `/post/${postId}`;
      
      if (currentPath === postPath) {
        // If already on post page, find the post element and scroll to comments
        const postElement = document.querySelector('.gaming-card');
        if (postElement) {
          // Find comment button in PostItem and trigger click event
          const commentBtn = document.querySelector('.comment-btn');
          if (commentBtn && commentBtn instanceof HTMLElement) {
            commentBtn.click();
          } else {
            toast.info('Scroll down to view comments');
            // Scroll to the bottom of the post where comments would be
            window.scrollTo({
              top: postElement.getBoundingClientRect().bottom,
              behavior: 'smooth'
            });
          }
        } else {
          toast.error('Could not find comments section');
        }
      } else {
        // Navigate to the post page with comments hash
        navigate(`/post/${postId}#comments`);
        toast.success('Opening comments');
      }
    } else {
      toast.error('Cannot open comments for this post');
    }
  };

  const handleFollow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      // Get post creator id
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();
      
      if (!post) {
        toast.error('Post not found');
        return;
      }

      // Check if user already follows this creator
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', post.user_id)
        .single();

      if (existingFollow) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', post.user_id);
        
        toast.success('Unfollowed user');
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert([{ follower_id: user.id, following_id: post.user_id }]);
        
        toast.success('Now following user!');
      }
    } catch (error) {
      toast.error('Failed to follow. Please try again.');
    }
  };

  const handleRank = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      // Check if user already ranked this post
      const { data: existingVote } = await supabase
        .from('clip_votes')
        .select('*')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();

      if (existingVote) {
        // Remove rank
        await supabase
          .from('clip_votes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
        
        toast.success('Rank removed');
      } else {
        // Rank
        await supabase
          .from('clip_votes')
          .insert([{ user_id: user.id, post_id: postId }]);
        
        toast.success('Clip ranked!');
      }
    } catch (error) {
      toast.error('Failed to rank clip. Please try again.');
    }
  };

  // Modern button style with glass morphism and gradients
  const modernButtonStyle = `
    w-[32px] h-[32px] 
    flex items-center justify-center 
    active:scale-95 transition-all duration-300
    bg-gradient-to-br from-gray-900 to-black
    rounded-full
    backdrop-blur
    border border-gray-800
    shadow-lg
    hover:shadow-xl hover:scale-105
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50
  `;

  // Custom modern SVG icons
  const HeartIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow(0 2px 3px rgba(0,0,0,0.4))">
      <path 
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
        fill="url(#heartGradient)" 
        stroke="none" 
      />
      <defs>
        <linearGradient id="heartGradient" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF5D8F" />
          <stop offset="100%" stopColor="#FF385F" />
        </linearGradient>
      </defs>
    </svg>
  );

  const CommentIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow(0 2px 3px rgba(0,0,0,0.4))">
      <path 
        d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" 
        fill="url(#commentGradient)" 
        stroke="none" 
      />
      <defs>
        <linearGradient id="commentGradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4B7BFA" />
          <stop offset="100%" stopColor="#2F5EC4" />
        </linearGradient>
      </defs>
    </svg>
  );

  const UserIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow(0 2px 3px rgba(0,0,0,0.4))">
      <path 
        d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" 
        fill="url(#userGradient)" 
        stroke="none" 
      />
      <defs>
        <linearGradient id="userGradient" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#36D07B" />
          <stop offset="100%" stopColor="#27AE60" />
        </linearGradient>
      </defs>
    </svg>
  );

  const TrophyIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow(0 2px 3px rgba(0,0,0,0.4))">
      <path 
        d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2z" 
        fill="url(#trophyGradient)" 
        stroke="none" 
      />
      <defs>
        <linearGradient id="trophyGradient" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F9D423" />
          <stop offset="100%" stopColor="#F1C40F" />
        </linearGradient>
      </defs>
    </svg>
  );

  const CameraIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow(0 1px 2px rgba(0,0,0,0.5))">
      <path 
        d="M12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1c.61 0 1.1-.49 1.1-1.1s-.49-1.1-1.1-1.1zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" 
        fill="white" 
      />
      <path 
        d="M20 4h-3.17l-1.86-2H9.03L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" 
        fill="white" 
      />
    </svg>
  );

  return (
    <div className="relative w-[70px] h-[70px] flex items-center justify-center">
      {/* Heart button (Y position - top) */}
      <button
        onClick={() => {
          handleLike();
          if (onAction) onAction('like');
        }}
        className={`${modernButtonStyle} absolute -top-5 left-1/2 -translate-x-1/2 focus:ring-red-500`}
        aria-label="Like"
        style={{background: "linear-gradient(145deg, #111, #000)"}}
      >
        <HeartIcon />
      </button>
      
      {/* Message button (X position - left) */}
      <button
        onClick={() => {
          handleComment();
          if (onAction) onAction('comment');
        }}
        className={`${modernButtonStyle} absolute top-1/2 -left-5 -translate-y-1/2 focus:ring-blue-500`}
        aria-label="Comment"
        style={{background: "linear-gradient(145deg, #111, #000)"}}
      >
        <CommentIcon />
      </button>
      
      {/* Follow button (B position - right) */}
      <button
        onClick={() => {
          handleFollow();
          if (onAction) onAction('follow');
        }}
        className={`${modernButtonStyle} absolute top-1/2 -right-5 -translate-y-1/2 focus:ring-green-500`}
        aria-label="Follow"
        style={{background: "linear-gradient(145deg, #111, #000)"}}
      >
        <UserIcon />
      </button>
      
      {/* Trophy button (A position - bottom) */}
      <button
        onClick={() => {
          handleRank();
          if (onAction) onAction('rank');
        }}
        className={`${modernButtonStyle} absolute -bottom-5 left-1/2 -translate-x-1/2 focus:ring-yellow-500`}
        aria-label="Rank"
        style={{background: "linear-gradient(145deg, #111, #000)"}}
      >
        <TrophyIcon />
      </button>
      
      {/* POST button - positioned below the button diamond */}
      <button
        onClick={() => navigate('/post/new')}
        className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-[32px] h-[32px] bg-gradient-to-r from-purple-600 to-purple-800 rounded-full flex items-center justify-center active:scale-95 transition-all duration-300 hover:shadow-lg hover:scale-105 shadow-md"
        aria-label="Post"
        style={{background: "linear-gradient(145deg, #9C27B0, #7B1FA2)"}}
      >
        <CameraIcon />
        <span className="absolute text-[8px] font-bold text-white -bottom-5 drop-shadow-sm">POST</span>
      </button>
    </div>
  );
};

export default ActionButtons;
