import { useState } from "react";
import { Heart, MessageSquare, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Post } from "@/types/post";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PostInteractionsProps {
  post: Post;
  commentsCount: number;
  onCommentClick: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isLiked: boolean;
  setIsLiked: (liked: boolean) => void;
  isTrophied: boolean;
  setIsTrophied: (trophied: boolean) => void;
}

export function PostInteractions({ 
  post, 
  commentsCount, 
  onCommentClick,
  isLoading,
  setIsLoading,
  isLiked,
  setIsLiked,
  isTrophied,
  setIsTrophied
}: PostInteractionsProps) {
  const { user } = useAuth();

  const handleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like posts");
      return;
    }

    setIsLoading(true);
    try {
      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        setIsLiked(false);
        toast.success("Like removed");
      } else {
        await supabase
          .from('likes')
          .insert([{ post_id: post.id, user_id: user.id }]);
        setIsLiked(true);
        toast.success("Post liked!");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrophy = async () => {
    if (!user) {
      toast.error("Please sign in to give trophies");
      return;
    }

    setIsLoading(true);
    try {
      if (isTrophied) {
        await supabase
          .from('clip_votes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        setIsTrophied(false);
        toast.success("Trophy removed");
      } else {
        await supabase
          .from('clip_votes')
          .insert([{ post_id: post.id, user_id: user.id }]);
        setIsTrophied(true);
        toast.success("Trophy given!");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-around p-4 backdrop-blur-sm bg-gaming-800/80 border-t border-gaming-400/20">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        disabled={isLoading}
        className={cn(
          "flex items-center space-x-2 transition-all",
          isLiked && "text-red-500"
        )}
      >
        <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
        <span>Like</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onCommentClick}
        className="flex items-center space-x-2"
      >
        <MessageSquare className="h-5 w-5" />
        <span>Comment ({commentsCount})</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleTrophy}
        disabled={isLoading}
        className={cn(
          "flex items-center space-x-2 transition-all",
          isTrophied && "text-yellow-500"
        )}
      >
        <Trophy className={cn("h-5 w-5", isTrophied && "fill-current")} />
        <span>Trophy</span>
      </Button>
    </div>
  );
}