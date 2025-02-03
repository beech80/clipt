import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Menu, Camera, Trophy, Bot, Gamepad, MessageSquare, Users, Video, Home } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const navigationItems = [
  { name: 'Home', path: '/', icon: <Home className="w-4 h-4" /> },
  { name: 'Discover', path: '/discover', icon: <Gamepad className="w-4 h-4" /> },
  { name: 'Messages', path: '/messages', icon: <MessageSquare className="w-4 h-4" /> },
  { name: 'Profile', path: '/profile', icon: <Users className="w-4 h-4" /> },
  { name: 'Streaming', path: '/streaming', icon: <Video className="w-4 h-4" /> },
  { name: 'Top Clips', path: '/top-clips', icon: <Trophy className="w-4 h-4" /> },
  { name: 'Clipts', path: '/clipts', icon: <Camera className="w-4 h-4" /> },
  { name: 'Settings', path: '/settings', icon: <Bot className="w-4 h-4" /> }
];

const GameBoyNavMenu = () => {
  const navigate = useNavigate();

  return (
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
  );
};

export default GameBoyNavMenu;