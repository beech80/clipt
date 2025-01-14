import React, { useState } from 'react';
import { 
  Video,
  MessageSquare,
  User,
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const GameBoyControls = () => {
  const [activeDirection, setActiveDirection] = useState<string>('neutral');
  const navigate = useNavigate();

  const handleAction = (action: string) => {
    if (action.startsWith('navigate:')) {
      const route = action.split(':')[1];
      navigate(route);
      toast.success(`Navigating to ${route}`);
    }
  };

  const handleDirectionClick = (direction: string) => {
    setActiveDirection(direction);
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
    setTimeout(() => setActiveDirection('neutral'), 300);
  };

  const renderActionButtons = () => {
    return (
      <>
        <button 
          className="action-button transition-transform hover:scale-110 active:scale-95 group"
          onClick={() => handleAction('navigate:/streaming')}
        >
          <Video className="w-6 h-6 group-hover:text-gaming-400" />
        </button>
        <div className="flex gap-16 my-4">
          <button 
            className="action-button transition-transform hover:scale-110 active:scale-95 group"
            onClick={() => handleAction('navigate:/messages')}
          >
            <MessageSquare className="w-6 h-6 group-hover:text-gaming-400" />
          </button>
          <button 
            className="action-button transition-transform hover:scale-110 active:scale-95 group"
            onClick={() => handleAction('navigate:/profile')}
          >
            <User className="w-6 h-6 group-hover:text-gaming-400" />
          </button>
        </div>
        <button 
          className="action-button transition-transform hover:scale-110 active:scale-95 group"
          onClick={() => handleAction('navigate:/discover')}
        >
          <Compass className="w-6 h-6 group-hover:text-gaming-400" />
        </button>
      </>
    );
  };

  return (
    <div className="gameboy-container">
      <div className="absolute left-8 bottom-8 w-32 h-32">
        {/* Direction Labels */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-gaming-400 text-sm font-bold flex flex-col items-center gap-2">
          <div className="flex items-center gap-1">
            <ArrowUp className="w-4 h-4" />
            Streaming
          </div>
          <div className="flex items-center gap-1">
            <ArrowDown className="w-4 h-4" />
            Profile
          </div>
          <div className="flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Discover
          </div>
          <div className="flex items-center gap-1">
            Messages
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* New Circular D-Pad */}
        <div className="relative w-full h-full">
          {/* Center Button */}
          <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#333] to-[#111] shadow-lg border border-gaming-400/30">
            <div className="absolute inset-0 rounded-full bg-black/20"></div>
          </div>
          
          {/* Directional Buttons */}
          <button 
            onClick={() => handleDirectionClick('up')}
            className={`absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full 
              ${activeDirection === 'up' ? 'bg-gaming-400/50' : 'bg-transparent'} 
              hover:bg-gaming-400/30 transition-colors`}
          />
          <button 
            onClick={() => handleDirectionClick('right')}
            className={`absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full 
              ${activeDirection === 'right' ? 'bg-gaming-400/50' : 'bg-transparent'} 
              hover:bg-gaming-400/30 transition-colors`}
          />
          <button 
            onClick={() => handleDirectionClick('down')}
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full 
              ${activeDirection === 'down' ? 'bg-gaming-400/50' : 'bg-transparent'} 
              hover:bg-gaming-400/30 transition-colors`}
          />
          <button 
            onClick={() => handleDirectionClick('left')}
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full 
              ${activeDirection === 'left' ? 'bg-gaming-400/50' : 'bg-transparent'} 
              hover:bg-gaming-400/30 transition-colors`}
          />
        </div>
      </div>

      <div className="action-buttons-container">
        {renderActionButtons()}
      </div>
    </div>
  );
};

export default GameBoyControls;