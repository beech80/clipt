import React, { useState } from 'react';
import { Heart, MessageSquare, UserPlus, Trophy } from 'lucide-react';
import { toast } from 'sonner';

interface ActionButtonsProps {
  onAction: (action: string) => void;
  postId: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onAction, postId }) => {
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

  const buttonClasses = "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-[#1A1F2C]/90 border-2 border-[#2D3748]/50 hover:border-[#2D3748] transition-all duration-300 active:scale-95 shadow-lg absolute";

  return (
    <div className="relative w-full h-full bg-transparent">
      {/* Top Button */}
      <button
        onClick={() => handleAction('like')}
        className={`${buttonClasses} top-0 left-1/2 -translate-x-1/2`}
        aria-label="Like"
      >
        <Heart
          className={`w-6 h-6 ${isLiked ? 'fill-[#ea384c] text-[#ea384c]' : 'text-[#ea384c]'}`}
        />
      </button>

      {/* Left Button */}
      <button
        onClick={() => handleAction('comment')}
        className={`${buttonClasses} top-1/2 left-0 -translate-y-1/2`}
        aria-label="Comment"
      >
        <MessageSquare className="w-6 h-6 text-[#0EA5E9]" />
      </button>

      {/* Right Button */}
      <button
        onClick={() => handleAction('follow')}
        className={`${buttonClasses} top-1/2 right-0 -translate-y-1/2`}
        aria-label="Follow"
      >
        <UserPlus
          className={`w-6 h-6 ${isFollowed ? 'text-[#22C55E]' : 'text-[#22C55E]'}`}
        />
      </button>

      {/* Bottom Button */}
      <button
        onClick={() => handleAction('rank')}
        className={`${buttonClasses} bottom-0 left-1/2 -translate-x-1/2`}
        aria-label="Rank"
      >
        <Trophy className="w-6 h-6 text-[#EAB308]" />
      </button>
    </div>
  );
};

export default ActionButtons;