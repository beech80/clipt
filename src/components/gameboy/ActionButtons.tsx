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
      <div className="absolute -top-5 left-1/2 -translate-x-1/2">
        <button
          onClick={handleLike}
          className="w-[28px] h-[28px] rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]"
          aria-label="Like"
        ></button>
      </div>
      
      {/* Blue comment button - left position */}
      <div className="absolute top-1/2 -left-5 -translate-y-1/2">
        <button
          onClick={handleComment}
          className="w-[28px] h-[28px] rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]"
          aria-label="Comment"
        ></button>
      </div>
      
      {/* Green follow button - right position */}
      <div className="absolute top-1/2 -right-5 -translate-y-1/2">
        <button
          onClick={handleFollow}
          className="w-[28px] h-[28px] rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"
          aria-label="Follow"
        ></button>
      </div>
      
      {/* Yellow trophy button - bottom position */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2">
        <button
          onClick={handleRank}
          className="w-[28px] h-[28px] rounded-full bg-yellow-400 shadow-[0_0_5px_rgba(250,204,21,0.5)]"
          aria-label="Rank"
        ></button>
      </div>
      
      {/* Purple POST button - below the diamond */}
      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
        <button
          onClick={() => navigate('/post/new')}
          className="w-[28px] h-[28px] rounded-full bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.5)] flex flex-col items-center justify-center"
          aria-label="Post"
        ></button>
        <span className="absolute text-[9px] font-bold text-purple-400 mt-1 left-1/2 -translate-x-1/2">POST</span>
      </div>
    </div>
  );
};

export default ActionButtons;
