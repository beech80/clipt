import { useState } from 'react';
import { Heart, MessageCircle, UserPlus, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ActionButtonsProps {
  onAction: (action: string) => void;
  postId: string;
}

const ActionButtons = ({ onAction, postId }: ActionButtonsProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);

  const handleAction = async (action: string) => {
    try {
      switch (action) {
        case 'like':
          setIsLiked(!isLiked);
          toast.success(isLiked ? 'Post unliked' : 'Post liked');
          break;
        case 'comment':
          toast.info('Opening comments...');
          break;
        case 'follow':
          setIsFollowed(!isFollowed);
          toast.success(isFollowed ? 'Unfollowed' : 'Followed');
          break;
        case 'rank':
          toast.info('Ranking updated');
          break;
      }
      onAction(action);
    } catch (error) {
      console.error('Error handling action:', error);
      toast.error('Failed to perform action');
    }
  };

  return (
    <div className="relative w-full h-full bg-transparent">
      {/* Y Button (Top) */}
      <button
        onClick={() => handleAction('like')}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-14 sm:h-14 
          rounded-full flex items-center justify-center bg-[#1A1F2C]/90 border-2 
          border-gaming-400/50 hover:border-gaming-400 transition-all duration-300
          active:scale-95 shadow-lg hover:shadow-gaming-400/20"
        aria-label="Like"
      >
        <Heart
          className={`w-6 h-6 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gaming-400'}`}
        />
      </button>

      {/* X Button (Left) */}
      <button
        onClick={() => handleAction('comment')}
        className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 
          rounded-full flex items-center justify-center bg-[#1A1F2C]/90 border-2 
          border-gaming-400/50 hover:border-gaming-400 transition-all duration-300
          active:scale-95 shadow-lg hover:shadow-gaming-400/20"
        aria-label="Comment"
      >
        <MessageCircle className="w-6 h-6 text-gaming-400" />
      </button>

      {/* B Button (Right) */}
      <button
        onClick={() => handleAction('follow')}
        className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 
          rounded-full flex items-center justify-center bg-[#1A1F2C]/90 border-2 
          border-gaming-400/50 hover:border-gaming-400 transition-all duration-300
          active:scale-95 shadow-lg hover:shadow-gaming-400/20"
        aria-label="Follow"
      >
        <UserPlus
          className={`w-6 h-6 ${isFollowed ? 'text-green-500' : 'text-gaming-400'}`}
        />
      </button>

      {/* A Button (Bottom) */}
      <button
        onClick={() => handleAction('rank')}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-14 sm:h-14 
          rounded-full flex items-center justify-center bg-[#1A1F2C]/90 border-2 
          border-gaming-400/50 hover:border-gaming-400 transition-all duration-300
          active:scale-95 shadow-lg hover:shadow-gaming-400/20"
        aria-label="Rank"
      >
        <Trophy className="w-6 h-6 text-gaming-400" />
      </button>
    </div>
  );
};

export default ActionButtons;