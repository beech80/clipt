import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Post } from "@/types/post";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Trophy } from "lucide-react";
import { track_post_analytics } from "@/services/postService";

interface PostInteractionsProps {
  post: Post;
  commentsCount: number;
  onCommentClick: () => void;
}

export const PostInteractions = ({ post, commentsCount, onCommentClick }: PostInteractionsProps) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const navigate = useNavigate();

  const handleLike = async () => {
    if (!user) {
      toast.error("Please login to like posts");
      return;
    }

    try {
      if (!isLiked) {
        await supabase
          .from('likes')
          .insert([{ post_id: post.id, user_id: user.id }]);
        setIsLiked(true);
        toast.success("Post liked!");
      } else {
        await supabase
          .from('likes')
          .delete()
          .match({ post_id: post.id, user_id: user.id });
        setIsLiked(false);
        toast.success("Post unliked!");
      }
    } catch (error) {
      toast.error("Error updating like status");
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this post',
          text: 'I found this interesting post',
          url: shareUrl,
        });
        toast.success("Post shared successfully!");
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          await copyToClipboard(shareUrl);
        }
      }
    } else {
      await copyToClipboard(shareUrl);
    }

    try {
      await track_post_analytics(post.id, 'share');
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error("Failed to copy link");
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
        .insert([{ post_id: post.id, user_id: user.id }]);
      toast.success("Clip ranked!");
    } catch (error) {
      toast.error("You've already ranked this clip!");
    }
  };

  return (
    <div className="flex items-center gap-4 p-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : ''}`}
      >
        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onCommentClick}
        className="flex items-center gap-2"
      >
        <MessageCircle className="w-4 h-4" />
        {commentsCount > 0 && <span>{commentsCount}</span>}
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
        onClick={handleRank}
        className="flex items-center gap-2"
      >
        <Trophy className="w-4 h-4" />
      </Button>
    </div>
  );
};