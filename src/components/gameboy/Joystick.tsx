import React, { useState, useEffect, useRef } from 'react';
import { debounce } from 'lodash';

const Joystick: React.FC = () => {
  const [active, setActive] = useState<string | null>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const scrollSpeedRef = useRef(0);
  const scrollDirectionRef = useRef<'up' | 'down' | null>(null);
  
  // Scroll animation
  const animateScroll = () => {
    if (scrollDirectionRef.current === 'up') {
      window.scrollBy(0, -scrollSpeedRef.current);
    } else if (scrollDirectionRef.current === 'down') {
      window.scrollBy(0, scrollSpeedRef.current);
    }
    
    if (scrollDirectionRef.current) {
      requestRef.current = requestAnimationFrame(animateScroll);
    }
  };
  
  // Start scrolling
  const startScrolling = (direction: 'up' | 'down') => {
    scrollDirectionRef.current = direction;
    scrollSpeedRef.current = 5; // Initial scroll speed
    
    if (!requestRef.current) {
      requestRef.current = requestAnimationFrame(animateScroll);
    }
    
    // Accelerate scroll speed over time
    const accelerateInterval = setInterval(() => {
      if (scrollDirectionRef.current === direction) {
        scrollSpeedRef.current = Math.min(scrollSpeedRef.current + 5, 30);
      } else {
        clearInterval(accelerateInterval);
      }
    }, 500);
    
    return () => clearInterval(accelerateInterval);
  };
  
  // Stop scrolling
  const stopScrolling = () => {
    scrollDirectionRef.current = null;
    scrollSpeedRef.current = 0;
    
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  };
  
  // Handle joystick button press
  const handlePress = (direction: string) => {
    setActive(direction);
    
    if (direction === 'up') {
      startScrolling('up');
    } else if (direction === 'down') {
      startScrolling('down');
    }
  };
  
  // Handle joystick button release
  const handleRelease = () => {
    setActive(null);
    stopScrolling();
  };
  
  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);
  
  return (
    <div ref={joystickRef} className="w-full h-full flex items-center justify-center relative">
      {/* Joystick base */}
      <div className="w-14 h-14 rounded-full bg-[#171822] border border-[#2c2d4a]"></div>
      
      {/* Up */}
      <button
        onMouseDown={() => handlePress('up')}
        onMouseUp={handleRelease}
        onMouseLeave={handleRelease}
        onTouchStart={() => handlePress('up')}
        onTouchEnd={handleRelease}
        className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-10 h-5 flex items-center justify-center hover:bg-[#1e1f2b]/50 rounded-t-full transition-colors ${active === 'up' ? 'bg-[#1e1f2b]' : ''}`}
        aria-label="Scroll up"
      >
        <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[5px] border-b-[#6366F1]"></div>
      </button>
      
      {/* Down */}
      <button
        onMouseDown={() => handlePress('down')}
        onMouseUp={handleRelease}
        onMouseLeave={handleRelease}
        onTouchStart={() => handlePress('down')}
        onTouchEnd={handleRelease}
        className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 h-5 flex items-center justify-center hover:bg-[#1e1f2b]/50 rounded-b-full transition-colors ${active === 'down' ? 'bg-[#1e1f2b]' : ''}`}
        aria-label="Scroll down"
      >
        <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#6366F1]"></div>
      </button>
      
      {/* The Plus Sign in middle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-6 h-6 flex items-center justify-center">
          <div className="w-5 h-0.5 bg-[#2c2d4a] absolute"></div>
          <div className="w-0.5 h-5 bg-[#2c2d4a] absolute"></div>
        </div>
      </div>
    </div>
  );
};

export default Joystick;