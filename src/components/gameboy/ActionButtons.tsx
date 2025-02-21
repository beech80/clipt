
import React from 'react';
import { Heart, MessageSquare, UserPlus, Trophy, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ActionButtonsProps {
  onAction: (action: string) => void;
  postId: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onAction, postId }) => {
  const navigate = useNavigate();

  const handleClick = (action: string) => {
    if (action === 'post') {
      navigate('/post/new');
      toast.success('Create a new post');
      return;
    }
    onAction(action);
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={() => handleClick('like')}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gaming-400/20 hover:bg-gaming-400/30 active:scale-95 transition-all duration-300"
      >
        <Heart className="w-5 h-5 text-gaming-400" />
      </button>
      <button
        onClick={() => handleClick('comment')}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gaming-400/20 hover:bg-gaming-400/30 active:scale-95 transition-all duration-300"
      >
        <MessageSquare className="w-5 h-5 text-gaming-400" />
      </button>
      <button
        onClick={() => handleClick('follow')}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gaming-400/20 hover:bg-gaming-400/30 active:scale-95 transition-all duration-300"
      >
        <UserPlus className="w-5 h-5 text-gaming-400" />
      </button>
      <button
        onClick={() => handleClick('post')}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gaming-400/20 hover:bg-gaming-400/30 active:scale-95 transition-all duration-300"
      >
        <Camera className="w-5 h-5 text-gaming-400" />
      </button>
    </div>
  );
};

export default ActionButtons;
