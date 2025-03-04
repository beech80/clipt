import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Joystick() {
  const navigate = useNavigate();
  const [activeDirection, setActiveDirection] = useState<string | null>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Function to scroll the window smoothly
  const scrollWindow = (direction: 'up' | 'down', amount: number) => {
    if (direction === 'up') {
      window.scrollBy({
        top: -amount,
        behavior: 'smooth'
      });
    } else {
      window.scrollBy({
        top: amount,
        behavior: 'smooth'
      });
    }
  };
  
  // Handle joystick movement with animation
  const handleJoystickMove = (direction: string) => {
    setActiveDirection(direction);
    
    if (direction === 'up' || direction === 'down') {
      // Cancel any existing scrolling animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Start scrolling animation
      const scrollAmount = 300; // pixels
      scrollWindow(direction as 'up' | 'down', scrollAmount);
      
      // Animate the joystick
      if (joystickRef.current) {
        joystickRef.current.style.transition = 'transform 0.2s ease-out';
        
        if (direction === 'up') {
          joystickRef.current.style.transform = 'translateY(-5px)';
        } else if (direction === 'down') {
          joystickRef.current.style.transform = 'translateY(5px)';
        } else if (direction === 'left') {
          joystickRef.current.style.transform = 'translateX(-5px)';
        } else if (direction === 'right') {
          joystickRef.current.style.transform = 'translateX(5px)';
        }
      }
    } else if (direction === 'left') {
      navigate('/profile');
    } else if (direction === 'right') {
      navigate('/discover');
    }
  };
  
  // Reset joystick position
  const resetJoystick = () => {
    setActiveDirection(null);
    
    if (joystickRef.current) {
      joystickRef.current.style.transition = 'transform 0.2s ease-out';
      joystickRef.current.style.transform = 'translate(0, 0)';
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Base circle */}
      <div className="absolute inset-0 rounded-full bg-[#272A37] border border-[#3f4255]"></div>
      
      {/* Joystick button */}
      <div 
        ref={joystickRef}
        className="absolute w-[40px] h-[40px] left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#323644] border border-[#3f4255] shadow-inner"
      >
        {/* Direction buttons */}
        <button 
          className={`absolute w-[20px] h-[20px] left-1/2 -top-[10px] transform -translate-x-1/2 text-gray-400 focus:outline-none ${activeDirection === 'up' ? 'text-white' : ''}`}
          onClick={() => handleJoystickMove('up')} 
          onTouchStart={() => handleJoystickMove('up')}
          onMouseDown={() => handleJoystickMove('up')}
          onMouseUp={resetJoystick}
          onMouseLeave={resetJoystick}
          onTouchEnd={resetJoystick}
          aria-label="Scroll up"
        >
          ▲
        </button>
        
        <button 
          className={`absolute w-[20px] h-[20px] left-1/2 -bottom-[10px] transform -translate-x-1/2 text-gray-400 focus:outline-none ${activeDirection === 'down' ? 'text-white' : ''}`}
          onClick={() => handleJoystickMove('down')}
          onTouchStart={() => handleJoystickMove('down')}
          onMouseDown={() => handleJoystickMove('down')}
          onMouseUp={resetJoystick}
          onMouseLeave={resetJoystick}
          onTouchEnd={resetJoystick}
          aria-label="Scroll down"
        >
          ▼
        </button>
        
        <button 
          className={`absolute h-[20px] w-[20px] -left-[10px] top-1/2 transform -translate-y-1/2 text-gray-400 focus:outline-none ${activeDirection === 'left' ? 'text-white' : ''}`}
          onClick={() => handleJoystickMove('left')}
          onTouchStart={() => handleJoystickMove('left')}
          onMouseDown={() => handleJoystickMove('left')}
          onMouseUp={resetJoystick}
          onMouseLeave={resetJoystick}
          onTouchEnd={resetJoystick}
          aria-label="Navigate to profile"
        >
          ◀
        </button>
        
        <button 
          className={`absolute h-[20px] w-[20px] -right-[10px] top-1/2 transform -translate-y-1/2 text-gray-400 focus:outline-none ${activeDirection === 'right' ? 'text-white' : ''}`}
          onClick={() => handleJoystickMove('right')}
          onTouchStart={() => handleJoystickMove('right')}
          onMouseDown={() => handleJoystickMove('right')}
          onMouseUp={resetJoystick}
          onMouseLeave={resetJoystick}
          onTouchEnd={resetJoystick}
          aria-label="Navigate to discover"
        >
          ▶
        </button>
      </div>
    </div>
  );
}