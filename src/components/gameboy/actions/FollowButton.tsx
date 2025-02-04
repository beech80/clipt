import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface FollowButtonProps {
  postId: string;
  onAction: (action: string) => void;
}

const FollowButton = ({ postId, onAction }: FollowButtonProps) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

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

  return (
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
  );
};

export default FollowButton;