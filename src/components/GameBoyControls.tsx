import React, { useState } from 'react';
import { Menu, Camera, Trophy, Bot, Gamepad, MessageSquare, Users, Video, Home, Crown, Settings } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import Joystick from './gameboy/Joystick';
import ActionButtons from './gameboy/ActionButtons';
import { handleVideoControl } from './gameboy/VideoControls';

interface GameBoyControlsProps {
  currentPostId?: string;
}

const GameBoyControls: React.FC<GameBoyControlsProps> = ({ currentPostId }) => {
  const navigate = useNavigate();
  const params = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const postId = currentPostId || params.id || '';

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
    <div className="gameboy-container h-[180px] sm:h-[200px] bg-gaming-900/95 backdrop-blur-sm fixed bottom-0 left-0 right-0 z-50 touch-none border-t-2 border-gaming-400">
      {/* Menu button (center bottom) */}
      <div className="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
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
                    setIsOpen(false);
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

      {/* CLIPT button (center) */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-24 sm:bottom-28">
        <button 
          onClick={() => {
            navigate('/clipts');
            toast.success('Welcome to Clipts!');
          }}
          className="clip-button active:scale-95 transition-transform"
          aria-label="Go to Clipts"
          style={{ width: '80px', height: '60px' }}
        >
          <Camera className="clip-button-icon" />
          <span className="clip-button-text">Clipt</span>
        </button>
      </div>

      {/* Action buttons (right side) */}
      <div className="fixed right-8 bottom-24 w-24 h-24">
        <ActionButtons onAction={handleAction} postId={postId} />
      </div>

      {/* Joystick (left side) */}
      <div className="fixed left-8 bottom-20 w-28 h-28">
        <Joystick onDirectionChange={handleVideoControl} />
      </div>
    </div>
  );
};

export default GameBoyControls;
