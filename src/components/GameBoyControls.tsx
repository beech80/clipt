import React from 'react';
import { Menu, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import Joystick from './gameboy/Joystick';
import ActionButtons from './gameboy/ActionButtons';
import { handleVideoControl } from './gameboy/VideoControls';
import { useSheetState } from '@/hooks/use-sheet-state';

interface GameBoyControlsProps {
  currentPostId?: string;
}

const GameBoyControls: React.FC<GameBoyControlsProps> = ({ currentPostId }) => {
  const navigate = useNavigate();
  const { setIsOpen } = useSheetState();

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

  const navigationItems = [
    { name: 'Home', path: '/' },
    { name: 'Discover', path: '/discover' },
    { name: 'Messages', path: '/messages' },
    { name: 'Profile', path: '/profile' },
    { name: 'Streaming', path: '/streaming' },
    { name: 'Top Clips', path: '/top-clips' },
    { name: 'Clipts', path: '/clipts' },
    { name: 'Settings', path: '/settings' },
  ];

  return (
    <div className="gameboy-container h-[140px] sm:h-[160px] bg-gaming-900/95 backdrop-blur-sm fixed bottom-0 left-0 right-0 z-50 touch-none border-t-2 border-gaming-400">
      <div className="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <button className="rounded-full bg-gaming-400/20 p-2.5 sm:p-3 backdrop-blur-sm border border-gaming-400/30 
              hover:bg-gaming-400/30 transition-all duration-300 touch-none active:scale-95">
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-gaming-400" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="w-full max-w-xl mx-auto rounded-t-xl bg-gaming-900/95 backdrop-blur-xl border-gaming-400/30">
            <nav className="grid grid-cols-2 gap-2 p-3">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    toast.success(`Navigating to ${item.name}`);
                  }}
                  className="p-3 sm:p-4 rounded-lg bg-gaming-400/10 hover:bg-gaming-400/20 
                    active:bg-gaming-400/30 transition-all duration-300 text-gaming-400 
                    font-medium text-sm sm:text-base active:scale-95"
                >
                  {item.name}
                </button>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      <div className="fixed left-1/2 -translate-x-1/2 bottom-16 sm:bottom-20">
        <button 
          onClick={() => navigate('/clipts')}
          className="clip-button active:scale-95 transition-transform"
          aria-label="Create Clipt"
        >
          <Play className="clip-button-icon" />
          <span className="clip-button-text">Clipt</span>
        </button>
      </div>

      <div className="fixed left-4 sm:left-8 bottom-6 sm:bottom-8 w-28 sm:w-32 h-28 sm:h-32">
        <Joystick onDirectionChange={handleVideoControl} />
      </div>

      <div className="fixed right-4 sm:right-8 bottom-6 sm:bottom-8 w-24 sm:w-28 h-24 sm:h-28">
        <ActionButtons onAction={handleAction} postId={currentPostId || ''} />
      </div>
    </div>
  );
};

export default GameBoyControls;