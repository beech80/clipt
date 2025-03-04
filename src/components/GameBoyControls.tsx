import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, MessageCircle, Trophy, Menu, Camera, UserPlus } from 'lucide-react';

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

  const handlePost = () => {
    navigate('/post/new');
  };

  const handleClipt = () => {
    navigate('/');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[70px] z-50">
      <div className="max-w-screen-md mx-auto relative h-full">
        <div className="absolute inset-x-0 bottom-0 h-[70px] bg-[#161925] pointer-events-auto">
          {/* Top border line */}
          <div className="h-[1px] w-full bg-blue-500/30" />
          
          <div className="flex justify-between items-center px-4 h-full">
            {/* Left joystick - classic look */}
            <div className="w-[50px] h-[50px] flex items-center justify-center">
              <div className="w-[50px] h-[50px] rounded-full bg-[#222430] flex items-center justify-center" 
                  style={{ 
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.9)'
                  }}>
                <div className="w-[35px] h-[35px] rounded-full bg-[#1e202b]"
                    style={{ 
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                </div>
              </div>
            </div>
            
            {/* Middle section with CLIPT button */}
            <div className="flex items-center justify-center">
              <div 
                className="w-16 h-16 rounded-full cursor-pointer relative" 
                onClick={handleClipt}
                style={{
                  background: 'rgba(22, 25, 37, 0.9)',
                }}
              >
                <div 
                  className="absolute inset-0 w-full h-full rounded-full" 
                  style={{
                    border: '2px solid transparent',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6) border-box',
                    WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center">
                    <Camera size={18} className="text-white mb-0.5" />
                    <span className="text-xs font-medium text-white">CLIPT</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right control pad with buttons in diamond layout */}
            <div className="relative w-[100px] h-[100px]">
              {/* Top button (Heart) */}
              <div 
                className="absolute top-0 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-[#252838] flex items-center justify-center cursor-pointer hover:bg-[#2b2e42] transition-colors" 
                onClick={handleLike}
              >
                <Heart size={18} className="text-red-500" />
              </div>
              
              {/* Left button (Message) */}
              <div 
                className="absolute top-1/2 left-0 transform -translate-y-1/2 w-10 h-10 rounded-full bg-[#252838] flex items-center justify-center cursor-pointer hover:bg-[#2b2e42] transition-colors" 
                onClick={handleComment}
              >
                <MessageCircle size={18} className="text-blue-500" />
              </div>
              
              {/* Right button (Trophy) */}
              <div 
                className="absolute top-1/2 right-0 transform -translate-y-1/2 w-10 h-10 rounded-full bg-[#252838] flex items-center justify-center cursor-pointer hover:bg-[#2b2e42] transition-colors" 
                onClick={handleTrophy}
              >
                <Trophy size={18} className="text-yellow-500" />
              </div>
              
              {/* Bottom button (Follow) */}
              <div 
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-[#252838] flex items-center justify-center cursor-pointer hover:bg-[#2b2e42] transition-colors" 
                onClick={handleFollow}
              >
                <UserPlus size={18} className="text-green-500" />
              </div>
              
              {/* Post button underneath */}
              <div 
                className="absolute bottom-[-30px] left-1/2 transform -translate-x-1/2 w-14 h-9 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center cursor-pointer hover:from-purple-600 hover:to-purple-700 transition-colors" 
                onClick={handlePost}
              >
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
