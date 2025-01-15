import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface JoystickProps {
  onDirectionChange: (direction: string) => void;
}

const Joystick = ({ onDirectionChange }: JoystickProps) => {
  const [activeDirection, setActiveDirection] = useState<string>('neutral');
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const joystickRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastActionTimeRef = useRef(0);

  const handleDirectionClick = (direction: string) => {
    setActiveDirection(direction);
    onDirectionChange(direction);
    
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
        break;
    }

    setTimeout(() => {
      setActiveDirection('neutral');
      setJoystickPosition({ x: 0, y: 0 });
    }, 300);
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
    if (now - lastActionTimeRef.current > 300) {
      const threshold = maxDistance * 0.5;
      let direction = 'neutral';
      
      if (Math.abs(newX) > Math.abs(newY)) {
        direction = newX > threshold ? 'right' : newX < -threshold ? 'left' : 'neutral';
      } else {
        direction = newY > threshold ? 'down' : newY < -threshold ? 'up' : 'neutral';
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
  };

  useEffect(() => {
    return () => {
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
        onClick={() => handleDirectionClick('right')}
        className="xbox-joystick-direction right-0 top-1/2 -translate-y-1/2 translate-x-1"
      />
      <button 
        onClick={() => handleDirectionClick('down')}
        className="xbox-joystick-direction bottom-0 left-1/2 -translate-x-1/2 translate-y-1"
      />
      <button 
        onClick={() => handleDirectionClick('left')}
        className="xbox-joystick-direction left-0 top-1/2 -translate-y-1/2 -translate-x-1"
      />
    </div>
  );
};

export default Joystick;