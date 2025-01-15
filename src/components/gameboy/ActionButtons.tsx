import React from 'react';
import { Heart, MessageSquare, UserPlus, Trophy } from 'lucide-react';

interface ActionButtonsProps {
  onAction: (action: string) => void;
}

const ActionButtons = ({ onAction }: ActionButtonsProps) => {
  return (
    <>
      <button 
        className="action-button bg-[#222222] hover:bg-[#333333] transition-transform hover:scale-110 active:scale-95 group"
        onClick={() => onAction('like')}
      >
        <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF0000] group-hover:text-[#FF3333]" />
      </button>
      <div className="flex gap-6 sm:gap-12 my-2 sm:my-3">
        <button 
          className="action-button bg-[#222222] hover:bg-[#333333] transition-transform hover:scale-110 active:scale-95 group"
          onClick={() => onAction('comment')}
        >
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-[#0066FF] group-hover:text-[#3399FF]" />
        </button>
        <button 
          className="action-button bg-[#222222] hover:bg-[#333333] transition-transform hover:scale-110 active:scale-95 group"
          onClick={() => onAction('follow')}
        >
          <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-[#00FF00] group-hover:text-[#33FF33]" />
        </button>
      </div>
      <button 
        className="action-button bg-[#222222] hover:bg-[#333333] transition-transform hover:scale-110 active:scale-95 group"
        onClick={() => onAction('rank')}
      >
        <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFD700] group-hover:text-[#FFDF33]" />
      </button>
    </>
  );
};

export default ActionButtons;