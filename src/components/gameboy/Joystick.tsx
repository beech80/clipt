import React, { useState, useRef, useEffect } from 'react';

interface JoystickProps {
  onDirectionChange: (direction: string) => void;
}

const Joystick: React.FC<JoystickProps> = ({ onDirectionChange }) => {
  const [activeDirection, setActiveDirection] = useState('neutral');
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const maxDistance = 30;
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

  const handleDirectionClick = (direction: string) => {
    setActiveDirection(direction);
    onDirectionChange(direction);
    handleScroll(direction);
    
    const maxDistance = 20;
    switch (direction) {
      case 'up':
        setJoystickPosition({ x: 0, y: -maxDistance });
        break;
      case 'down':
        setJoystickPosition({ x: 0, y: maxDistance });
        break;
      case 'left':
        setJoystickPosition({ x: -maxDistance, y: 0 });
        break;
      case 'right':
        setJoystickPosition({ x: maxDistance, y: 0 });
        break;
      default:
        setJoystickPosition({ x: 0, y: 0 });
    }

    setTimeout(() => {
      setActiveDirection('neutral');
      setJoystickPosition({ x: 0, y: 0 });
    }, 300);
  };

  const startScrolling = (direction: string) => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }
    
    scrollIntervalRef.current = window.setInterval(() => {
      handleScroll(direction);
    }, 800); // Match this with the scroll delay
  };

  const stopScrolling = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = undefined;
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
    if (now - lastActionTimeRef.current > 100) {
      const threshold = maxDistance * 0.5;
      let direction = 'neutral';
      
      if (Math.abs(newY) > Math.abs(newX)) {
        direction = newY > threshold ? 'down' : newY < -threshold ? 'up' : 'neutral';
        if (direction !== 'neutral') {
          startScrolling(direction);
        } else {
          stopScrolling();
        }
      }
      
      if (direction !== 'neutral' && direction !== activeDirection) {
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
    <div className="xbox-joystick">
      <div
        ref={joystickRef}
        className="xbox-joystick-thumb"
        style={{
          transform: `translate(${joystickPosition.x}px, ${joystickPosition.y}px)`,
        }}
        onMouseDown={handleJoystickStart}
        onTouchStart={handleJoystickStart}
      />
      <div className="xbox-joystick-direction absolute top-0 -translate-y-1/2" onClick={() => handleDirectionClick('up')} />
      <div className="xbox-joystick-direction absolute right-0 translate-x-1/2" onClick={() => handleDirectionClick('right')} />
      <div className="xbox-joystick-direction absolute bottom-0 translate-y-1/2" onClick={() => handleDirectionClick('down')} />
      <div className="xbox-joystick-direction absolute left-0 -translate-x-1/2" onClick={() => handleDirectionClick('left')} />
    </div>
  );
};

export default Joystick;
