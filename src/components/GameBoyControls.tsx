import React from 'react';
import { Menu, Camera, Trophy, Bot, Gamepad, MessageSquare, Users, Video, Home, Crown, Settings } from 'lucide-react';
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
    { name: 'Home', path: '/', icon: <Home className="w-4 h-4" /> },
    { name: 'Discover', path: '/discover', icon: <Gamepad className="w-4 h-4" /> },
    { name: 'Messages', path: '/messages', icon: <MessageSquare className="w-4 h-4" /> },
    { name: 'Profile', path: '/profile', icon: <Users className="w-4 h-4" /> },
    { name: 'Streaming', path: '/streaming', icon: <Video className="w-4 h-4" /> },
    { name: 'Top Clips', path: '/top-clips', icon: <Trophy className="w-4 h-4" /> },
    { name: 'Clipts', path: '/clipts', icon: <Camera className="w-4 h-4" /> },
    { name: 'AI Assistant', path: '/ai-assistant', icon: <Bot className="w-4 h-4" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="w-4 h-4" /> },
    { name: 'Esports', path: '/esports', icon: <Crown className="w-4 h-4" /> }
  ];

  return (
    <div className="h-[70px] bg-[#1e2130] fixed bottom-0 left-0 right-0 z-50 touch-none border-t border-[#3e4462]/30 flex items-center justify-between px-5">
      {/* Joystick on left */}
      <div className="flex-none w-[70px] h-[70px] flex items-center">
        <div className="w-[65px] h-[65px] bg-[#30323d]/60 rounded-full flex items-center justify-center">
          <Joystick onDirectionChange={handleVideoControl} />
        </div>
      </div>
      
      {/* Empty space for proper spacing */}
      <div className="flex-1"></div>
      
      {/* CLIPT button in center with gradient background */}
      <div className="flex-none">
        <button 
          onClick={() => {
            navigate('/clipts');
            toast.success('Welcome to Clipts!');
          }}
          className="relative flex items-center justify-center w-[75px] h-[75px] active:scale-95 transition-transform"
          aria-label="Go to Clipts"
        >
          <div className="absolute inset-0 rounded-full border-2 border-transparent bg-clip-padding p-[2px]" 
               style={{ background: 'linear-gradient(to right, #4f9cf9, #a651fb, #f046ff) border-box' }}>
            <div className="w-full h-full rounded-full bg-[#1e2130]"></div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <Camera className="w-5 h-5 mb-0.5" />
            <span className="text-xs font-bold">CLIPT</span>
          </div>
        </button>
      </div>
      
      {/* Empty space for proper spacing */}
      <div className="flex-1"></div>
      
      {/* Action buttons on right */}
      <div className="flex-none w-[90px] h-[70px] flex items-center justify-center">
        <ActionButtons onAction={handleAction} postId={currentPostId || ''} />
      </div>
      
      {/* Menu button at bottom center */}
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
        <Sheet>
          <SheetTrigger asChild>
            <button className="rounded-full bg-[#4c4f74]/50 p-2 backdrop-blur-sm border border-[#5f6384]/30 
              hover:bg-[#5f6384]/50 transition-all duration-300 touch-none active:scale-95">
              <Menu className="w-4 h-4 text-[#8c91c0]" />
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
                  className="flex items-center gap-2 p-3 sm:p-4 rounded-lg bg-gaming-400/10 hover:bg-gaming-400/20 
                    active:bg-gaming-400/30 transition-all duration-300 text-gaming-400 
                    font-medium text-sm sm:text-base active:scale-95"
                >
                  {item.icon}
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default GameBoyControls;
