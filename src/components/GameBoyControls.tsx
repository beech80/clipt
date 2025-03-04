import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, MessageCircle, Trophy, Camera, Menu } from 'lucide-react';

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

  const handleTrophy = () => {
    if (!currentPostId) return;
    console.log('Trophy for post:', currentPostId);
    // Trophy logic would go here
  };

  const handlePost = () => {
    navigate('/post/new');
  };

  const handleMenu = () => {
    console.log('Open menu');
    // Menu logic would go here
  };

  const handleCameraClick = () => {
    navigate('/');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[70px] z-50">
      <div className="max-w-screen-md mx-auto relative h-full">
        <div className="absolute inset-x-0 bottom-0 h-[70px] bg-[#161925] pointer-events-auto">
          {/* Top border line */}
          <div className="h-[1px] w-full bg-blue-500/30" />
          
          <div className="flex justify-between items-center px-4 h-full">
            {/* Left joystick - more modern look */}
            <div className="w-[45px] h-[45px] flex items-center justify-center">
              <div className="w-[45px] h-[45px] rounded-full bg-[#222430] flex items-center justify-center" 
                  style={{ 
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.9)'
                  }}>
                <div className="w-[30px] h-[30px] rounded-full bg-[#1e202b]"
                    style={{ 
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                </div>
              </div>
            </div>
            
            {/* Middle menu button */}
            <div className="w-9 h-9 rounded-full bg-[#252838] flex items-center justify-center cursor-pointer" onClick={handleMenu}>
              <Menu size={18} className="text-[#6a6e85]" />
            </div>
            
            {/* Center CLIPT button */}
            <div className="w-14 h-14 bg-transparent rounded-full relative" onClick={handleCameraClick}>
              <div className="absolute inset-0 w-full h-full">
                <div className="w-full h-full rounded-full" style={{ 
                  border: '1.5px solid transparent',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6) border-box',
                  WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude'
                }}></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center justify-center">
                  <Camera size={16} className="text-white mb-0.5" />
                  <span className="text-[10px] font-medium text-white">CLIPT</span>
                </div>
              </div>
            </div>
            
            {/* Right buttons group */}
            <div className="flex space-x-3 items-center">
              {/* Heart button */}
              <div className="w-9 h-9 rounded-full bg-transparent border border-[#343a52] flex items-center justify-center cursor-pointer hover:bg-[#252838] transition-colors" onClick={handleLike}>
                <Heart size={16} className="text-red-500" />
              </div>
              
              {/* Message button */}
              <div className="w-9 h-9 rounded-full bg-transparent border border-[#343a52] flex items-center justify-center cursor-pointer hover:bg-[#252838] transition-colors" onClick={handleComment}>
                <MessageCircle size={16} className="text-blue-500" />
              </div>
            </div>
            
            {/* Trophy and POST buttons group */}
            <div className="flex flex-col items-center space-y-2">
              {/* Trophy button on top */}
              <div className="w-9 h-9 rounded-full bg-transparent border border-[#343a52] flex items-center justify-center cursor-pointer hover:bg-[#252838] transition-colors" onClick={handleTrophy}>
                <Trophy size={16} className="text-yellow-500" />
              </div>
              
              {/* POST button below */}
              <div className="w-12 h-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity shadow-sm" onClick={handlePost}>
                <span className="text-[10px] font-bold text-white">POST</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoyControls;
