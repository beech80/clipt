import React, { useState } from 'react';
import { 
  ThumbsUp, Share2, MessageSquare, Trophy,
  Play, Pause, Forward, Rewind,
  Home, Search, Bell, User,
  Compass, Video, BookMarked, Users
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const GameBoyControls = () => {
  const [joystickPosition, setJoystickPosition] = useState<string>('neutral');
  const [isDragging, setIsDragging] = useState(false);
  const location = useLocation();

  const handleAction = (action: string) => {
    toast.success(`${action} action triggered!`);
  };

  const handleJoystickMove = (direction: string) => {
    setJoystickPosition(direction);
    handleAction(direction);
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

    const angle = Math.atan2(y, x);
    const distance = Math.min(Math.sqrt(x * x + y * y), 50);

    if (distance < 10) {
      setJoystickPosition('neutral');
      return;
    }

    const deg = angle * (180 / Math.PI);
    if (deg > -45 && deg <= 45) handleJoystickMove('right');
    else if (deg > 45 && deg <= 135) handleJoystickMove('down');
    else if (deg > 135 || deg <= -135) handleJoystickMove('left');
    else handleJoystickMove('up');
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    
    const pointerEvent = new PointerEvent('pointermove', {
      clientX: touch.clientX,
      clientY: touch.clientY,
      bubbles: true
    });
    
    Object.defineProperty(pointerEvent, 'currentTarget', {
      get: () => target
    });
    
    handlePointerMove(pointerEvent as unknown as React.PointerEvent);
  };

  const renderActionButtons = () => {
    switch (location.pathname) {
      case '/streaming':
        return (
          <>
            <button 
              className="action-button transition-transform hover:scale-110 active:scale-95"
              onClick={() => handleAction('Play/Pause')}
            >
              <Play className="w-6 h-6" />
            </button>
            <div className="flex gap-16 my-4">
              <button 
                className="action-button transition-transform hover:scale-110 active:scale-95"
                onClick={() => handleAction('Rewind')}
              >
                <Rewind className="w-6 h-6" />
              </button>
              <button 
                className="action-button transition-transform hover:scale-110 active:scale-95"
                onClick={() => handleAction('Forward')}
              >
                <Forward className="w-6 h-6" />
              </button>
            </div>
            <button 
              className="action-button transition-transform hover:scale-110 active:scale-95"
              onClick={() => handleAction('Save')}
            >
              <BookMarked className="w-6 h-6" />
            </button>
          </>
        );

      case '/discover':
        return (
          <>
            <button 
              className="action-button transition-transform hover:scale-110 active:scale-95"
              onClick={() => handleAction('Search')}
            >
              <Search className="w-6 h-6" />
            </button>
            <div className="flex gap-16 my-4">
              <button 
                className="action-button transition-transform hover:scale-110 active:scale-95"
                onClick={() => handleAction('Explore')}
              >
                <Compass className="w-6 h-6" />
              </button>
              <button 
                className="action-button transition-transform hover:scale-110 active:scale-95"
                onClick={() => handleAction('Community')}
              >
                <Users className="w-6 h-6" />
              </button>
            </div>
            <button 
              className="action-button transition-transform hover:scale-110 active:scale-95"
              onClick={() => handleAction('Notifications')}
            >
              <Bell className="w-6 h-6" />
            </button>
          </>
        );

      case '/messages':
        return (
          <>
            <button 
              className="action-button transition-transform hover:scale-110 active:scale-95"
              onClick={() => handleAction('New Message')}
            >
              <MessageSquare className="w-6 h-6" />
            </button>
            <div className="flex gap-16 my-4">
              <button 
                className="action-button transition-transform hover:scale-110 active:scale-95"
                onClick={() => handleAction('Share')}
              >
                <Share2 className="w-6 h-6" />
              </button>
              <button 
                className="action-button transition-transform hover:scale-110 active:scale-95"
                onClick={() => handleAction('Users')}
              >
                <Users className="w-6 h-6" />
              </button>
            </div>
            <button 
              className="action-button transition-transform hover:scale-110 active:scale-95"
              onClick={() => handleAction('Profile')}
            >
              <User className="w-6 h-6" />
            </button>
          </>
        );

      default:
        return (
          <>
            <button 
              className="action-button transition-transform hover:scale-110 active:scale-95"
              onClick={() => handleAction('Like')}
            >
              <ThumbsUp className="w-6 h-6" />
            </button>
            <div className="flex gap-16 my-4">
              <button 
                className="action-button transition-transform hover:scale-110 active:scale-95"
                onClick={() => handleAction('Share')}
              >
                <Share2 className="w-6 h-6" />
              </button>
              <button 
                className="action-button transition-transform hover:scale-110 active:scale-95"
                onClick={() => handleAction('Rank')}
              >
                <Trophy className="w-6 h-6" />
              </button>
            </div>
            <button 
              className="action-button transition-transform hover:scale-110 active:scale-95"
              onClick={() => handleAction('Comment')}
            >
              <MessageSquare className="w-6 h-6" />
            </button>
          </>
        );
    }
  };

  return (
    <div className="gameboy-container">
      <div 
        className="joystick-base"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerUp}
        onTouchStart={(e) => {
          e.preventDefault();
          handlePointerDown(e as unknown as React.PointerEvent);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          handlePointerUp();
        }}
        onTouchMove={handleTouchMove}
      >
        <div className={`joystick ${joystickPosition.toLowerCase()}`}>
          <div className="joystick-ball" />
        </div>
      </div>

      <div className="action-buttons-container">
        {renderActionButtons()}
      </div>
    </div>
  );
};

export default GameBoyControls;
