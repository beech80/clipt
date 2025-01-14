import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface LikeButtonProps {
  postId: string;
}

const LikeButton = ({ postId }: LikeButtonProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      checkLikeStatus();
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

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      className={cn("flex items-center gap-2", isLiked && "text-red-500")}
    >
      <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
    </Button>
  );
};

export default LikeButton;