import React, { useState, useEffect } from 'react';
import { Menu, Camera, Trophy, Gamepad, MessageSquare, Users, Video, Home, Settings } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gaming-900">
      {/* Navigation menu button */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white">
              <Menu className="w-6 h-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-gaming-900 border-t border-gaming-700">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsOpen(false);
                  }}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gaming-800"
                >
                  {item.icon}
                  <span className="text-xs">{item.name}</span>
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Bottom controls row with colored buttons */}
      <div className="h-16 flex items-center justify-between px-4 border-t border-gaming-800">
        {/* D-Pad on left */}
        <div className="flex-shrink-0">
          <Joystick navigate={navigate} />
        </div>

        {/* CLIPT button (center) */}
        <button 
          onClick={() => navigate('/clipts/create')}
          className="px-4 py-2 rounded-full bg-gaming-800 text-white font-semibold text-sm
                   border-2 border-transparent bg-gradient-to-r from-blue-500 to-purple-500"
          style={{
            backgroundClip: 'padding-box',
          }}
        >
          CLIPT
        </button>

        {/* Action buttons on right */}
        <div className="flex-shrink-0">
          <ActionButtons postId={postId} onAction={handleAction} />
        </div>
      </div>
    </div>
  );
};

export default GameBoyControls;
