import React, { useState, useEffect } from 'react';
import { Menu, Book, Users, Home, Settings, X } from 'lucide-react';
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

  const menuItems = [
    {
      name: 'Home',
      path: '/',
      icon: <Home className="w-4 h-4" />,
    },
    {
      name: 'Discover',
      path: '/discover',
      icon: <Book className="w-4 h-4" />,
    },
    {
      name: 'Clipts',
      path: '/clipts',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>,
    },
    {
      name: 'Messages',
      path: '/messages',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>,
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
    },
    {
      name: 'Collections',
      path: '/collections',
      icon: <Users className="w-4 h-4" />,
    },
    {
      name: 'Top Clipts',
      path: '/top-clipts',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>,
    },
    {
      name: 'Streaming',
      path: '/streaming',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <div className="gameboy-container h-[120px] bg-[#1A1B26] fixed bottom-0 left-0 right-0 z-50 touch-none border-t border-[#272A37]">
      {/* Menu button (center bottom) */}
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="rounded-full w-10 h-10 bg-[#272A37] flex items-center justify-center border border-[#3f4255] hover:bg-[#2d3044] transition-colors">
              <Menu className="h-5 w-5 text-[#6366F1]" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-[#1A1B26] border-t border-[#272A37] p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Navigation</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-full">
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    toast.success(`Navigating to ${item.name}`);
                    setIsOpen(false);
                  }}
                  className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#272A37]/80 hover:bg-[#272A37]
                    active:bg-[#272A37] transition-all duration-300 text-gray-300
                    font-medium text-sm active:scale-95"
                >
                  {item.icon}
                  <span className="mt-1 text-xs">{item.name}</span>
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Left-side joystick - Xbox style */}
      <div className="absolute bottom-[78px] left-[38px]">
        <div className="w-[65px] h-[65px]">
          <Joystick navigate={navigate} />
        </div>
      </div>
      
      {/* CLIPT button with cooler animated ring */}
      <div className="absolute bottom-[85px] left-1/2 -translate-x-1/2">
        <button 
          onClick={() => navigate('/clipts/create')}
          className="relative flex items-center justify-center"
          aria-label="Create CLIPT"
        >
          {/* Fancy animated rings */}
          <div className="absolute inset-0 w-full h-full animate-spin-slow">
            <div 
              className="w-[48px] h-[48px] rounded-full animate-ring-glow"
              style={{
                border: '1.5px solid rgba(139, 92, 246, 0.8)',
                boxShadow: '0 0 8px rgba(139, 92, 246, 0.9)',
                background: 'linear-gradient(45deg, rgba(139, 92, 246, 0.1), rgba(79, 70, 229, 0.1))',
              }}
            ></div>
          </div>
          
          {/* Second ring rotating opposite direction */}
          <div className="absolute inset-0 w-full h-full" style={{ animation: 'spin 7s linear infinite reverse' }}>
            <div 
              className="w-[44px] h-[44px] rounded-full"
              style={{
                border: '1px solid rgba(168, 85, 247, 0.6)',
                boxShadow: '0 0 5px rgba(168, 85, 247, 0.7)',
              }}
            ></div>
          </div>
          
          {/* Third floating ring */}
          <div className="absolute inset-0 w-full h-full animate-pulse-gentle">
            <div 
              className="w-[50px] h-[50px] rounded-full"
              style={{
                border: '1px dashed rgba(139, 92, 246, 0.4)',
              }}
            ></div>
          </div>
          
          {/* Black center button */}
          <div className="relative z-10 flex items-center justify-center w-[35px] h-[35px] rounded-full bg-black">
            <div className="flex flex-col items-center">
              {/* Camera icon and CLIPT text */}
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
              <span className="text-[7px] font-bold text-white tracking-wide mt-0.5">CLIPT</span>
            </div>
          </div>
        </button>
      </div>
      
      {/* Right-side action buttons */}
      <div className="absolute bottom-[78px] right-[38px]">
        <ActionButtons postId={postId} onAction={handleAction} />
      </div>
    </div>
  );
};

export default GameBoyControls;
