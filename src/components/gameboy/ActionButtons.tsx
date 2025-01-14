import React from 'react';
import { Heart, MessageSquare, UserPlus, Trophy } from 'lucide-react';

interface ActionButtonsProps {
  onAction: (action: string) => void;
}

const ActionButtons = ({ onAction }: ActionButtonsProps) => {
  return (
    <>
      <button 
        className="action-button transition-transform hover:scale-110 active:scale-95 group"
        onClick={() => onAction('like')}
      >
        <Heart className="w-5 h-5 sm:w-6 sm:h-6 group-hover:text-gaming-400" />
      </button>
      <div className="flex gap-6 sm:gap-12 my-2 sm:my-3">
        <button 
          className="action-button transition-transform hover:scale-110 active:scale-95 group"
          onClick={() => onAction('comment')}
        >
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 group-hover:text-gaming-400" />
        </button>
        <button 
          className="action-button transition-transform hover:scale-110 active:scale-95 group"
          onClick={() => onAction('follow')}
        >
          <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 group-hover:text-gaming-400" />
        </button>
      </div>
      <button 
        className="action-button transition-transform hover:scale-110 active:scale-95 group"
        onClick={() => onAction('rank')}
      >
        <Trophy className="w-5 h-5 sm:w-6 sm:h-6 group-hover:text-gaming-400" />
      </button>
    </>
  );
};

export default ActionButtons;