import React, { useState } from 'react';
import { 
  Video, MessageSquare, User, Compass
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const GameBoyControls = () => {
  const [joystickPosition, setJoystickPosition] = useState<string>('neutral');
  const [isDragging, setIsDragging] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleAction = (action: string) => {
    if (action.startsWith('navigate:')) {
      const route = action.split(':')[1];
      navigate(route);
      toast.success(`Navigating to ${route}`);
    }
  };

  const handleJoystickMove = (direction: string) => {
    setJoystickPosition(direction);
    switch (direction) {
      case 'up':
        navigate('/streaming');
        break;
      case 'right':
        navigate('/messages');
        break;
      case 'down':
        navigate('/profile');
        break;
      case 'left':
        navigate('/discover');
        break;
      default:
        break;
    }
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
    return (
      <>
        <button 
          className="action-button transition-transform hover:scale-110 active:scale-95"
          onClick={() => handleAction('navigate:/streaming')}
        >
          <Video className="w-6 h-6" />
        </button>
        <div className="flex gap-16 my-4">
          <button 
            className="action-button transition-transform hover:scale-110 active:scale-95"
            onClick={() => handleAction('navigate:/messages')}
          >
            <MessageSquare className="w-6 h-6" />
          </button>
          <button 
            className="action-button transition-transform hover:scale-110 active:scale-95"
            onClick={() => handleAction('navigate:/profile')}
          >
            <User className="w-6 h-6" />
          </button>
        </div>
        <button 
          className="action-button transition-transform hover:scale-110 active:scale-95"
          onClick={() => handleAction('navigate:/discover')}
        >
          <Compass className="w-6 h-6" />
        </button>
      </>
    );
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

      <button 
        onClick={() => handleAction('navigate:/')}
        className="clip-button absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 px-8 py-4"
      >
        CLIP
      </button>

      <div className="action-buttons-container">
        {renderActionButtons()}
      </div>
    </div>
  );
};

export default GameBoyControls;
