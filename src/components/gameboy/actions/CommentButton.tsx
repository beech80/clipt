import React from 'react';
import { MessageSquare } from 'lucide-react';

interface CommentButtonProps {
  onClick: () => void;
}

const CommentButton = ({ onClick }: CommentButtonProps) => {
  return (
    <button 
      className="action-button absolute left-0 top-1/2 -translate-x-[40%] -translate-y-1/2
      bg-gradient-to-b from-[#1A1F2C]/80 to-[#1A1F2C]
      shadow-[0_0_15px_rgba(0,120,255,0.3)] border-blue-400/30
      hover:shadow-[0_0_20px_rgba(0,120,255,0.4)] transition-all hover:scale-110 active:scale-95
      w-8 h-8 sm:w-10 sm:h-10"
      onClick={onClick}
    >
      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500
        drop-shadow-[0_0_8px_rgba(0,120,255,0.5)]" />
    </button>
  );
};

export default CommentButton;