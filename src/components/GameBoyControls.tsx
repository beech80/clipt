import React, { useState } from 'react';
import { 
  Heart,
  MessageSquare,
  UserPlus,
  Trophy,
  Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const GameBoyControls = () => {
  const [activeDirection, setActiveDirection] = useState<string>('neutral');
  const navigate = useNavigate();

  const handleAction = (action: string) => {
    switch(action) {
      case 'like':
        toast.success('Liked!');
        break;
      case 'comment':
        toast.success('Comment added!');
        break;
      case 'follow':
        toast.success('Following!');
        break;
      case 'rank':
        toast.success('Ranked!');
        break;
      default:
        break;
    }
  };

  const handleDirectionClick = (direction: string) => {
    setActiveDirection(direction);
    switch (direction) {
      case 'up':
        toast.info('Previous clip');
        break;
      case 'down':
        toast.info('Next clip');
        break;
      case 'left':
        toast.info('Rewind 10s');
        break;
      case 'right':
        toast.info('Forward 10s');
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
          onClick={() => handleAction('like')}
        >
          <Heart className="w-5 h-5 sm:w-6 sm:h-6 group-hover:text-gaming-400" />
        </button>
        <div className="flex gap-8 sm:gap-16 my-2 sm:my-4">
          <button 
            className="action-button transition-transform hover:scale-110 active:scale-95 group"
            onClick={() => handleAction('comment')}
          >
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 group-hover:text-gaming-400" />
          </button>
          <button 
            className="action-button transition-transform hover:scale-110 active:scale-95 group"
            onClick={() => handleAction('follow')}
          >
            <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 group-hover:text-gaming-400" />
          </button>
        </div>
        <button 
          className="action-button transition-transform hover:scale-110 active:scale-95 group"
          onClick={() => handleAction('rank')}
        >
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 group-hover:text-gaming-400" />
        </button>
      </>
    );
  };

  const navigationItems = [
    { name: 'Home', path: '/' },
    { name: 'Discover', path: '/discover' },
    { name: 'Messages', path: '/messages' },
    { name: 'Profile', path: '/profile' },
    { name: 'Streaming', path: '/streaming' },
    { name: 'Top Clips', path: '/top-clips' },
  ];

  return (
    <div className="gameboy-container h-[120px] sm:h-[160px] bg-background/95 backdrop-blur-sm">
      {/* Bottom Center Navigation Menu */}
      <div className="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <button className="rounded-full bg-gaming-400/20 p-2 sm:p-3 backdrop-blur-sm border border-gaming-400/30 hover:bg-gaming-400/30 transition-all duration-300">
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-gaming-400" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="w-full max-w-xl mx-auto rounded-t-xl bg-background/95 backdrop-blur-xl border-gaming-400/30">
            <nav className="grid grid-cols-2 gap-2 p-3">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    toast.success(`Navigating to ${item.name}`);
                  }}
                  className="p-2 sm:p-3 rounded-lg bg-gaming-400/10 hover:bg-gaming-400/20 transition-all duration-300 text-gaming-400 font-medium text-sm"
                >
                  {item.name}
                </button>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Centered D-Pad */}
      <div className="fixed left-3 sm:left-6 bottom-2 sm:bottom-4 w-20 sm:w-28 h-20 sm:h-28">
        <div className="relative w-full h-full">
          {/* Center Button */}
          <div className="absolute inset-0 m-auto w-10 sm:w-14 h-10 sm:h-14 rounded-full bg-gradient-to-br from-[#333] to-[#111] shadow-lg border border-gaming-400/30">
            <div className="absolute inset-0 rounded-full bg-black/20"></div>
          </div>
          
          {/* Directional Buttons */}
          <button 
            onClick={() => handleDirectionClick('up')}
            className={`absolute top-0 left-1/2 -translate-x-1/2 w-6 sm:w-8 h-6 sm:h-8 rounded-full 
              ${activeDirection === 'up' ? 'bg-gaming-400/50' : 'bg-transparent'} 
              hover:bg-gaming-400/30 transition-colors`}
          />
          <button 
            onClick={() => handleDirectionClick('right')}
            className={`absolute right-0 top-1/2 -translate-y-1/2 w-6 sm:w-8 h-6 sm:h-8 rounded-full 
              ${activeDirection === 'right' ? 'bg-gaming-400/50' : 'bg-transparent'} 
              hover:bg-gaming-400/30 transition-colors`}
          />
          <button 
            onClick={() => handleDirectionClick('down')}
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-6 sm:w-8 h-6 sm:h-8 rounded-full 
              ${activeDirection === 'down' ? 'bg-gaming-400/50' : 'bg-transparent'} 
              hover:bg-gaming-400/30 transition-colors`}
          />
          <button 
            onClick={() => handleDirectionClick('left')}
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-6 sm:w-8 h-6 sm:h-8 rounded-full 
              ${activeDirection === 'left' ? 'bg-gaming-400/50' : 'bg-transparent'} 
              hover:bg-gaming-400/30 transition-colors`}
          />
        </div>
      </div>

      <div className="action-buttons-container w-24 sm:w-32 h-24 sm:h-32 right-3 sm:right-6 bottom-2 sm:bottom-4">
        {renderActionButtons()}
      </div>
    </div>
  );
};

export default GameBoyControls;