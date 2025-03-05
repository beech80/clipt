import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, MessageCircle, Trophy, Camera, Menu } from 'lucide-react';
import Joystick from './gameboy/Joystick';

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
    <div className="fixed bottom-0 left-0 right-0 h-[150px] z-50">
      <div className="max-w-screen-md mx-auto relative h-full">
        <div className="absolute inset-x-0 bottom-0 h-[150px] bg-[#1a1b26] border-t border-[#2c2d4a] pointer-events-auto">
          {/* Top border line */}
          <div className="h-[1px] w-full bg-blue-500/50" />
          
          <div className="flex justify-between items-center px-4 py-2 h-full">
            {/* Left joystick */}
            <div className="w-[80px] h-[80px] flex items-center justify-center">
              <div className="w-[70px] h-[70px] rounded-full bg-gray-800 shadow-lg flex items-center justify-center" 
                  style={{ 
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.5)'
                  }}>
                <div className="w-[65px] h-[65px] rounded-full bg-gray-700 flex items-center justify-center"
                    style={{ 
                      boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5)'
                    }}>
                  <div className="w-[50px] h-[50px] rounded-full bg-gray-800"
                      style={{ 
                        boxShadow: '0 3px 6px rgba(0,0,0,0.3), inset 0 -2px 5px rgba(0,0,0,0.5)'
                      }}>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Middle CLIPT button */}
            <div className="flex flex-col items-center justify-center gap-5">
              <div className="w-16 h-16 bg-[#1a1b26] rounded-full relative" onClick={handleCameraClick}>
                <div className="absolute inset-0 w-full h-full">
                  <div className="w-full h-full rounded-full" style={{ 
                    border: '2px solid transparent',
                    borderRadius: '50%',
                    background: 'linear-gradient(45deg, #8B5CF6, #6366F1) border-box',
                    WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude'
                  }}></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center">
                    <Camera size={20} className="text-white" />
                    <span className="text-xs font-bold mt-0.5">CLIPT</span>
                  </div>
                </div>
              </div>
              
              {/* Menu button below CLIPT button */}
              <div className="w-10 h-10 rounded-full bg-[#3e3e60] flex items-center justify-center cursor-pointer" onClick={handleMenu}>
                <Menu size={20} className="text-white" />
              </div>
            </div>
            
            {/* Right action buttons */}
            <div className="w-[120px] h-[120px] relative">
              {/* Heart button (top) */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg cursor-pointer" 
                style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
                onClick={handleLike}>
                <Heart size={20} className="text-white" fill="white" />
              </div>
              
              {/* Message button (middle left) */}
              <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-lg cursor-pointer" 
                style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
                onClick={handleComment}>
                <MessageCircle size={20} className="text-white" />
              </div>
              
              {/* Trophy button (middle right) */}
              <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg cursor-pointer" 
                style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
                onClick={handleTrophy}>
                <Trophy size={20} className="text-white" />
              </div>
              
              {/* POST button (bottom) */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-12 rounded-full bg-purple-500 flex items-center justify-center shadow-lg cursor-pointer" 
                style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
                onClick={handlePost}>
                <span className="text-xs font-bold text-white">POST</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoyControls;
