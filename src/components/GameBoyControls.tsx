import React, { useState } from 'react';
import { ThumbsUp, Share2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const GameBoyControls = () => {
  const [joystickPosition, setJoystickPosition] = useState<string>('neutral');

  const handleAction = (action: string) => {
    toast.success(`${action} action triggered!`);
  };

  const handleJoystickMove = (direction: string) => {
    setJoystickPosition(direction);
    handleAction(direction);
    // Reset joystick position after animation
    setTimeout(() => setJoystickPosition('neutral'), 200);
  };

  return (
    <div className="gameboy-container">
      {/* Joystick */}
      <div className="joystick-base">
        <div className={`joystick ${joystickPosition}`}>
          <div className="joystick-ball" />
        </div>
        <div className="joystick-hitbox">
          <button 
            className="joystick-area top"
            onClick={() => handleJoystickMove('Up')}
          />
          <button 
            className="joystick-area bottom"
            onClick={() => handleJoystickMove('Down')}
          />
          <button 
            className="joystick-area left"
            onClick={() => handleJoystickMove('Left')}
          />
          <button 
            className="joystick-area right"
            onClick={() => handleJoystickMove('Right')}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons-container">
        <button 
          className="action-button"
          onClick={() => handleAction('Like')}
        >
          <ThumbsUp className="w-6 h-6" />
        </button>
        <button 
          className="action-button"
          onClick={() => handleAction('Share')}
        >
          <Share2 className="w-6 h-6" />
        </button>
        <button 
          className="action-button"
          onClick={() => handleAction('Comment')}
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default GameBoyControls;