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
      toast.error('Please login to like posts');
      return;
    }
    
    if (onAction) onAction('like');
    toast.success('Post liked!');
  };
  
  const handleComment = async () => {
    if (!user) {
      toast.error('Please login to comment');
      return;
    }
    
    if (postId) {
      openComments(postId);
    } else {
      toast.error('Cannot comment on this post');
    }
    
    if (onAction) onAction('comment');
  };
  
  const handleFollow = async () => {
    if (!user) {
      toast.error('Please login to follow users');
      return;
    }
    
    if (onAction) onAction('follow');
    toast.success('User followed!');
  };
  
  const handleRank = async () => {
    if (!user) {
      toast.error('Please login to rank posts');
      return;
    }
    
    if (onAction) onAction('rank');
    toast.success('Post ranked!');
  };

  return (
    <div className="relative w-[80px] h-[80px] flex items-center justify-center">
      {/* Heart button (Y position - top) */}
      <button
        onClick={() => {
          handleLike();
          if (onAction) onAction('like');
        }}
        className="absolute -top-6 left-1/2 -translate-x-1/2 w-[34px] h-[34px] rounded-full 
                  bg-black flex items-center justify-center shadow-lg 
                  border-2 border-red-500 animate-glow"
        aria-label="Like"
      >
        <div className="text-red-500">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
              fill="currentColor" 
            />
          </svg>
        </div>
      </button>
      
      {/* Message button (X position - left) */}
      <button
        onClick={() => {
          handleComment();
          if (onAction) onAction('comment');
        }}
        className="absolute top-1/2 -left-6 -translate-y-1/2 w-[34px] h-[34px] rounded-full 
                  bg-black flex items-center justify-center shadow-lg 
                  border-2 border-blue-500 animate-glow"
        aria-label="Comment"
      >
        <div className="text-blue-500">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" 
              fill="currentColor" 
            />
          </svg>
        </div>
      </button>
      
      {/* Follow button (B position - right) */}
      <button
        onClick={() => {
          handleFollow();
          if (onAction) onAction('follow');
        }}
        className="absolute top-1/2 -right-6 -translate-y-1/2 w-[34px] h-[34px] rounded-full 
                  bg-black flex items-center justify-center shadow-lg 
                  border-2 border-green-500 animate-glow"
        aria-label="Follow"
      >
        <div className="text-green-500">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" 
              fill="currentColor" 
            />
          </svg>
        </div>
      </button>
      
      {/* Trophy button (A position - bottom) */}
      <button
        onClick={() => {
          handleRank();
          if (onAction) onAction('rank');
        }}
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[34px] h-[34px] rounded-full 
                  bg-black flex items-center justify-center shadow-lg 
                  border-2 border-yellow-500 animate-glow"
        aria-label="Rank"
      >
        <div className="text-yellow-500">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2z" 
              fill="currentColor" 
            />
          </svg>
        </div>
      </button>
      
      {/* POST button - positioned lower */}
      <button
        onClick={() => navigate('/post/new')}
        className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[34px] h-[34px] rounded-full 
                  flex items-center justify-center shadow-md
                  border-2 border-purple-500 bg-black"
        aria-label="Post"
      >
        <div className="text-purple-500">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1c.61 0 1.1-.49 1.1-1.1s-.49-1.1-1.1-1.1zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" 
              fill="currentColor"
            />
            <path 
              d="M20 4h-3.17l-1.86-2H9.03L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" 
              fill="currentColor" 
            />
          </svg>
        </div>
        <span className="absolute text-[9px] font-bold text-purple-500 -bottom-5">POST</span>
      </button>
    </div>
  );
};

export default ActionButtons;
