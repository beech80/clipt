import React from 'react';
import { Trophy } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface RankButtonProps {
  postId: string;
  onAction: (action: string) => void;
}

const RankButton = ({ postId, onAction }: RankButtonProps) => {
  const { user } = useAuth();

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
  );
};

export default RankButton;