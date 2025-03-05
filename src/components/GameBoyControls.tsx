import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, MessageCircle, Trophy, Camera, Menu, UserPlus, Video, Compass, MessageSquare, Settings, Home, ArrowDown } from 'lucide-react';

interface GameBoyControlsProps {
  currentPostId?: string;
}

const GameBoyControls: React.FC<GameBoyControlsProps> = ({ currentPostId: propCurrentPostId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPath, setCurrentPath] = useState(location.pathname);
  const [currentPostId, setCurrentPostId] = useState<string | null>(propCurrentPostId || null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickDirection, setJoystickDirection] = useState<'up' | 'down' | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const joystickTimer = React.useRef<NodeJS.Timeout | null>(null);

  // Keep track of current route
  useEffect(() => {
    setCurrentPath(location.pathname);
    
    // Update current post ID when prop changes
    if (propCurrentPostId) {
      setCurrentPostId(propCurrentPostId);
    }
    
    // Reset the current post ID when changing routes
    if (location.pathname !== currentPath && !propCurrentPostId) {
      setCurrentPostId(null);
    }

    // Close menu when changing routes
    setMenuOpen(false);
  }, [location.pathname, propCurrentPostId, currentPath]);
  
  // Detect current visible post ID
  useEffect(() => {
    // Skip if we already have a post ID from props
    if (propCurrentPostId) return;
    
    const findVisiblePostId = () => {
      // Find all post elements
      const posts = document.querySelectorAll('[data-post-id]');
      if (!posts.length) return;
      
      // Find the post most visible in the viewport
      let mostVisiblePost: Element | null = null;
      let maxVisibleArea = 0;
      
      posts.forEach(post => {
        const rect = post.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Skip if post is not visible
        if (rect.bottom < 100 || rect.top > viewportHeight - 100) {
          return;
        }
        
        // Calculate visible area
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(viewportHeight, rect.bottom);
        const visibleHeight = visibleBottom - visibleTop;
        const visibleRatio = visibleHeight / rect.height;
        
        if (visibleRatio > maxVisibleArea) {
          maxVisibleArea = visibleRatio;
          mostVisiblePost = post;
        }
      });
      
      if (mostVisiblePost && maxVisibleArea > 0.3) {
        const postId = mostVisiblePost.getAttribute('data-post-id');
        if (postId && postId !== currentPostId) {
          setCurrentPostId(postId);
        }
      }
    };
    
    // Run on scroll and resize
    findVisiblePostId();
    window.addEventListener('scroll', findVisiblePostId);
    window.addEventListener('resize', findVisiblePostId);
    
    return () => {
      window.removeEventListener('scroll', findVisiblePostId);
      window.removeEventListener('resize', findVisiblePostId);
    };
  }, [currentPostId, propCurrentPostId]);

  // Handler functions for each button
  const handleLike = async () => {
    if (!currentPostId) return;
    console.log('Like post:', currentPostId);
    // Like logic would go here
  };

  const handleComment = () => {
    if (!currentPostId) return;
    console.log('Comment on post:', currentPostId);
    // Comment logic would go here
  };

  const handleFollow = () => {
    if (!currentPostId) return;
    console.log('Follow user from post:', currentPostId);
    // Follow logic would go here
  };
  
  const handleTrophy = () => {
    if (!currentPostId) return;
    console.log('Trophy for post:', currentPostId);
    // Trophy logic would go here
  };

  const handleClipt = () => {
    navigate('/post/new');
  };

  const handleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleJoystickDown = (direction: 'up' | 'down') => {
    setJoystickActive(true);
    setJoystickDirection(direction);
    
    // Start continuous scrolling
    if (joystickTimer.current) {
      clearInterval(joystickTimer.current);
    }
    
    joystickTimer.current = setInterval(() => {
      if (direction === 'up') {
        window.scrollBy(0, -30);
      } else {
        window.scrollBy(0, 30);
      }
    }, 50);
  };
  
  const handleJoystickUp = () => {
    setJoystickActive(false);
    setJoystickDirection(null);
    
    if (joystickTimer.current) {
      clearInterval(joystickTimer.current);
      joystickTimer.current = null;
    }
  };

  // Navigation helper
  const navigateTo = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[120px] z-50">
      <div className="max-w-screen-md mx-auto relative h-full">
        {/* GameBoy UI background with border */}
        <div className="absolute inset-x-0 bottom-0 h-[120px] bg-[#121328] shadow-lg pointer-events-auto">
          {/* Top border line with glow */}
          <div className="h-[1px] w-full bg-gradient-to-r from-blue-500/30 via-purple-500/40 to-blue-500/30" />
          
          <div className="flex justify-between items-center h-full">
            {/* Left joystick with enhanced design */}
            <div className="relative w-[60px] h-[60px] ml-6 rounded-full bg-[#0c0e1b]/90 flex items-center justify-center shadow-inner border border-[#222444]">
              <div 
                className={`w-[50px] h-[50px] rounded-full bg-[#1c1e2e] flex items-center justify-center transition-transform duration-100 ${
                  joystickActive && joystickDirection === 'up' ? 'translate-y-[-2px]' : 
                  joystickActive && joystickDirection === 'down' ? 'translate-y-[2px]' : ''
                }`}
                style={{ 
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)'
                }}
              >
                {/* Joystick touch areas */}
                <div className="absolute inset-0">
                  <div 
                    className="absolute top-0 left-0 right-0 h-1/2 cursor-pointer"
                    onMouseDown={() => handleJoystickDown('up')}
                    onMouseUp={handleJoystickUp}
                    onMouseLeave={handleJoystickUp}
                    onTouchStart={() => handleJoystickDown('up')}
                    onTouchEnd={handleJoystickUp}
                  />
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-1/2 cursor-pointer"
                    onMouseDown={() => handleJoystickDown('down')}
                    onMouseUp={handleJoystickUp}
                    onMouseLeave={handleJoystickUp}
                    onTouchStart={() => handleJoystickDown('down')}
                    onTouchEnd={handleJoystickUp}
                  />
                </div>
              </div>
            </div>
            
            {/* Menu button */}
            <div className="z-10 absolute left-1/2 transform -translate-x-1/2 top-[65%] -translate-y-1/2">
              <div 
                className="w-[40px] h-[40px] rounded-full bg-[#252838] border border-[#353b5a] flex items-center justify-center cursor-pointer" 
                onClick={handleMenu}
              >
                <Menu size={18} className="text-[#8993bc]" />
              </div>
            </div>
            
            {/* Right control pad with buttons in diamond layout with POST in center */}
            <div className="relative w-[110px] h-[110px] mr-6">
              {/* Top button (Heart/Like) */}
              <div 
                className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[40px] h-[40px] rounded-full bg-[#252838] border border-[#353b5a] flex items-center justify-center cursor-pointer shadow-md" 
                onClick={handleLike}
              >
                <Heart size={20} className="text-red-500" />
              </div>
              
              {/* Left button (Message/Comment) */}
              <div 
                className="absolute top-1/2 left-0 transform -translate-y-1/2 w-[40px] h-[40px] rounded-full bg-[#252838] border border-[#353b5a] flex items-center justify-center cursor-pointer shadow-md" 
                onClick={handleComment}
              >
                <MessageCircle size={20} className="text-blue-500" />
              </div>
              
              {/* Right button (Trophy) */}
              <div 
                className="absolute top-1/2 right-0 transform -translate-y-1/2 w-[40px] h-[40px] rounded-full bg-[#252838] border border-[#353b5a] flex items-center justify-center cursor-pointer shadow-md" 
                onClick={handleTrophy}
              >
                <Trophy size={20} className="text-yellow-500" />
              </div>
              
              {/* POST button in center */}
              <div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[60px] h-[60px] rounded-full bg-[#602985] border-[3px] border-purple-500/70 flex items-center justify-center cursor-pointer shadow-xl" 
                onClick={handleClipt}
                style={{
                  boxShadow: '0 0 15px rgba(128, 90, 213, 0.4)'
                }}
              >
                <Camera size={24} className="text-white mb-4" />
                <div className="absolute -bottom-6 text-[14px] font-bold text-white bg-[#602985] px-3 py-0.5 rounded-sm">POST</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Menu dialog */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm">
          <div className="absolute bottom-20 left-0 right-0 bg-[#161925] border-t border-blue-500/30">
            <div className="max-w-md mx-auto p-4">
              <h3 className="text-white text-lg font-semibold mb-4">Menu</h3>
              <div className="grid grid-cols-2 gap-y-4">
                <div 
                  className="flex items-center space-x-3 p-2 rounded hover:bg-blue-500/10 cursor-pointer"
                  onClick={() => {
                    navigateTo('/profile');
                  }}
                >
                  <UserPlus size={18} className="text-blue-400" />
                  <span className="text-white">Profile</span>
                </div>
                <div 
                  className="flex items-center space-x-3 p-2 rounded hover:bg-blue-500/10 cursor-pointer"
                  onClick={() => {
                    navigateTo('/streaming');
                  }}
                >
                  <Camera size={18} className="text-red-400" />
                  <span className="text-white">Streaming</span>
                </div>
                <div 
                  className="flex items-center space-x-3 p-2 rounded hover:bg-blue-500/10 cursor-pointer"
                  onClick={() => {
                    navigateTo('/discovery');
                  }}
                >
                  <MessageCircle size={18} className="text-green-400" />
                  <span className="text-white">Discovery</span>
                </div>
                <div 
                  className="flex items-center space-x-3 p-2 rounded hover:bg-blue-500/10 cursor-pointer"
                  onClick={() => {
                    navigateTo('/messages');
                  }}
                >
                  <Trophy size={18} className="text-purple-400" />
                  <span className="text-white">Messages</span>
                </div>
                <div 
                  className="flex items-center space-x-3 p-2 rounded hover:bg-blue-500/10 cursor-pointer"
                  onClick={() => {
                    navigateTo('/settings');
                  }}
                >
                  <Menu size={18} className="text-gray-400" />
                  <span className="text-white">Settings</span>
                </div>
                <div 
                  className="flex items-center space-x-3 p-2 rounded hover:bg-blue-500/10 cursor-pointer"
                  onClick={() => {
                    navigateTo('/');
                  }}
                >
                  <Heart size={18} className="text-yellow-400" />
                  <span className="text-white">Home</span>
                </div>
                <div 
                  className="flex items-center space-x-3 p-2 rounded hover:bg-blue-500/10 cursor-pointer"
                  onClick={() => {
                    navigateTo('/clipts');
                  }}
                >
                  <UserPlus size={18} className="text-indigo-400" />
                  <span className="text-white">Clipts</span>
                </div>
                <div 
                  className="flex items-center space-x-3 p-2 rounded hover:bg-blue-500/10 cursor-pointer"
                  onClick={() => {
                    navigateTo('/top-clipts');
                  }}
                >
                  <Trophy size={18} className="text-orange-400" />
                  <span className="text-white">Top Clipts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoyControls;
