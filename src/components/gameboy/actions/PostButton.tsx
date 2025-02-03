import React from 'react';
import { Camera } from 'lucide-react';
import { toast } from "sonner";

interface PostButtonProps {
  onAction: (action: string) => void;
}

const PostButton = ({ onAction }: PostButtonProps) => {
  return (
    <button 
      className="action-button absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[180%]
      bg-gradient-to-b from-[#1A1F2C]/80 to-[#1A1F2C] 
      shadow-[0_0_15px_rgba(147,51,234,0.3)] border-purple-400/30
      hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all hover:scale-110 active:scale-95
      flex flex-col items-center gap-1 w-8 h-8 sm:w-10 sm:h-10"
      onClick={() => {
        toast.success("Opening post creation...");
        onAction('post');
      }}
    >
      <Camera className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500
        drop-shadow-[0_0_8px_rgba(147,51,234,0.5)]" />
      <span className="text-[8px] sm:text-[10px] text-purple-500 font-bold mt-1">POST</span>
    </button>
  );
};

export default PostButton;