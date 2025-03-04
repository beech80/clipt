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
    <div className="relative w-[80px] h-[80px]">
      {/* Red heart button - top position */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <button
          onClick={handleLike}
          className="w-[24px] h-[24px] rounded-full bg-red-600 shadow-[0_0_3px_rgba(220,38,38,0.5)] flex items-center justify-center"
          aria-label="Like"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>
      
      {/* Blue message button - left position */}
      <div className="absolute top-1/2 -left-3 -translate-y-1/2">
        <button
          onClick={handleComment}
          className="w-[24px] h-[24px] rounded-full bg-blue-600 shadow-[0_0_3px_rgba(37,99,235,0.5)] flex items-center justify-center"
          aria-label="Comment"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      </div>
      
      {/* Green follow button - right position */}
      <div className="absolute top-1/2 -right-3 -translate-y-1/2">
        <button
          onClick={handleFollow}
          className="w-[24px] h-[24px] rounded-full bg-green-600 shadow-[0_0_3px_rgba(22,163,74,0.5)] flex items-center justify-center"
          aria-label="Follow"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
        </button>
      </div>
      
      {/* Yellow trophy button - bottom position */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
        <button
          onClick={handleRank}
          className="w-[24px] h-[24px] rounded-full bg-yellow-500 shadow-[0_0_3px_rgba(234,179,8,0.5)] flex items-center justify-center"
          aria-label="Rank"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
            <path d="M4 22h16"></path>
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
          </svg>
        </button>
      </div>
      
      {/* Purple camera POST button - below the diamond */}
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
        <button
          onClick={() => navigate('/post/new')}
          className="w-[24px] h-[24px] rounded-full bg-purple-600 shadow-[0_0_3px_rgba(147,51,234,0.5)] flex items-center justify-center"
          aria-label="Post"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
        </button>
        <span className="absolute -bottom-4 text-[8px] font-bold text-purple-300 left-1/2 -translate-x-1/2">POST</span>
      </div>
    </div>
  );
};

export default ActionButtons;
