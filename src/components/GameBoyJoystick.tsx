import { useEffect, useRef, useState } from 'react';

interface JoystickProps {
  onPositionChange?: (x: number, y: number) => void;
}

const GameBoyJoystick: React.FC<JoystickProps> = ({ onPositionChange }) => {
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  
  // Joystick movement handlers
  const handleJoystickMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    // Calculate initial position
    if (baseRef.current) {
      const baseRect = baseRef.current.getBoundingClientRect();
      const baseCenterX = baseRect.left + baseRect.width / 2;
      const baseCenterY = baseRect.top + baseRect.height / 2;
      
      // Set initial position
      const dx = e.clientX - baseCenterX;
      const dy = e.clientY - baseCenterY;
      updateJoystickPosition(dx, dy);
    }
    
    // Add event listeners to window for mouse movement and release
    window.addEventListener('mousemove', handleJoystickMouseMove);
    window.addEventListener('mouseup', handleJoystickMouseUp);
  };
  
  const handleJoystickMouseMove = (e: MouseEvent) => {
    if (!isDragging || !joystickRef.current || !baseRef.current) return;
    
    // Get joystick base position and dimensions
    const baseRect = baseRef.current.getBoundingClientRect();
    const baseCenterX = baseRect.left + baseRect.width / 2;
    const baseCenterY = baseRect.top + baseRect.height / 2;
    
    // Calculate relative position
    let dx = e.clientX - baseCenterX;
    let dy = e.clientY - baseCenterY;
    
    updateJoystickPosition(dx, dy);
  };
  
  const handleJoystickMouseUp = () => {
    setIsDragging(false);
    
    // Return joystick to center with animation
    updateJoystickPosition(0, 0);
    
    // Remove event listeners
    window.removeEventListener('mousemove', handleJoystickMouseMove);
    window.removeEventListener('mouseup', handleJoystickMouseUp);
  };
  
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    // Calculate initial position for touch
    if (baseRef.current && e.touches[0]) {
      const baseRect = baseRef.current.getBoundingClientRect();
      const baseCenterX = baseRect.left + baseRect.width / 2;
      const baseCenterY = baseRect.top + baseRect.height / 2;
      
      // Set initial position
      const dx = e.touches[0].clientX - baseCenterX;
      const dy = e.touches[0].clientY - baseCenterY;
      updateJoystickPosition(dx, dy);
    }
    
    // Add event listeners to window for touch movement and release
    window.addEventListener('touchmove', handleJoystickTouchMove, { passive: false });
    window.addEventListener('touchend', handleJoystickTouchEnd);
  };
  
  const handleJoystickTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (!isDragging || !joystickRef.current || !baseRef.current || !e.touches[0]) return;
    
    // Get joystick base position and dimensions
    const baseRect = baseRef.current.getBoundingClientRect();
    const baseCenterX = baseRect.left + baseRect.width / 2;
    const baseCenterY = baseRect.top + baseRect.height / 2;
    
    // Calculate relative position
    let dx = e.touches[0].clientX - baseCenterX;
    let dy = e.touches[0].clientY - baseCenterY;
    
    updateJoystickPosition(dx, dy);
  };
  
  const handleJoystickTouchEnd = () => {
    setIsDragging(false);
    
    // Return joystick to center with animation
    updateJoystickPosition(0, 0);
    
    // Remove event listeners
    window.removeEventListener('touchmove', handleJoystickTouchMove);
    window.removeEventListener('touchend', handleJoystickTouchEnd);
  };
  
  const updateJoystickPosition = (dx: number, dy: number) => {
    if (!baseRef.current) return;
    
    // Limit joystick movement to a circle
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = baseRef.current.getBoundingClientRect().width / 2.5; // Increased max distance
    
    if (distance > maxDistance) {
      dx = (dx / distance) * maxDistance;
      dy = (dy / distance) * maxDistance;
    }
    
    // Update joystick position
    setJoystickPosition({ x: dx, y: dy });
    
    // Notify parent component of position change
    if (onPositionChange) {
      onPositionChange(dx, dy);
    }
    
    // Handle scrolling directly
    handleScrollFromJoystick(dy);
  };
  
  const handleScrollFromJoystick = (yPosition: number) => {
    // Determine scroll direction and speed based on y position
    // Use a non-linear scale for more intuitive control
    const absPosition = Math.abs(yPosition);
    const speedFactor = absPosition > 15 ? 2.0 : 1.2; // Increased speed factor for better response
    const scrollSpeed = absPosition * speedFactor;
    
    if (yPosition < -5) {
      // Scroll up - negative yPosition means joystick moved up
      window.scrollBy({
        top: -scrollSpeed,
        behavior: 'auto'
      });
    } else if (yPosition > 5) {
      // Scroll down - positive yPosition means joystick moved down
      window.scrollBy({
        top: scrollSpeed,
        behavior: 'auto'
      });
    }
  };
  
  // Add continuous scrolling if joystick is held
  useEffect(() => {
    if (isDragging && joystickPosition.y !== 0) {
      const scrollInterval = setInterval(() => {
        handleScrollFromJoystick(joystickPosition.y);
      }, 16); // ~60fps for smooth scrolling
      
      return () => {
        clearInterval(scrollInterval);
      };
    }
  }, [isDragging, joystickPosition]);
  
  return (
    <div 
      ref={baseRef}
      className="w-14 h-14 bg-[#1D1D26] rounded-full flex items-center justify-center cursor-move relative overflow-visible"
      onMouseDown={handleJoystickMouseDown}
      onTouchStart={handleJoystickTouchStart}
    >
      {/* Create a joystick appearance */}
      <div 
        ref={joystickRef}
        className="w-8 h-8 bg-[#333340] rounded-full absolute transition-all duration-75 ease-out"
        style={{ 
          transform: `translate(${joystickPosition.x}px, ${joystickPosition.y}px)`,
          boxShadow: isDragging ? '0 0 10px rgba(135, 106, 245, 0.6)' : 'none'
        }}
      />
      <div 
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          border: '1px solid rgba(135, 106, 245, 0.5)',
          opacity: isDragging ? 0.6 : 0.2
        }}
      />
    </div>
  );
};

export default GameBoyJoystick;
