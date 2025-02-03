import React from 'react';
import Joystick from './gameboy/Joystick';
import ActionButtons from './gameboy/ActionButtons';
import GameBoyNavMenu from './gameboy/GameBoyNavMenu';
import ClipButton from './gameboy/ClipButton';
import { handleVideoControl } from './gameboy/VideoControls';

interface GameBoyControlsProps {
  currentPostId?: string;
}

const GameBoyControls: React.FC<GameBoyControlsProps> = ({ currentPostId }) => {
  const handleAction = (action: string) => {
    switch(action) {
      case 'like':
      case 'comment':
      case 'follow':
      case 'rank':
      default:
        break;
    }
  };

  return (
    <div className="gameboy-container h-[180px] sm:h-[200px] bg-gaming-900/95 backdrop-blur-sm fixed bottom-0 left-0 right-0 z-50 touch-none border-t-2 border-gaming-400">
      <div className="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-50">
        <GameBoyNavMenu />
      </div>

      <div className="fixed left-1/2 -translate-x-1/2 bottom-24 sm:bottom-28">
        <ClipButton />
      </div>

      <div className="fixed left-4 sm:left-8 bottom-16 sm:bottom-20 w-24 sm:w-28 h-24 sm:h-28">
        <Joystick onDirectionChange={handleVideoControl} />
      </div>

      <div className="fixed right-4 sm:right-8 bottom-20 sm:bottom-24 w-20 sm:w-24 h-20 sm:h-24">
        <ActionButtons onAction={handleAction} postId={currentPostId || ''} />
      </div>
    </div>
  );
};

export default GameBoyControls;