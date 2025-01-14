import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Bookmark, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface PostActionsProps {
  postId: string;
  voteCount: number;
}

const PostActions = ({ postId, voteCount }: PostActionsProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleVote = async () => {
    if (!user) {
      toast.error("Please login to vote!");
      return;
    }

    try {
      const { error } = await supabase
        .from('clip_votes')
        .insert({
          post_id: postId,
          user_id: user.id
        });

      if (error) {
        if (error.code === '23505') {
          toast.error("You've already voted for this clip!");
        } else {
          throw error;
        }
      } else {
        toast.success("Vote recorded!");
        queryClient.invalidateQueries({ queryKey: ['top-posts'] });
      }
    } catch (error) {
      toast.error("Error recording vote");
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? "Post unliked!" : "Post liked!");
  };

  const handleComment = () => {
    toast.info("Comments feature coming soon!");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast.success(isSaved ? "Post unsaved!" : "Post saved!");
  };

  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        className={cn("flex items-center gap-2", isLiked && "text-red-500")}
      >
        <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleComment}
        className="flex items-center gap-2"
      >
        <MessageCircle className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        className="flex items-center gap-2"
      >
        <Share2 className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSave}
        className={cn("flex items-center gap-2", isSaved && "text-gaming-600")}
      >
        <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleVote}
        className="flex items-center gap-2"
      >
        <ThumbsUp className="w-4 h-4" />
        <span className="text-sm">{voteCount}</span>
      </Button>
    </div>
  );
};

export default PostActions;