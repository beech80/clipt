import React, { useEffect } from 'react';
import { NavigateFunction } from 'react-router-dom';

interface JoystickProps {
  navigate: NavigateFunction;
}

export default function Joystick({ navigate }: JoystickProps) {
  // Handle joystick navigation
  const handleNavigation = (direction: string) => {
    switch (direction) {
      case 'up':
        // Scroll up
        window.scrollBy({
          top: -300,
          behavior: 'smooth'
        });
        break;
      case 'right':
        navigate('/discover');
        break;
      case 'down':
        // Scroll down
        window.scrollBy({
          top: 300,
          behavior: 'smooth'
        });
        break;
      case 'left':
        navigate('/profile');
        break;
      default:
        break;
    }
  };

  // Add keyboard controls for joystick
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          handleNavigation('up');
          break;
        case 'ArrowRight':
          handleNavigation('right');
          break;
        case 'ArrowDown':
          handleNavigation('down');
          break;
        case 'ArrowLeft':
          handleNavigation('left');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Base of the joystick - concave circular area */}
      <div 
        className="absolute inset-0 rounded-full bg-[#1e2029]"
        style={{
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.7)',
          border: '1px solid #2d3047'
        }}
      ></div>
      
      {/* Joystick analog stick */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30px] h-[30px] rounded-full bg-[#272935]"
        style={{ 
          boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
          border: '1px solid #333642',
        }}
      >
        {/* Textured top of stick */}
        <div className="absolute inset-0 rounded-full" style={{
          background: 'radial-gradient(circle at center, #2a2c3a 0%, #232531 100%)',
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1)'
        }}></div>
      </div>
      
      {/* Invisible hotspots for navigation */}
      <button
        onClick={() => handleNavigation('up')}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[45px] h-[20px] cursor-pointer opacity-0"
        aria-label="Navigate up"
      ></button>
      <button
        onClick={() => handleNavigation('right')}
        className="absolute top-1/2 right-0 -translate-y-1/2 w-[20px] h-[45px] cursor-pointer opacity-0"
        aria-label="Navigate right"
      ></button>
      <button
        onClick={() => handleNavigation('down')}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[45px] h-[20px] cursor-pointer opacity-0"
        aria-label="Navigate down"
      ></button>
      <button
        onClick={() => handleNavigation('left')}
        className="absolute top-1/2 left-0 -translate-y-1/2 w-[20px] h-[45px] cursor-pointer opacity-0"
        aria-label="Navigate left"
      ></button>
    </div>
  );
}