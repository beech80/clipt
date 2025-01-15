import React from 'react';
import { Heart, MessageSquare, UserPlus, Trophy } from 'lucide-react';

interface ActionButtonsProps {
  onAction: (action: string) => void;
}

const ActionButtons = ({ onAction }: ActionButtonsProps) => {
  return (
    <>
      <button 
        className="action-button bg-[#F97316]/90 hover:bg-[#F97316]/80 transition-transform hover:scale-110 active:scale-95 group"
        onClick={() => onAction('like')}
      >
        <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:text-white" />
      </button>
      <div className="flex gap-6 sm:gap-12 my-2 sm:my-3">
        <button 
          className="action-button bg-[#0EA5E9]/90 hover:bg-[#0EA5E9]/80 transition-transform hover:scale-110 active:scale-95 group"
          onClick={() => onAction('comment')}
        >
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:text-white" />
        </button>
        <button 
          className="action-button bg-[#8B5CF6]/90 hover:bg-[#8B5CF6]/80 transition-transform hover:scale-110 active:scale-95 group"
          onClick={() => onAction('follow')}
        >
          <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:text-white" />
        </button>
      </div>
      <button 
        className="action-button bg-[#D946EF]/90 hover:bg-[#D946EF]/80 transition-transform hover:scale-110 active:scale-95 group"
        onClick={() => onAction('rank')}
      >
        <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:text-white" />
      </button>
    </>
  );
};

export default ActionButtons;