import React, { useState } from 'react';
import { 
  Heart,
  MessageSquare,
  UserPlus,
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
  ];

  return (
    <div className="gameboy-container">
      {/* Center Navigation Menu */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <button className="rounded-full bg-black/50 p-3 backdrop-blur-sm border border-[#9b87f5]/30 hover:bg-[#9b87f5]/20 transition-all duration-300">
              <Menu className="w-5 h-5 text-[#9b87f5]" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[300px] rounded-t-xl bg-black/95 backdrop-blur-xl border-[#9b87f5]/30">
            <nav className="grid grid-cols-2 gap-3 p-4">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    toast.success(`Navigating to ${item.name}`);
                  }}
                  className="p-4 rounded-lg bg-[#9b87f5]/10 hover:bg-[#9b87f5]/20 transition-all duration-300 text-[#9b87f5] font-medium text-sm"
                >
                  {item.name}
                </button>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons-container">
        <button 
          className="action-button group"
          onClick={() => handleAction('like')}
        >
          <Heart className="w-5 h-5 group-hover:text-[#9b87f5]" />
        </button>
        <button 
          className="action-button group"
          onClick={() => handleAction('comment')}
        >
          <MessageSquare className="w-5 h-5 group-hover:text-[#9b87f5]" />
        </button>
        <button 
          className="action-button group"
          onClick={() => handleAction('follow')}
        >
          <UserPlus className="w-5 h-5 group-hover:text-[#9b87f5]" />
        </button>
      </div>
    </div>
  );
};

export default GameBoyControls;