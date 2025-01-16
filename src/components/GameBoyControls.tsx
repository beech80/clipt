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
  ];

  return (
    <div className="gameboy-container h-[140px] sm:h-[160px] bg-[#1A1F2C]/95 backdrop-blur-sm fixed bottom-0 left-0 right-0 border-t border-[#403E43] z-50">
      {/* Bottom Center Navigation Menu */}
      <div className="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-50">
        <Sheet onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="rounded-full bg-[#403E43] p-2 sm:p-3 hover:bg-[#504E53] transition-colors">
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-[#1A1F2C]/95 backdrop-blur-xl border-t border-[#403E43]">
            <nav className="grid grid-cols-2 gap-2 p-3">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    toast.success(`Navigating to ${item.name}`);
                  }}
                  className="p-2 sm:p-3 rounded-lg bg-[#403E43]/50 hover:bg-[#403E43] transition-colors text-white"
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