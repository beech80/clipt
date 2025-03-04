import React, { useState, useEffect } from 'react';
import { Menu, Camera, Book, Users, Home, Settings, X } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [postId, setPostId] = useState('');
  
  // Set postId with priority: currentPostId from App > URL params > empty string
  useEffect(() => {
    let newPostId = '';
    if (currentPostId && currentPostId !== 'undefined' && currentPostId !== 'null') {
      newPostId = currentPostId;
    } else if (params.id && params.id !== 'undefined' && params.id !== 'null') {
      newPostId = params.id;
    }
    
    // If we're in the post page, try to extract the ID from the URL
    if (!newPostId && location.pathname.startsWith('/post/')) {
      const pathSegments = location.pathname.split('/');
      if (pathSegments[2]) {
        newPostId = pathSegments[2];
      }
    }
    
    setPostId(newPostId);
  }, [currentPostId, params, location.pathname]);
  
  // Handle keydown for controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        navigate('/');
      } else if (e.key === 'ArrowDown') {
        navigate('/collections');
      } else if (e.key === 'ArrowLeft') {
        navigate('/clipts');
      } else if (e.key === 'ArrowRight') {
        navigate('/discover');
      }
      
      // A button (key: z) - Like
      if (e.key === 'z') {
        const actionButtons = document.querySelector('[aria-label="Like"]') as HTMLButtonElement;
        if (actionButtons) actionButtons.click();
      }
      
      // B button (key: x) - Comment
      if (e.key === 'x') {
        const commentButton = document.querySelector('[aria-label="Comment"]') as HTMLButtonElement;
        if (commentButton) commentButton.click();
      }
      
      // Video controls when in post view
      if (location.pathname.includes('/post/')) {
        handleVideoControl(e);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, location.pathname]);

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
    { name: 'Discover', path: '/discover', icon: <Book className="w-4 h-4" /> },
    { name: 'Profile', path: '/profile', icon: <Users className="w-4 h-4" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <div className="gameboy-container h-28 bg-[#151924] fixed bottom-0 left-0 right-0 z-50 touch-none border-t border-[#232738]">
      {/* Menu button (center bottom) */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="rounded-full w-8 h-8 bg-[#1E2235] flex items-center justify-center shadow-md">
              <Menu className="h-5 w-5 text-[#6366F1]" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-[#151924] border-t border-[#2a2f3d] p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Navigation</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-full">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <nav className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              {navigationItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.path);
                    toast.success(`Navigating to ${item.name}`);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-[#1e2230]/50 hover:bg-[#1e2230]
                    active:bg-[#1e2230] transition-all duration-300 text-gray-300
                    font-medium text-sm active:scale-95"
                >
                  {item.icon}
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Left-side joystick - lifted higher */}
      <div className="absolute bottom-6 left-12">
        <div className="w-18 h-18">
          <Joystick navigate={navigate} />
        </div>
      </div>
      
      {/* "CLIPT" button (middle) - with animated oval */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
        <button 
          onClick={() => navigate('/clipts/create')}
          className="flex items-center justify-center w-16 h-16 relative"
        >
          {/* Animated rotating oval ring */}
          <div 
            className="absolute inset-0 w-full h-full rounded-full animate-spin-slow"
            style={{ 
              background: 'conic-gradient(from 0deg, #6366F1, #3730A3, #6366F1)',
              opacity: 0.9,
              border: '2px solid transparent',
              borderRadius: '100%',
            }}
          ></div>
          
          {/* Center button */}
          <div className="relative w-[85%] h-[85%] rounded-full bg-[#151924] flex items-center justify-center z-10">
            <div className="flex flex-col items-center justify-center">
              <div className="text-[10px] font-bold text-white mb-0.5">
                <Camera className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px] font-bold text-white tracking-wider">CLIPT</span>
            </div>
          </div>
        </button>
      </div>
      
      {/* Right-side action buttons - lifted higher */}
      <div className="absolute bottom-6 right-12">
        <ActionButtons postId={postId} onAction={handleAction} />
      </div>
    </div>
  );
};

export default GameBoyControls;
