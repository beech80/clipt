import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface JoystickProps {
  onDirectionChange: (direction: string) => void;
}

const Joystick: React.FC<JoystickProps> = ({ onDirectionChange }) => {
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

    // Handle scrolling based on joystick position
    const now = Date.now();
    if (now - lastActionTimeRef.current > 100) { // Throttle updates
      const threshold = maxDistance * 0.5;
      let direction = 'neutral';
      
      if (Math.abs(newY) > Math.abs(newX)) {
        if (newY < -threshold) {
          direction = 'up';
          handleScroll('up');
        } else if (newY > threshold) {
          direction = 'down';
          handleScroll('down');
        }
      }
      
      if (direction !== activeDirection) {
        setActiveDirection(direction);
        onDirectionChange(direction);
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
    <div
      ref={joystickRef}
      className={`joystick-base rounded-full h-full w-full bg-[#272831] relative border border-[#3a3c4a]/40 cursor-grab touch-none select-none ${
        isDraggingRef.current ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      onMouseDown={handleJoystickStart}
      onTouchStart={handleJoystickStart}
    >
      <div
        className="joystick-handle absolute rounded-full bg-[#1A1B24] border border-[#2c2e3e]/40 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[60%] w-[60%] shadow-md flex items-center justify-center"
        style={{
          transform: `translate3d(calc(-50% + ${joystickPosition.x}px), calc(-50% + ${joystickPosition.y}px), 0)`,
        }}
      >
        <div className="h-[30%] w-[30%] bg-[#3a3c4a]/40 rounded-full"></div>
      </div>
    </div>
  );
};

export default Joystick;