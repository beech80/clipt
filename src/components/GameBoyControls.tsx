import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  Heart, 
  Camera,
  MessageCircle, 
  Trophy, 
  UserPlus, 
  X 
} from 'lucide-react';

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
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [pulsating, setPulsating] = useState(false);
  const [glowing, setGlowing] = useState(true);

  // CLIPT button animation
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulsating(true);
      setTimeout(() => setPulsating(false), 1500);
    }, 4000);
    
    const glowInterval = setInterval(() => {
      setGlowing(prev => !prev);
    }, 2000);
    
    return () => {
      clearInterval(pulseInterval);
      clearInterval(glowInterval);
    };
  }, []);

  // Handle joystick movement
  useEffect(() => {
    const joystick = joystickRef.current;
    if (!joystick) return;

    let isDragging = false;
    let startPos = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      startPos = { x: e.clientX, y: e.clientY };
    };

    const handleTouchStart = (e: TouchEvent) => {
      isDragging = true;
      startPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      updateJoystickPosition(e.clientX - startPos.x, e.clientY - startPos.y);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      updateJoystickPosition(
        e.touches[0].clientX - startPos.x,
        e.touches[0].clientY - startPos.y
      );
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      resetJoystickPosition();
    };

    const updateJoystickPosition = (x: number, y: number) => {
      const maxDistance = 5;
      const distance = Math.sqrt(x * x + y * y);
      
      if (distance > maxDistance) {
        const ratio = maxDistance / distance;
        x *= ratio;
        y *= ratio;
      }
      
      setJoystickPos({ x, y });
    };

    const resetJoystickPosition = () => {
      setJoystickPos({ x: 0, y: 0 });
    };

    joystick.addEventListener('mousedown', handleMouseDown);
    joystick.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      joystick.removeEventListener('mousedown', handleMouseDown);
      joystick.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

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
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-[#10101e]/95 backdrop-blur border-t border-[#353b5a]/50 pb-5 pt-5 px-2 md:px-16 lg:px-24 w-full">
        <div className="grid grid-cols-3 items-center">
          {/* Left joystick - moved right and styled like Xbox controller */}
          <div className="flex justify-start pl-4">
            <div className="relative w-[56px] h-[56px] flex items-center justify-center">
              <div 
                ref={joystickRef}
                className="w-[50px] h-[50px] rounded-full border border-[#353b5a]/90 bg-[#232538] flex items-center justify-center shadow-inner"
                style={{
                  transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
                  boxShadow: 'inset 0 1px 8px rgba(0, 0, 0, 0.5)'
                }}
              >
                {/* Xbox-like joystick inner dot */}
                <div className="w-[22px] h-[22px] rounded-full bg-[#353b5a]/80"></div>
              </div>
            </div>
          </div>
          
          {/* Center section - perfectly centered */}
          <div className="flex flex-col items-center space-y-4">
            {/* Animated CLIPT button on top like Xbox button */}
            <div 
              className={`relative w-[58px] h-[58px] rounded-full bg-[#3a2f68] border border-[#6c4dc4]/70 flex items-center justify-center cursor-pointer ${pulsating ? 'animate-pulse' : ''}`}
              onClick={handleClipt}
              style={{
                boxShadow: glowing 
                  ? '0 0 20px 5px rgba(128, 90, 213, 0.8), 0 0 30px 10px rgba(79, 70, 229, 0.5)' 
                  : '0 0 15px 3px rgba(128, 90, 213, 0.7)'
              }}
            >
              <span className="text-white font-bold text-sm">CLIPT</span>
              
              {/* Animated glowing rings */}
              <div 
                className="absolute inset-[-4px] rounded-full border-2 border-transparent animate-spin-slow"
                style={{ 
                  background: 'linear-gradient(45deg, transparent, rgba(147, 51, 234, 0.3), rgba(79, 70, 229, 0.6), transparent)',
                  zIndex: -1
                }} 
              />
              
              <div 
                className="absolute inset-[-2px] rounded-full border-2 border-transparent animate-reverse-spin"
                style={{ 
                  background: 'linear-gradient(135deg, transparent, rgba(79, 70, 229, 0.4), rgba(147, 51, 234, 0.2), transparent)',
                  zIndex: -1,
                  animation: 'spin 10s linear infinite reverse'
                }} 
              />
              
              {/* Outer glow */}
              <div className="absolute inset-0 rounded-full border-2 border-transparent bg-clip-padding" 
                style={{ 
                  backgroundImage: 'linear-gradient(to right, #4f46e5, #8b5cf6)',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude',
                }} 
              />
            </div>
            
            {/* Menu and Post buttons in a row below, like Xbox controller lower buttons */}
            <div className="flex justify-center items-center space-x-12">
              {/* Menu button */}
              <div 
                className="w-[42px] h-[42px] rounded-full bg-[#232538] border border-[#353b5a]/80 flex items-center justify-center cursor-pointer"
                onClick={handleMenu}
              >
                <Menu size={18} className="text-white" />
              </div>
              
              {/* POST/Camera button - styled to match hamburger button */}
              <div 
                className="w-[42px] h-[42px] rounded-full bg-[#232538] border border-[#353b5a]/80 flex items-center justify-center cursor-pointer" 
                onClick={() => navigate('/post/new')}
              >
                <Camera size={18} className="text-white" />
              </div>
            </div>
          </div>
          
          {/* Right diamond buttons */}
          <div className="flex justify-end">
            <div className="flex flex-col items-center -mt-1">
              <div className="relative w-[120px] h-[120px]">
                {/* Top button (Heart/Like) */}
                <div 
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[38px] h-[38px] rounded-full bg-[#232538] border border-[#353b5a]/80 flex items-center justify-center cursor-pointer" 
                  onClick={handleLike}
                >
                  <Heart size={18} className="text-red-500" />
                </div>
                
                {/* Left button (Message/Comment) */}
                <div 
                  className="absolute top-1/2 left-0 transform -translate-y-1/2 w-[38px] h-[38px] rounded-full bg-[#232538] border border-[#353b5a]/80 flex items-center justify-center cursor-pointer" 
                  onClick={handleComment}
                >
                  <MessageCircle size={18} className="text-blue-500" />
                </div>
                
                {/* Right button (Trophy) */}
                <div 
                  className="absolute top-1/2 right-0 transform -translate-y-1/2 w-[38px] h-[38px] rounded-full bg-[#232538] border border-[#353b5a]/80 flex items-center justify-center cursor-pointer" 
                  onClick={handleTrophy}
                >
                  <Trophy size={18} className="text-yellow-500" />
                </div>
                
                {/* Bottom button (UserPlus/Follow) */}
                <div 
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[38px] h-[38px] rounded-full bg-[#232538] border border-[#353b5a]/80 flex items-center justify-center cursor-pointer" 
                  onClick={handleFollow}
                >
                  <UserPlus size={18} className="text-green-500" />
                </div>
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
