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
        <div className="flex gap-6 sm:gap-12 my-2 sm:my-3">
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
    <div className="gameboy-container h-[140px] sm:h-[160px] bg-background/95 backdrop-blur-sm fixed bottom-0 left-0 right-0 z-50">
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

      {/* D-Pad with concave effect */}
      <div className="fixed left-4 sm:left-8 bottom-4 sm:bottom-6 w-28 sm:w-32 h-28 sm:h-32">
        <div className="relative w-full h-full bg-gaming-400/5 rounded-full border-2 border-gaming-400/30 backdrop-blur-sm shadow-lg">
          {/* Center Button with concave effect */}
          <div className="absolute inset-0 m-auto w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-gradient-to-br from-gaming-400/10 to-gaming-400/30 overflow-hidden">
            <div className="absolute inset-0 rounded-full bg-black/40"></div>
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-black/60 to-transparent"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-tl from-gaming-400/20 to-transparent"></div>
          </div>
          
          {/* Directional Buttons with improved visibility and depth */}
          <button 
            onClick={() => handleDirectionClick('up')}
            className={`absolute top-0 left-1/2 -translate-x-1/2 w-10 sm:w-12 h-10 sm:h-12 rounded-full border-2 border-gaming-400/50
              ${activeDirection === 'up' ? 'bg-gaming-400/50' : 'bg-gradient-to-br from-gaming-400/20 to-gaming-400/5'} 
              hover:bg-gaming-400/30 transition-all shadow-inner`}
          >
            <div className="absolute inset-1 rounded-full bg-gradient-to-b from-black/40 to-transparent"></div>
          </button>
          <button 
            onClick={() => handleDirectionClick('right')}
            className={`absolute right-0 top-1/2 -translate-y-1/2 w-10 sm:w-12 h-10 sm:h-12 rounded-full border-2 border-gaming-400/50
              ${activeDirection === 'right' ? 'bg-gaming-400/50' : 'bg-gradient-to-br from-gaming-400/20 to-gaming-400/5'} 
              hover:bg-gaming-400/30 transition-all shadow-inner`}
          >
            <div className="absolute inset-1 rounded-full bg-gradient-to-r from-black/40 to-transparent"></div>
          </button>
          <button 
            onClick={() => handleDirectionClick('down')}
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-10 sm:w-12 h-10 sm:h-12 rounded-full border-2 border-gaming-400/50
              ${activeDirection === 'down' ? 'bg-gaming-400/50' : 'bg-gradient-to-br from-gaming-400/20 to-gaming-400/5'} 
              hover:bg-gaming-400/30 transition-all shadow-inner`}
          >
            <div className="absolute inset-1 rounded-full bg-gradient-to-t from-black/40 to-transparent"></div>
          </button>
          <button 
            onClick={() => handleDirectionClick('left')}
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-10 sm:w-12 h-10 sm:h-12 rounded-full border-2 border-gaming-400/50
              ${activeDirection === 'left' ? 'bg-gaming-400/50' : 'bg-gradient-to-br from-gaming-400/20 to-gaming-400/5'} 
              hover:bg-gaming-400/30 transition-all shadow-inner`}
          >
            <div className="absolute inset-1 rounded-full bg-gradient-to-l from-black/40 to-transparent"></div>
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed right-4 sm:right-8 bottom-4 sm:bottom-6 w-28 sm:w-32 h-28 sm:h-32 flex flex-col items-center justify-center">
        {renderActionButtons()}
      </div>
    </div>
  );
};

export default GameBoyControls;