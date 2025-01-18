import React from 'react';
import { Menu, Play, Heart, MessageSquare, UserPlus, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import Joystick from './gameboy/Joystick';
import { handleVideoControl } from './gameboy/VideoControls';
import { useSheetState } from '@/hooks/use-sheet-state';

const GameBoyControls = () => {
  const navigate = useNavigate();
  const { setIsOpen } = useSheetState();

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
    <div className="fixed bottom-0 left-0 right-0 h-[140px] bg-[#1A1F2C]/95 backdrop-blur-sm z-50">
      {/* Left Side - Joystick */}
      <div className="absolute left-4 bottom-6 w-28 h-28">
        <Joystick onDirectionChange={handleVideoControl} />
      </div>

      {/* Center - Clipt Button */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-16">
        <button 
          onClick={() => navigate('/clipts')}
          className="clip-button active:scale-95 transition-transform"
          aria-label="Create Clipt"
        >
          <Play className="clip-button-icon" />
          <span className="clip-button-text">CLIPT</span>
        </button>
      </div>

      {/* Menu Button */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
        <Sheet onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="rounded-full bg-[#553C9A]/20 p-2.5 backdrop-blur-sm border border-[#553C9A]/30 
              hover:bg-[#553C9A]/30 transition-all duration-300 active:scale-95">
              <Menu className="w-5 h-5 text-[#553C9A]" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="w-full max-w-xl mx-auto rounded-t-xl bg-[#1A1F2C]/95 backdrop-blur-xl border-[#553C9A]/30">
            <nav className="grid grid-cols-2 gap-2 p-3">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    toast.success(`Navigating to ${item.name}`);
                  }}
                  className="p-3 rounded-lg bg-[#553C9A]/10 hover:bg-[#553C9A]/20 
                    active:bg-[#553C9A]/30 transition-all duration-300 text-[#553C9A] 
                    font-medium text-sm active:scale-95"
                >
                  {item.name}
                </button>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Right Side - Action Buttons */}
      <div className="absolute right-4 bottom-6 w-28 h-28">
        <div className="relative w-full h-full">
          {/* Top Button - Heart */}
          <button className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center
            bg-[#1A1F2C] border-2 border-[#2D3748]/50 active:scale-95 transition-all duration-200">
            <Heart className="w-6 h-6 text-[#ea384c]" />
          </button>
          
          {/* Left Button - Message */}
          <button className="absolute top-1/2 left-0 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center
            bg-[#1A1F2C] border-2 border-[#2D3748]/50 active:scale-95 transition-all duration-200">
            <MessageSquare className="w-6 h-6 text-[#0EA5E9]" />
          </button>
          
          {/* Right Button - Follow */}
          <button className="absolute top-1/2 right-0 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center
            bg-[#1A1F2C] border-2 border-[#2D3748]/50 active:scale-95 transition-all duration-200">
            <UserPlus className="w-6 h-6 text-[#22C55E]" />
          </button>
          
          {/* Bottom Button - Trophy */}
          <button className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center
            bg-[#1A1F2C] border-2 border-[#2D3748]/50 active:scale-95 transition-all duration-200">
            <Trophy className="w-6 h-6 text-[#EAB308]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameBoyControls;