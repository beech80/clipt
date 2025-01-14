import { useState, useEffect } from "react";
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
  onCommentClick: () => void;
  showComments: boolean;
}

const PostActions = ({ postId, voteCount, onCommentClick, showComments }: PostActionsProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      checkLikeStatus();
      checkBookmarkStatus();
    }
  }, [user, postId]);

  const checkLikeStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('likes')
      .select()
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    setIsLiked(!!data);
  };

  const checkBookmarkStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setIsSaved(!!data);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

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
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      }
    } catch (error) {
      toast.error("Error recording vote");
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error("Please login to like posts!");
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        
        setIsLiked(false);
        toast.success("Post unliked!");
      } else {
        await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });
        
        setIsLiked(true);
        toast.success("Post liked!");
      }
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (error) {
      toast.error("Error updating like status");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Please login to bookmark posts!");
      return;
    }

    try {
      if (isSaved) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsSaved(false);
        toast.success("Post removed from bookmarks!");
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) throw error;
        setIsSaved(true);
        toast.success("Post bookmarked!");
      }
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    } catch (error) {
      console.error('Error updating bookmark:', error);
      toast.error("Error updating bookmark status");
    }
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
        onClick={onCommentClick}
        className={cn("flex items-center gap-2", showComments && "text-primary")}
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
        className={cn("flex items-center gap-2", isSaved && "text-primary")}
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