import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface JoystickProps {
  navigate?: (path: string) => void;
  onDirectionChange?: (direction: string) => void;
}

const Joystick: React.FC<JoystickProps> = ({ navigate, onDirectionChange }) => {
  const [activeDirection, setActiveDirection] = useState('neutral');
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const joystickRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastActionTimeRef = useRef(0);
  const scrollIntervalRef = useRef<number>();
  const isScrollingRef = useRef(false);

  const handleScroll = (direction: string) => {
    if (isScrollingRef.current) return;
    
    const scrollAmount = window.innerHeight - 200; // Height of a post
    const container = document.querySelector('.post-container');
    if (container) {
      isScrollingRef.current = true;
      
      // Add visual feedback
      toast.info(direction === 'up' ? 'Scrolling Up' : 'Scrolling Down', {
        duration: 1000,
      });
      
      const targetScroll = direction === 'up' 
        ? container.scrollTop - scrollAmount 
        : container.scrollTop + scrollAmount;
      
      container.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });

      // Add delay before allowing next scroll
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800); // Adjust this value to control the delay between scrolls
    }
  };

  const handleJoystickStart = (e: React.MouseEvent | React.TouchEvent) => {
    isDraggingRef.current = true;
    document.addEventListener('mousemove', handleJoystickMove as any);
    document.addEventListener('touchmove', handleJoystickMove as any);
    document.addEventListener('mouseup', handleJoystickEnd);
    document.addEventListener('touchend', handleJoystickEnd);
  };

  const handleJoystickMove = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current || !joystickRef.current) return;

    const joystickRect = joystickRef.current.getBoundingClientRect();
    const centerX = joystickRect.left + joystickRect.width / 2;
    const centerY = joystickRect.top + joystickRect.height / 2;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = 20;
    const angle = Math.atan2(deltaY, deltaX);

    let newX = deltaX;
    let newY = deltaY;

    if (distance > maxDistance) {
      newX = Math.cos(angle) * maxDistance;
      newY = Math.sin(angle) * maxDistance;
    }

    setJoystickPosition({ x: newX, y: newY });

    // Handle navigation based on joystick position
    const now = Date.now();
    if (now - lastActionTimeRef.current > 100) { // Throttle updates
      const threshold = maxDistance * 0.5;
      let direction = 'neutral';
      
      if (Math.abs(newY) > Math.abs(newX)) {
        if (newY < -threshold) {
          direction = 'up';
          if (navigate) navigate('/');
          else if (onDirectionChange) {
            onDirectionChange('up');
            handleScroll('up');
          }
        } else if (newY > threshold) {
          direction = 'down';
          if (navigate) navigate('/collections');
          else if (onDirectionChange) {
            onDirectionChange('down');
            handleScroll('down');
          }
        }
      } else if (Math.abs(newX) > Math.abs(newY)) {
        if (newX < -threshold) {
          direction = 'left';
          if (navigate) navigate('/clipts');
          else if (onDirectionChange) onDirectionChange('left');
        } else if (newX > threshold) {
          direction = 'right';
          if (navigate) navigate('/discover');
          else if (onDirectionChange) onDirectionChange('right');
        }
      }
      
      if (direction !== activeDirection) {
        setActiveDirection(direction);
        lastActionTimeRef.current = now;
      }
    }
  };

  const handleJoystickEnd = () => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleJoystickMove as any);
    document.removeEventListener('touchmove', handleJoystickMove as any);
    document.removeEventListener('mouseup', handleJoystickEnd);
    document.removeEventListener('touchend', handleJoystickEnd);
    
    setJoystickPosition({ x: 0, y: 0 });
    setActiveDirection('neutral');
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = undefined;
    }
  };

  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
      document.removeEventListener('mousemove', handleJoystickMove as any);
      document.removeEventListener('touchmove', handleJoystickMove as any);
      document.removeEventListener('mouseup', handleJoystickEnd);
      document.removeEventListener('touchend', handleJoystickEnd);
    };
  }, []);

  return (
    <div className="relative h-full w-full flex items-center justify-center">
      {/* Xbox-style joystick base with concentric circles for depth */}
      <div 
        ref={joystickRef}
        className={`
          joystick-base 
          rounded-full h-[90%] w-[90%] 
          bg-gradient-to-b from-gray-900 to-black
          relative cursor-grab touch-none select-none
          shadow-[inset_0_2px_8px_rgba(0,0,0,0.5),0_1px_3px_rgba(255,255,255,0.1)]
          border border-gray-800
          ${isDraggingRef.current ? 'cursor-grabbing' : 'cursor-grab'}
        `}
        onMouseDown={handleJoystickStart}
        onTouchStart={handleJoystickStart}
      >
        {/* Outer concentric ring */}
        <div className="absolute inset-2 rounded-full border border-gray-800/30"></div>
        
        {/* Middle concentric ring */}
        <div className="absolute inset-5 rounded-full border border-gray-800/20"></div>

        {/* Joystick thumb */}
        <div
          className="
            joystick-handle 
            absolute rounded-full 
            bg-gradient-to-b from-gray-800 to-gray-900
            left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
            h-[60%] w-[60%] 
            shadow-lg
            flex items-center justify-center
            border border-gray-700
          "
          style={{
            transform: `translate3d(calc(-50% + ${joystickPosition.x}px), calc(-50% + ${joystickPosition.y}px), 0)`,
            boxShadow: '0 3px 10px rgba(0,0,0,0.4), inset 0 -2px 5px rgba(0,0,0,0.5), inset 0 2px 2px rgba(255,255,255,0.1)',
          }}
        >
          {/* Xbox logo-inspired center */}
          <div className="h-[40%] w-[40%] rounded-full bg-gray-950 relative overflow-hidden flex items-center justify-center shadow-inner">
            {/* Center radial gradient created manually with a pseudo-element */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{ 
                background: 'radial-gradient(circle, rgba(75,75,75,0.5) 0%, rgba(30,30,30,0) 70%)' 
              }}
            ></div>
            <div className="h-[30%] w-[30%] rounded-full bg-gray-700"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Joystick;