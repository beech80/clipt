import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface LikeButtonProps {
  postId: string;
  onAction: (action: string) => void;
}

const LikeButton = ({ postId, onAction }: LikeButtonProps) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);

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

  return (
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
  );
};

export default LikeButton;