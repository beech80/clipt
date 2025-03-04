import React, { useState, useEffect } from 'react';
import { Menu, Camera, Trophy, Gamepad, MessageSquare, Users, Video, Home, Settings } from 'lucide-react';
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
    
    console.log("GameBoyControls setting postId:", {
      currentPostId,
      paramsId: params.id,
      finalPostId: newPostId,
      currentPathname: window.location.pathname
    });
    
    setPostId(newPostId);
  }, [currentPostId, params.id]);

  // Handle keyboard navigation for gameboy controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Joystick navigation using arrow keys
      if (e.key === 'ArrowUp') {
        navigate('/');
      } else if (e.key === 'ArrowDown') {
        navigate('/profile');
      } else if (e.key === 'ArrowLeft') {
        navigate('/discover');
      } else if (e.key === 'ArrowRight') {
        navigate('/clipts');
      }
      
      // Action buttons
      if (e.key === 'a' || e.key === 'A') {
        // Like action
        const likeButton = document.querySelector('[data-action="like"]') as HTMLButtonElement;
        if (likeButton) likeButton.click();
      } else if (e.key === 'b' || e.key === 'B') {
        // Comment action
        const commentButton = document.querySelector('[data-action="comment"]') as HTMLButtonElement;
        if (commentButton) commentButton.click();
      } else if (e.key === 'x' || e.key === 'X') {
        // Follow action
        const followButton = document.querySelector('[data-action="follow"]') as HTMLButtonElement;
        if (followButton) followButton.click();
      } else if (e.key === 'y' || e.key === 'Y') {
        // Trophy action
        const trophyButton = document.querySelector('[data-action="trophy"]') as HTMLButtonElement;
        if (trophyButton) trophyButton.click();
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
    { name: 'Discover', path: '/discover', icon: <Gamepad className="w-4 h-4" /> },
    { name: 'Messages', path: '/messages', icon: <MessageSquare className="w-4 h-4" /> },
    { name: 'Profile', path: '/profile', icon: <Users className="w-4 h-4" /> },
    { name: 'Streaming', path: '/streaming', icon: <Video className="w-4 h-4" /> },
    { name: 'Top Clips', path: '/top-clips', icon: <Trophy className="w-4 h-4" /> },
    { name: 'Clipts', path: '/clipts', icon: <Camera className="w-4 h-4" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <div className="gameboy-container h-[200px] sm:h-[220px] bg-gaming-900/95 backdrop-blur-sm fixed bottom-0 left-0 right-0 z-50 touch-none border-t-2 border-gaming-400">
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
      
      {/* Left-side joystick */}
      <div className="absolute bottom-2 left-4 sm:left-8 sm:bottom-4">
        <Joystick navigate={navigate} />
      </div>
      
      {/* "CLIPT" button (middle) */}
      <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2">
        <button 
          onClick={() => navigate('/clipts/create')}
          className="bg-gaming-800 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-sm sm:text-base font-bold
            border-2 border-transparent bg-gradient-to-r from-blue-500 to-purple-600 
            active:scale-95 transition-all duration-300
            relative"
          style={{
            backgroundClip: 'padding-box',
            WebkitBackgroundClip: 'padding-box',
          }}
        >
          <span className="bg-gaming-800 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full">
            CLIPT
          </span>
        </button>
      </div>
      
      {/* Right-side action buttons */}
      <div className="absolute bottom-2 right-4 sm:right-8 sm:bottom-4">
        <ActionButtons postId={postId} onAction={handleAction} />
      </div>
    </div>
  );
};

export default GameBoyControls;
