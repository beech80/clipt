import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, UserPlus, Trophy, Camera, ArrowLeft } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CommentList } from '../post/CommentList';
import { useNavigate } from 'react-router-dom';

interface ActionButtonsProps {
  onAction: (action: string) => void;
  postId: string;
}

const ActionButtons = ({ onAction, postId }: ActionButtonsProps) => {
  const { user } = useAuth();
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const navigate = useNavigate();
  
  // Log postId for debugging
  useEffect(() => {
    console.log(`ActionButtons component mounted with postId: ${postId}`);
    console.log('postId type:', typeof postId);
  }, [postId]);

  // Exit early if no postId
  if (!postId) {
    console.error("No postId provided to ActionButtons");
    return null;
  }

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
      <button 
        className="action-button absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[40%]
        bg-gradient-to-b from-[#1A1F2C]/80 to-[#1A1F2C] 
        shadow-[0_0_15px_rgba(255,0,0,0.3)] border-red-400/30
        hover:shadow-[0_0_20px_rgba(255,0,0,0.4)] transition-all hover:scale-110 active:scale-95
        w-8 h-8 sm:w-10 sm:h-10"
        onClick={handleLike}
      >
        <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-red-500'} 
          drop-shadow-[0_0_8px_rgba(255,0,0,0.5)]`} />
      </button>

      <button 
        className="action-button absolute left-0 top-1/2 -translate-x-[40%] -translate-y-1/2
        bg-gradient-to-b from-[#1A1F2C]/80 to-[#1A1F2C]
        shadow-[0_0_15px_rgba(0,120,255,0.3)] border-blue-400/30
        hover:shadow-[0_0_20px_rgba(0,120,255,0.4)] transition-all hover:scale-110 active:scale-95
        w-8 h-8 sm:w-10 sm:h-10"
        onClick={() => {
          console.log(`Opening comments for postId: ${postId}`);
          setIsCommentOpen(true);
        }}
      >
        <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500
          drop-shadow-[0_0_8px_rgba(0,120,255,0.5)]" />
      </button>

      <button 
        className="action-button absolute right-0 top-1/2 translate-x-[40%] -translate-y-1/2
        bg-gradient-to-b from-[#1A1F2C]/80 to-[#1A1F2C]
        shadow-[0_0_15px_rgba(0,255,0,0.3)] border-green-400/30
        hover:shadow-[0_0_20px_rgba(0,255,0,0.4)] transition-all hover:scale-110 active:scale-95
        w-8 h-8 sm:w-10 sm:h-10"
        onClick={handleFollow}
      >
        <UserPlus className={`w-4 h-4 sm:w-5 sm:h-5 ${isFollowing ? 'text-green-500' : 'text-green-500'}
          drop-shadow-[0_0_8px_rgba(0,255,0,0.5)]`} />
      </button>

      <button 
        className="action-button absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[40%]
        bg-gradient-to-b from-[#1A1F2C]/80 to-[#1A1F2C]
        shadow-[0_0_15px_rgba(255,255,0,0.3)] border-yellow-400/30
        hover:shadow-[0_0_20px_rgba(255,255,0,0.4)] transition-all hover:scale-110 active:scale-95
        w-8 h-8 sm:w-10 sm:h-10"
        onClick={handleRank}
      >
        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500
          drop-shadow-[0_0_8px_rgba(255,255,0,0.5)]" />
      </button>

      <button 
        className="action-button absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[180%]
        bg-gradient-to-b from-[#1A1F2C]/80 to-[#1A1F2C] 
        shadow-[0_0_15px_rgba(147,51,234,0.3)] border-purple-400/30
        hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all hover:scale-110 active:scale-95
        flex flex-col items-center gap-1 w-8 h-8 sm:w-10 sm:h-10"
        onClick={() => {
          navigate('/post/new');
          toast.success('Opening post creation...');
        }}
      >
        <Camera className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500
          drop-shadow-[0_0_8px_rgba(147,51,234,0.5)]" />
        <span className="text-[8px] sm:text-[10px] text-purple-500 font-bold mt-1">POST</span>
      </button>

      {postId && (
        <Dialog open={isCommentOpen} onOpenChange={setIsCommentOpen}>
          <DialogContent className="sm:max-w-[600px] bg-gaming-800/95 backdrop-blur-sm p-0 border-gaming-400/30">
            <div className="flex items-center gap-2 p-4 border-b border-gaming-400/20">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCommentOpen(false)}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold text-white">Comments</h2>
            </div>
            
            <div className="max-h-[80vh] overflow-y-auto">
              <CommentList 
                postId={postId} 
                onBack={() => setIsCommentOpen(false)}
                onCommentAdded={() => {
                  console.log("Comment added, refreshing");
                  // You can add any additional refresh logic here
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ActionButtons;
