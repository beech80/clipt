import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, UserPlus, Heart, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface PostActionsProps {
  postId: string;
  userId: string;
  likesCount: number;
  voteCount: number;
  onCommentToggle: () => void;
}

const PostActions = ({ postId, userId, likesCount, voteCount, onCommentToggle }: PostActionsProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isVoted, setIsVoted] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentLikesCount, setCurrentLikesCount] = useState(likesCount);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleLike = async () => {
    if (!user) {
      toast.error("Please login to like posts");
      return;
    }

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
        setCurrentLikesCount(prev => prev - 1);
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) throw error;
        setCurrentLikesCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (error) {
      toast.error("Error updating like");
    }
  };

  const handleVote = async () => {
    if (!user) {
      toast.error("Please login to vote for clips");
      return;
    }

    try {
      if (isVoted) {
        const { error } = await supabase
          .from('clip_votes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clip_votes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) throw error;
      }
      setIsVoted(!isVoted);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success(isVoted ? "Vote removed!" : "Vote added!");
    } catch (error) {
      toast.error("Error updating vote");
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error("Please login to follow users");
      return;
    }

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;
        setIsFollowing(false);
        toast.success("Unfollowed user!");
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });

        if (error) {
          if (error.code === '23505') {
            toast.error("You're already following this user!");
          } else {
            throw error;
          }
        } else {
          setIsFollowing(true);
          toast.success("Following user!");
        }
      }
    } catch (error) {
      toast.error("Error updating follow status");
    }
  };

  return (
    <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center">
      <button 
        className="p-2 hover:scale-110 transition-transform"
        onClick={onCommentToggle}
      >
        <MessageSquare className="w-8 h-8 text-white" />
        <span className="text-xs text-white mt-1">Comment</span>
      </button>
      <button 
        className="p-2 hover:scale-110 transition-transform"
        onClick={handleFollow}
      >
        <UserPlus className={`w-8 h-8 ${isFollowing ? 'text-gaming-400' : 'text-white'}`} />
        <span className="text-xs text-white mt-1">
          {isFollowing ? 'Following' : 'Follow'}
        </span>
      </button>
      <button 
        className="p-2 hover:scale-110 transition-transform"
        onClick={handleLike}
      >
        <Heart className={`w-8 h-8 ${isLiked ? 'text-red-500' : 'text-white'}`} />
        <span className="text-xs text-white mt-1">
          Like ({currentLikesCount})
        </span>
      </button>
      <button 
        className="p-2 hover:scale-110 transition-transform"
        onClick={handleVote}
      >
        <Trophy className={`w-8 h-8 ${isVoted ? 'text-gaming-400' : 'text-white'}`} />
        <span className="text-xs text-white mt-1">
          Vote ({voteCount})
        </span>
      </button>
    </div>
  );
};

export default PostActions;