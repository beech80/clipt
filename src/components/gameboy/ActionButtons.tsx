import React from 'react';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionButtonsProps {
  onAction: (action: string) => void;
}

const ActionButtons = ({ onAction }: ActionButtonsProps) => {
  const handleClick = (action: string) => {
    const button = document.querySelector(`.action-button-${action}`);
    if (button) {
      button.classList.add('animate-scale-up');
      setTimeout(() => {
        button.classList.remove('animate-scale-up');
      }, 600);
    }
    onAction(action);
  };

  return (
    <div className="action-buttons-container right-4 sm:right-8 space-y-4">
      <button
        onClick={() => handleClick('like')}
        className={cn(
          "action-button action-button-like",
          "hover:text-red-500 hover:border-red-500"
        )}
      >
        <Heart className="w-5 h-5" />
      </button>
      
      <button
        onClick={() => handleClick('comment')}
        className={cn(
          "action-button action-button-comment",
          "hover:text-blue-500 hover:border-blue-500"
        )}
      >
        <MessageCircle className="w-5 h-5" />
      </button>
      
      <button
        onClick={() => handleClick('share')}
        className={cn(
          "action-button action-button-share",
          "hover:text-green-500 hover:border-green-500"
        )}
      >
        <Share2 className="w-5 h-5" />
      </button>
      
      <button
        onClick={() => handleClick('bookmark')}
        className={cn(
          "action-button action-button-bookmark",
          "hover:text-purple-500 hover:border-purple-500"
        )}
      >
        <Bookmark className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ActionButtons;