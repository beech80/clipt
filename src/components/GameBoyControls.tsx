import React from 'react';
import { Menu } from 'lucide-react';
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

const GameBoyControls = ({ currentPostId }: GameBoyControlsProps) => {
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
    <div className="gameboy-container h-[140px] sm:h-[160px] bg-background/95 backdrop-blur-sm fixed bottom-0 left-0 right-0 z-50">
      {/* Bottom Center Navigation Menu */}
      <div className="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-50">
        <Sheet onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="gaming-button">
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
                  className="gaming-button"
                >
                  {item.name}
                </button>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* D-Pad with Xbox-style joystick */}
      <div className="fixed left-4 sm:left-8 bottom-6 sm:bottom-8 w-28 sm:w-32 h-28 sm:h-32">
        <Joystick onDirectionChange={handleVideoControl} />
      </div>

      {/* Action Buttons */}
      <div className="fixed right-4 sm:right-8 bottom-6 sm:bottom-8 w-28 sm:w-32 h-28 sm:h-32">
        <ActionButtons onAction={handleAction} postId={currentPostId || ''} />
      </div>
    </div>
  );
};

export default GameBoyControls;