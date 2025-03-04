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
      {/* Red button - top position */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <button
          onClick={handleLike}
          className="w-[24px] h-[24px] rounded-full bg-red-600 shadow-[0_0_3px_rgba(220,38,38,0.5)]"
          aria-label="Like"
        ></button>
      </div>
      
      {/* Blue button - left position */}
      <div className="absolute top-1/2 -left-3 -translate-y-1/2">
        <button
          onClick={handleComment}
          className="w-[24px] h-[24px] rounded-full bg-blue-600 shadow-[0_0_3px_rgba(37,99,235,0.5)]"
          aria-label="Comment"
        ></button>
      </div>
      
      {/* Green button - right position */}
      <div className="absolute top-1/2 -right-3 -translate-y-1/2">
        <button
          onClick={handleFollow}
          className="w-[24px] h-[24px] rounded-full bg-green-600 shadow-[0_0_3px_rgba(22,163,74,0.5)]"
          aria-label="Follow"
        ></button>
      </div>
      
      {/* Yellow button - bottom position */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
        <button
          onClick={handleRank}
          className="w-[24px] h-[24px] rounded-full bg-yellow-500 shadow-[0_0_3px_rgba(234,179,8,0.5)]"
          aria-label="Rank"
        ></button>
      </div>
      
      {/* Purple POST button - below the diamond */}
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
        <button
          onClick={() => navigate('/post/new')}
          className="w-[24px] h-[24px] rounded-full bg-purple-600 shadow-[0_0_3px_rgba(147,51,234,0.5)]"
          aria-label="Post"
        ></button>
        <span className="absolute -bottom-4 text-[8px] font-bold text-purple-300 left-1/2 -translate-x-1/2">POST</span>
      </div>
    </div>
  );
};

export default ActionButtons;
