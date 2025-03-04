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
    <div className="relative w-[90px] h-[90px]">
      {/* Heart button (top) - red */}
      <button
        onClick={handleLike}
        className="absolute -top-4 left-1/2 -translate-x-1/2 w-[36px] h-[36px] rounded-full 
                  bg-black border-2 border-red-500 shadow-sm"
        aria-label="Like"
      >
      </button>
      
      {/* Message button (left) - blue */}
      <button
        onClick={handleComment}
        className="absolute top-1/2 -translate-y-1/2 -left-4 w-[36px] h-[36px] rounded-full 
                  bg-black border-2 border-blue-500 shadow-sm"
        aria-label="Comment"
      >
      </button>
      
      {/* Follow button (right) - green */}
      <button
        onClick={handleFollow}
        className="absolute top-1/2 -translate-y-1/2 -right-4 w-[36px] h-[36px] rounded-full 
                  bg-black border-2 border-green-500 shadow-sm"
        aria-label="Follow"
      >
      </button>
      
      {/* Trophy button (bottom) - yellow */}
      <button
        onClick={handleRank}
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[36px] h-[36px] rounded-full 
                  bg-black border-2 border-yellow-500 shadow-sm"
        aria-label="Rank"
      >
      </button>
      
      {/* POST button - purple */}
      <button
        onClick={() => navigate('/post/new')}
        className="absolute -bottom-16 left-1/2 -translate-x-1/2 rounded-full
                  flex items-center justify-center
                  bg-black border-2 border-purple-500 w-[36px] h-[36px]"
        aria-label="Post"
      >
        <span className="absolute -bottom-5 text-[9px] font-bold text-purple-500">POST</span>
      </button>
    </div>
  );
};

export default ActionButtons;
