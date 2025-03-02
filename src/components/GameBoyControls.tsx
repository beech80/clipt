import React from 'react';
import { Menu, Camera } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';

interface GameBoyControlsProps {
  currentPostId?: string;
}

const GameBoyControls: React.FC<GameBoyControlsProps> = ({ currentPostId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const navigationItems = [
    { name: 'Home', path: '/' },
    { name: 'Discover', path: '/discover' },
    { name: 'Messages', path: '/messages' },
    { name: 'Profile', path: '/profile' },
    { name: 'Streaming', path: '/streaming' },
    { name: 'Top Clips', path: '/top-clips' },
    { name: 'Clipts', path: '/clipts' },
    { name: 'AI Assistant', path: '/ai-assistant' },
    { name: 'Settings', path: '/settings' },
    { name: 'Esports', path: '/esports' }
  ];

  return (
    <div className="h-[70px] bg-[#171923] fixed bottom-0 left-0 right-0 z-50 touch-none border-t border-[#2d3748]/30 flex items-center justify-between">
      {/* Joystick on left */}
      <div className="flex-none pl-4">
        <div className="w-[60px] h-[60px] bg-[#2d3748]/50 rounded-full flex items-center justify-center">
          <Joystick onDirectionChange={handleVideoControl} />
        </div>
      </div>
      
      {/* CLIPT button in center with gradient background */}
      <div className="absolute left-1/2 transform -translate-x-1/2 top-[-20px]">
        <button 
          onClick={() => {
            navigate('/clipts');
            toast.success('Welcome to Clipts!');
          }}
          className="relative flex items-center justify-center w-[65px] h-[65px] active:scale-95 transition-transform"
          aria-label="Go to Clipts"
        >
          <div className="absolute inset-0 rounded-full border-2 border-transparent bg-clip-padding p-[2px]" 
               style={{ background: 'linear-gradient(135deg, #4f9cf9, #a651fb, #f046ff) border-box' }}>
            <div className="w-full h-full rounded-full bg-[#171923]"></div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <Camera className="w-5 h-5 mb-0.5" />
            <span className="text-xs font-bold">CLIPT</span>
          </div>
        </button>
      </div>
      
      {/* Action buttons on right */}
      <div className="flex-none pr-4">
        <ActionButtons postId={currentPostId || ''} />
      </div>
      
      {/* Menu button at bottom center */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
        <Sheet>
          <SheetTrigger asChild>
            <button className="rounded-full bg-[#4c4f74]/50 p-2 backdrop-blur-sm border border-[#5f6384]/30 
              hover:bg-[#5f6384]/50 transition-all duration-300 touch-none active:scale-95">
              <Menu className="w-4 h-4 text-[#8c91c0]" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="w-full max-w-xl mx-auto rounded-t-xl bg-[#171923]/95 backdrop-blur-xl border-[#3e4462]/30">
            <nav className="grid grid-cols-2 gap-2 p-3">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    toast.success(`Navigating to ${item.name}`);
                  }}
                  className="flex items-center gap-2 p-3 sm:p-4 rounded-lg bg-[#2d3748]/20 hover:bg-[#2d3748]/30 
                    active:bg-[#2d3748]/40 transition-all duration-300 text-white/80 
                    font-medium text-sm sm:text-base active:scale-95"
                >
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
