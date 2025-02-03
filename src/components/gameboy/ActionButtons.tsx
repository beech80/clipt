import React, { useState } from 'react';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import LikeButton from './actions/LikeButton';
import CommentButton from './actions/CommentButton';
import FollowButton from './actions/FollowButton';
import RankButton from './actions/RankButton';
import PostButton from './actions/PostButton';
import CommentDialog from './actions/CommentDialog';

interface ActionButtonsProps {
  onAction: (action: string) => void;
  postId: string;
}

const ActionButtons = ({ onAction, postId }: ActionButtonsProps) => {
  const { user } = useAuth();
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [comment, setComment] = useState('');

  const handleCommentSubmit = async () => {
    if (!user) {
      toast.error("Please login to comment");
      return;
    }

    if (!comment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      await supabase
        .from('comments')
        .insert([{
          post_id: postId,
          user_id: user.id,
          content: comment.trim()
        }]);
      
      toast.success("Comment added successfully!");
      setComment('');
      setIsCommentOpen(false);
      onAction('comment');
    } catch (error) {
      toast.error("Error adding comment");
    }
  };

  return (
    <>
      <LikeButton postId={postId} onAction={onAction} />
      <CommentButton onClick={() => setIsCommentOpen(true)} />
      <FollowButton postId={postId} onAction={onAction} />
      <RankButton postId={postId} onAction={onAction} />
      <PostButton onAction={onAction} />

      <CommentDialog
        isOpen={isCommentOpen}
        onClose={() => setIsCommentOpen(false)}
        comment={comment}
        onCommentChange={setComment}
        onSubmit={handleCommentSubmit}
      />
    </>
  );
};

export default ActionButtons;