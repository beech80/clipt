import React from 'react';
import { Heart, MessageSquare, UserPlus, Trophy } from 'lucide-react';

interface ActionButtonsProps {
  onAction: (action: string) => void;
}

const ActionButtons = ({ onAction }: ActionButtonsProps) => {
  return (
    <>
      <button 
        className="action-button bg-[#ea384c]/90 hover:bg-[#ea384c]/80 transition-transform hover:scale-110 active:scale-95 group"
        onClick={() => onAction('like')}
      >
        <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-[#FEC6A1] group-hover:text-[#FFDEE2]" />
      </button>
      <div className="flex gap-6 sm:gap-12 my-2 sm:my-3">
        <button 
          className="action-button bg-[#0EA5E9]/90 hover:bg-[#0EA5E9]/80 transition-transform hover:scale-110 active:scale-95 group"
          onClick={() => onAction('comment')}
        >
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-[#D3E4FD] group-hover:text-[#E5DEFF]" />
        </button>
        <button 
          className="action-button bg-[#22c55e]/90 hover:bg-[#22c55e]/80 transition-transform hover:scale-110 active:scale-95 group"
          onClick={() => onAction('follow')}
        >
          <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-[#E5DEFF] group-hover:text-[#D6BCFA]" />
        </button>
      </div>
      <button 
        className="action-button bg-[#F97316]/90 hover:bg-[#F97316]/80 transition-transform hover:scale-110 active:scale-95 group"
        onClick={() => onAction('rank')}
      >
        <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFDEE2] group-hover:text-[#FEC6A1]" />
      </button>
    </>
  );
};

export default ActionButtons;