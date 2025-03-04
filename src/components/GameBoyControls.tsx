import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trophy, Home, Search, User } from 'lucide-react';
import Joystick from './gameboy/Joystick';
import ActionButtons from './gameboy/ActionButtons';
import { Button } from './ui/button';

interface GameBoyControlsProps {
  currentPostId?: string;
}

const GameBoyControls: React.FC<GameBoyControlsProps> = ({ currentPostId: propCurrentPostId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPath, setCurrentPath] = useState(location.pathname);
  const [currentPostId, setCurrentPostId] = useState<string | null>(propCurrentPostId || null);

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
          console.log('Current visible post:', postId);
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

  // Handle navigation via GameBoy buttons
  const handleCliptButtonClick = () => {
    navigate('/clipts');
  };

  // Check if a navigation item is active
  const isActive = (paths: string[]) => {
    return paths.some(path => location.pathname.startsWith(path));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[140px] z-50 pointer-events-none">
      <div className="max-w-screen-md mx-auto relative h-full">
        <div className="absolute inset-x-0 bottom-0 h-[120px] bg-[#1a1b26]/90 backdrop-blur-md border-t border-[#2c2d4a] rounded-t-xl pointer-events-auto">
          {/* Top navigation menu */}
          <div className="flex justify-center pt-1 pb-2 gap-5 border-b border-[#2c2d4a]/50">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${isActive(['/']) ? 'text-white' : 'text-[#6c7793]'}`}
              onClick={() => navigate('/')}
              aria-label="Home"
            >
              <Home size={20} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${isActive(['/discover']) ? 'text-white' : 'text-[#6c7793]'}`}
              onClick={() => navigate('/discover')}
              aria-label="Discover"
            >
              <Search size={20} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${isActive(['/topclips']) ? 'text-white' : 'text-[#6c7793]'}`}
              onClick={() => navigate('/topclips')}
              aria-label="Top Clips"
            >
              <Trophy size={20} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${isActive(['/profile']) ? 'text-white' : 'text-[#6c7793]'}`}
              onClick={() => navigate('/profile')}
              aria-label="Profile"
            >
              <User size={20} />
            </Button>
          </div>
          
          {/* GameBoy Controls */}
          <div className="flex justify-between items-center px-8 py-2 h-[80px]">
            {/* Left joystick */}
            <div className="w-[80px] h-[80px]">
              <Joystick />
            </div>
            
            {/* Middle CLIPT button */}
            <div className="w-[80px] h-[80px] relative">
              <button
                onClick={handleCliptButtonClick}
                className="w-full h-full rounded-full bg-[#171822] border border-[#2c2d4a] flex items-center justify-center hover:bg-[#1e1f2b] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-opacity-50"
                aria-label="Go to Clipts page"
              >
                <div className="absolute inset-0 w-full h-full animate-spin-slow">
                  <div className="w-[48px] h-[48px] rounded-full animate-ring-glow" style={{ border: '1.5px solid rgba(139, 92, 246, 0.8)' }}></div>
                </div>
                <span className="text-md font-bold relative z-10 bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] bg-clip-text text-transparent">CLIPT</span>
              </button>
            </div>
            
            {/* Right action buttons */}
            <div className="w-[80px] h-[80px]">
              <ActionButtons navigate={navigate} currentPostId={currentPostId || undefined} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoyControls;
