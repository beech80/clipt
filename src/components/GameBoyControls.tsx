import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Trophy, User } from 'lucide-react';
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
  const [initialTouchX, setInitialTouchX] = useState<number | null>(null);
  const [currentNavIndex, setCurrentNavIndex] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { name: 'Home', path: '/', icon: <Home size={18} /> },
    { name: 'Discover', path: '/discover', icon: <Search size={18} /> },
    { name: 'Top Clips', path: '/topclips', icon: <Trophy size={18} /> },
    { name: 'Profile', path: '/profile', icon: <User size={18} /> }
  ];
  
  // Set current nav index based on path
  useEffect(() => {
    const index = navItems.findIndex(item => location.pathname.startsWith(item.path));
    if (index !== -1) {
      setCurrentNavIndex(index);
    }
  }, [location.pathname]);

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

  // Handle touch events for sliding navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setInitialTouchX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (initialTouchX === null || !headerRef.current) return;
    
    const currentX = e.touches[0].clientX;
    const diff = initialTouchX - currentX;
    
    // Prevent default to avoid scrolling the page
    if (Math.abs(diff) > 10) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (initialTouchX === null) return;
    
    const finalX = e.changedTouches[0].clientX;
    const diff = initialTouchX - finalX;
    
    // If the swipe is significant enough
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentNavIndex < navItems.length - 1) {
        // Swiped left, go to next
        navigate(navItems[currentNavIndex + 1].path);
      } else if (diff < 0 && currentNavIndex > 0) {
        // Swiped right, go to previous
        navigate(navItems[currentNavIndex - 1].path);
      }
    }
    
    setInitialTouchX(null);
  };

  return (
    <>
      {/* Sliding Header Navigation */}
      <div 
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 bg-[#1a1b26]/95 backdrop-blur-md border-b border-[#2c2d4a]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="max-w-screen-md mx-auto overflow-hidden">
          <div 
            className="flex justify-between items-center transition-transform duration-300 px-2"
            style={{ 
              transform: `translateX(${-currentNavIndex * 25}%)` 
            }}
          >
            {navItems.map((item, index) => (
              <div 
                key={item.path}
                className={`flex-1 py-3 text-center transition-opacity ${
                  index === currentNavIndex ? 'opacity-100' : 'opacity-60'
                }`}
                onClick={() => navigate(item.path)}
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="mb-1">{item.icon}</div>
                  <span className="text-xs font-medium">{item.name}</span>
                </div>
                {index === currentNavIndex && (
                  <div className="h-0.5 w-12 bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] rounded-full mx-auto mt-1" />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* CLIPT Logo in top header */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
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
        </div>
      </div>
    
      {/* GameBoy Controls at bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-[120px] z-50 pointer-events-none">
        <div className="max-w-screen-md mx-auto relative h-full">
          <div className="absolute inset-x-0 bottom-0 h-[120px] bg-[#1a1b26]/90 backdrop-blur-md border-t border-[#2c2d4a] rounded-t-xl pointer-events-auto">
            {/* GameBoy Controls */}
            <div className="flex justify-between items-center px-10 py-3 h-full">
              {/* Left joystick (smaller) */}
              <div className="w-[70px] h-[70px]">
                <Joystick />
              </div>
              
              {/* Right action buttons (bigger area) */}
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
