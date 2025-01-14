import React, { useState, useEffect } from 'react';
import { ThumbsUp, Share2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const GameBoyControls = () => {
  const [joystickPosition, setJoystickPosition] = useState<string>('neutral');
  const [isDragging, setIsDragging] = useState(false);

  const handleAction = (action: string) => {
    toast.success(`${action} action triggered!`);
  };

  const handleJoystickMove = (direction: string) => {
    setJoystickPosition(direction);
    handleAction(direction);
    // Reset joystick position after animation
    setTimeout(() => setJoystickPosition('neutral'), 300);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setJoystickPosition('neutral');
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;

    // Calculate angle and distance from center
    const angle = Math.atan2(y, x);
    const distance = Math.min(Math.sqrt(x * x + y * y), 50);

    if (distance < 10) {
      setJoystickPosition('neutral');
      return;
    }

    // Convert angle to direction
    const deg = angle * (180 / Math.PI);
    if (deg > -45 && deg <= 45) handleJoystickMove('Right');
    else if (deg > 45 && deg <= 135) handleJoystickMove('Down');
    else if (deg > 135 || deg <= -135) handleJoystickMove('Left');
    else handleJoystickMove('Up');
  };

  return (
    <div className="gameboy-container">
      {/* Joystick */}
      <div 
        className="joystick-base"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerUp}
      >
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
          className="action-button animate-glow"
          onClick={() => handleAction('Like')}
        >
          <ThumbsUp className="w-6 h-6" />
        </button>
        <button 
          className="action-button animate-glow"
          onClick={() => handleAction('Share')}
        >
          <Share2 className="w-6 h-6" />
        </button>
        <button 
          className="action-button animate-glow"
          onClick={() => handleAction('Comment')}
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default GameBoyControls;