import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Joystick from './gameboy/Joystick';
import ActionButtons from './gameboy/ActionButtons';

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

  return (
    <>
      {/* GameBoy Controls at bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-[120px] z-50 pointer-events-none">
        <div className="max-w-screen-md mx-auto relative h-full">
          <div className="absolute inset-x-0 bottom-0 h-[120px] bg-[#1a1b26]/90 backdrop-blur-md border-t border-[#2c2d4a] rounded-t-xl pointer-events-auto">
            {/* GameBoy Controls */}
            <div className="flex justify-between items-center px-10 py-3 h-full">
              {/* Left joystick */}
              <div className="w-[70px] h-[70px]">
                <Joystick />
              </div>
              
              {/* Middle CLIPT button */}
              <div className="w-16 h-16 bg-[#1a1b26] rounded-full border border-[#2c2d4a] flex items-center justify-center">
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
                <span className="text-lg font-bold relative z-10">CLIPT</span>
              </div>
              
              {/* Right action buttons */}
              <div className="w-[100px] h-[100px]">
                <ActionButtons navigate={navigate} currentPostId={currentPostId || undefined} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GameBoyControls;
