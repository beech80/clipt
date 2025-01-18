import { useState } from 'react';
import { Heart, MessageSquare, UserPlus, Trophy, ArrowLeft } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
    <>
      {/* Y Button - Like (Yellow) - Top */}
      <button 
        className="action-button absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[20%]
          bg-gradient-to-b from-yellow-500/20 to-yellow-600/30
          border-yellow-400 hover:border-yellow-300
          shadow-[0_0_15px_rgba(234,179,8,0.3)]
          hover:shadow-[0_0_20px_rgba(234,179,8,0.5)]
          transition-all hover:scale-110 active:scale-95"
        onClick={handleLike}
      >
        <Heart className={`w-5 h-5 sm:w-6 sm:h-6 ${isLiked ? 'fill-yellow-400 text-yellow-400' : 'text-yellow-400'} 
          drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]`} />
      </button>

      {/* X Button - Comment (Blue) - Left */}
      <button 
        className="action-button absolute left-0 top-1/2 -translate-x-[20%] -translate-y-1/2
          bg-gradient-to-b from-blue-500/20 to-blue-600/30
          border-blue-400 hover:border-blue-300
          shadow-[0_0_15px_rgba(59,130,246,0.3)]
          hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]
          transition-all hover:scale-110 active:scale-95"
        onClick={() => setIsCommentOpen(true)}
      >
        <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400
          drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
      </button>

      {/* B Button - Follow (Red) - Right */}
      <button 
        className="action-button absolute right-0 top-1/2 translate-x-[20%] -translate-y-1/2
          bg-gradient-to-b from-red-500/20 to-red-600/30
          border-red-400 hover:border-red-300
          shadow-[0_0_15px_rgba(239,68,68,0.3)]
          hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]
          transition-all hover:scale-110 active:scale-95"
        onClick={handleFollow}
      >
        <UserPlus className={`w-5 h-5 sm:w-6 sm:h-6 ${isFollowing ? 'text-red-400' : 'text-red-400'}
          drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]`} />
      </button>

      {/* A Button - Rank (Green) - Bottom */}
      <button 
        className="action-button absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[20%]
          bg-gradient-to-b from-green-500/20 to-green-600/30
          border-green-400 hover:border-green-300
          shadow-[0_0_15px_rgba(34,197,94,0.3)]
          hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]
          transition-all hover:scale-110 active:scale-95"
        onClick={handleRank}
      >
        <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-green-400
          drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
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
    </>
  );
};

export default ActionButtons;
