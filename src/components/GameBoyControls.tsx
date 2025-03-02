import React from 'react';
import { Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Joystick from './gameboy/Joystick';
import ActionButtons from './gameboy/ActionButtons';
import { handleVideoControl } from './gameboy/VideoControls';
import { useAuth } from '@/contexts/AuthContext';

interface GameBoyControlsProps {
  currentPostId?: string;
}

const GameBoyControls: React.FC<GameBoyControlsProps> = ({ currentPostId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleAction = (action: string) => {
    switch(action) {
      case 'like':
        // Handled in ActionButtons
        break;
      case 'comment':
        // Handled in ActionButtons
        break;
      case 'follow':
        // Handled in ActionButtons
        break;
      case 'rank':
        // Handled in ActionButtons
        break;
      default:
        break;
    }
  };

  return (
    <div className="h-[70px] bg-[#1e2130] fixed bottom-0 left-0 right-0 z-50 touch-none border-t border-[#3e4462]/30 flex items-center justify-between px-5">
      {/* Joystick on left */}
      <div className="flex-none w-[70px] h-[70px] flex items-center">
        <div className="w-[65px] h-[65px] bg-[#30323d]/60 rounded-full flex items-center justify-center">
          <Joystick onDirectionChange={handleVideoControl} />
        </div>
      </div>
      
      {/* Empty space for proper spacing */}
      <div className="flex-1"></div>
      
      {/* CLIPT button in center with gradient background */}
      <div className="flex-none">
        <button 
          onClick={() => {
            navigate('/clipts');
            toast.success('Welcome to Clipts!');
          }}
          className="relative flex items-center justify-center w-[75px] h-[75px] active:scale-95 transition-transform"
          aria-label="Go to Clipts"
        >
          <div className="absolute inset-0 rounded-full border-2 border-transparent bg-clip-padding p-[2px]" 
               style={{ background: 'linear-gradient(to right, #4f9cf9, #a651fb, #f046ff) border-box' }}>
            <div className="w-full h-full rounded-full bg-[#1e2130]"></div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <Camera className="w-5 h-5 mb-0.5" />
            <span className="text-xs font-bold">CLIPT</span>
          </div>
        </button>
      </div>
      
      {/* Empty space for proper spacing */}
      <div className="flex-1"></div>
      
      {/* Action buttons on right */}
      <div className="flex-none w-[90px] h-[70px] flex items-center justify-center">
        <ActionButtons postId={currentPostId || ''} />
      </div>
    </div>
  );
};

export default GameBoyControls;
