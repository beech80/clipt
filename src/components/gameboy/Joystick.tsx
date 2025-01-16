import React, { useState, useRef, useEffect } from 'react';

interface JoystickProps {
  onDirectionChange: (direction: string) => void;
}

const Joystick = ({ onDirectionChange }: JoystickProps) => {
  const [activeDirection, setActiveDirection] = useState<string>('neutral');
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const joystickRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastActionTimeRef = useRef(0);
  const scrollSpeedRef = useRef(0);
  const scrollIntervalRef = useRef<number | null>(null);

  const handleScroll = (direction: 'up' | 'down') => {
    const speed = 15; // Adjust this value to control scroll speed
    const container = document.querySelector('.post-container');
    if (container) {
      const scrollAmount = direction === 'up' ? -speed : speed;
      container.scrollTop += scrollAmount;
    }
  };

  const startScrolling = (direction: 'up' | 'down') => {
    if (scrollIntervalRef.current) return;
    
    scrollIntervalRef.current = window.setInterval(() => {
      handleScroll(direction);
    }, 16) as unknown as number; // ~60fps
  };

  const stopScrolling = () => {
    if (scrollIntervalRef.current) {
      window.clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  const handleDirectionClick = (direction: string) => {
    setActiveDirection(direction);
    onDirectionChange(direction);
    
    const maxDistance = 20;
    switch (direction) {
      case 'up':
        setJoystickPosition({ x: 0, y: -maxDistance });
        startScrolling('up');
        break;
      case 'down':
        setJoystickPosition({ x: 0, y: maxDistance });
        startScrolling('down');
        break;
      default:
        setJoystickPosition({ x: 0, y: 0 });
        stopScrolling();
        break;
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

    const now = Date.now();
    if (now - lastActionTimeRef.current > 100) { // Reduced threshold for smoother scrolling
      if (Math.abs(newY) > maxDistance * 0.5) {
        const direction = newY > 0 ? 'down' : 'up';
        startScrolling(direction);
      } else {
        stopScrolling();
      }
      lastActionTimeRef.current = now;
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
    stopScrolling();
  };

  useEffect(() => {
    return () => {
      stopScrolling();
      document.removeEventListener('mousemove', handleJoystickMove as any);
      document.removeEventListener('touchmove', handleJoystickMove as any);
      document.removeEventListener('mouseup', handleJoystickEnd);
      document.removeEventListener('touchend', handleJoystickEnd);
    };
  }, []);

  return (
    <div 
      ref={joystickRef}
      className="xbox-joystick cursor-grab active:cursor-grabbing"
      onMouseDown={handleJoystickStart}
      onTouchStart={handleJoystickStart}
    >
      <div 
        className="xbox-joystick-thumb"
        style={{ 
          transform: `translate(${joystickPosition.x}px, ${joystickPosition.y}px)`,
        }}
      />
      
      <button 
        onClick={() => handleDirectionClick('up')}
        className="xbox-joystick-direction top-0 left-1/2 -translate-x-1/2 -translate-y-1"
      />
      <button 
        onClick={() => handleDirectionClick('down')}
        className="xbox-joystick-direction bottom-0 left-1/2 -translate-x-1/2 translate-y-1"
      />
    </div>
  );
};

export default Joystick;