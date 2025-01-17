import React, { useState } from 'react';
import { Heart, MessageSquare, UserPlus, Trophy } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from 'lucide-react';

interface ActionButtonsProps {
  onAction: (action: string) => void;
  postId: string;
}

const ActionButtons = ({ onAction, postId }: ActionButtonsProps) => {
  const { user } = useAuth();
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const handleLike = async () => {
    if (!user) {
      toast.error("Please login to like posts");
      return;
    }

    try {
      if (!isLiked) {
        await supabase
          .from('likes')
          .insert([{ post_id: postId, user_id: user.id }]);
        setIsLiked(true);
        toast.success("Post liked!");
      } else {
        await supabase
          .from('likes')
          .delete()
          .match({ post_id: postId, user_id: user.id });
        setIsLiked(false);
        toast.success("Post unliked!");
      }
      onAction('like');
    } catch (error) {
      toast.error("Error updating like status");
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error("Please login to follow users");
      return;
    }

    try {
      if (!isFollowing) {
        await supabase
          .from('follows')
          .insert([{ follower_id: user.id, following_id: postId }]);
        setIsFollowing(true);
        toast.success("Following user!");
      } else {
        await supabase
          .from('follows')
          .delete()
          .match({ follower_id: user.id, following_id: postId });
        setIsFollowing(false);
        toast.success("Unfollowed user!");
      }
      onAction('follow');
    } catch (error) {
      toast.error("Error updating follow status");
    }
  };

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

  const handleRank = async () => {
    if (!user) {
      toast.error("Please login to rank posts");
      return;
    }

    try {
      await supabase
        .from('clip_votes')
        .insert([{ post_id: postId, user_id: user.id }]);
      toast.success("Clip ranked!");
      onAction('rank');
    } catch (error) {
      toast.error("You've already ranked this clip!");
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <button 
        className="action-button bg-[#1A1F2C] hover:bg-[#252A3C] group"
        onClick={handleLike}
      >
        <Heart className={`w-5 h-5 sm:w-6 sm:h-6 ${isLiked ? 'fill-[#FF0000] text-[#FF0000]' : 'text-[#FF0000]'} group-hover:text-[#FF3333]`} />
      </button>
      <button 
        className="action-button bg-[#1A1F2C] hover:bg-[#252A3C] group"
        onClick={() => setIsCommentOpen(true)}
      >
        <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-[#0066FF] group-hover:text-[#3399FF]" />
      </button>
      <button 
        className="action-button bg-[#1A1F2C] hover:bg-[#252A3C] group"
        onClick={handleFollow}
      >
        <UserPlus className={`w-5 h-5 sm:w-6 sm:h-6 ${isFollowing ? 'text-[#33FF33]' : 'text-[#00FF00]'} group-hover:text-[#33FF33]`} />
      </button>
      <button 
        className="action-button bg-[#1A1F2C] hover:bg-[#252A3C] group"
        onClick={handleRank}
      >
        <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFD700] group-hover:text-[#FFDF33]" />
      </button>

      <Dialog open={isCommentOpen} onOpenChange={setIsCommentOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#1A1F2C] text-white">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCommentOpen(false)}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">Add Comment</h2>
          </div>
          
          <Textarea
            placeholder="Write your comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px] bg-[#2A2F3C] border-gaming-400/30 text-white"
          />
          
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsCommentOpen(false)}
              className="border-gaming-400/30 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCommentSubmit}
              className="bg-gaming-500 hover:bg-gaming-600 text-white"
            >
              Post Comment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActionButtons;
