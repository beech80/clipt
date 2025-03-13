import React, { useEffect, useRef, useState } from 'react';

/**
 * AnimatedJoystick Component
 * An enhanced joystick control with improved visual feedback for up/down movement
 */
const AnimatedJoystick: React.FC = () => {
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  
  // Add animation styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse-subtle {
        0% { opacity: 0.3; }
        50% { opacity: 0.8; }
        100% { opacity: 0.3; }
      }
      
      .joystick-up-indicator {
        background: rgba(135, 106, 245, 0.8) !important;
        height: 8px !important;
        animation: pulse-subtle 1.5s infinite !important;
      }
      
      .joystick-down-indicator {
        background: rgba(135, 106, 245, 0.8) !important;
        height: 8px !important;
        animation: pulse-subtle 1.5s infinite !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Function to update joystick position and apply visual effects
  const updateJoystickPosition = (dx: number, dy: number) => {
    if (!baseRef.current) return;
    
    // Limit joystick movement to a circle
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = baseRef.current.getBoundingClientRect().width / 2.5;
    
    if (distance > maxDistance) {
      dx = (dx / distance) * maxDistance;
      dy = (dy / distance) * maxDistance;
    }
    
    // Update joystick position
    setJoystickPosition({ x: dx, y: dy });
    
    // Apply visual indicators based on direction
    const upIndicator = document.querySelector('.up-indicator');
    const downIndicator = document.querySelector('.down-indicator');
    
    if (upIndicator && downIndicator) {
      if (dy < -5) {
        upIndicator.classList.add('joystick-up-indicator');
        downIndicator.classList.remove('joystick-down-indicator');
      } else if (dy > 5) {
        downIndicator.classList.add('joystick-down-indicator');
        upIndicator.classList.remove('joystick-up-indicator');
      } else {
        upIndicator.classList.remove('joystick-up-indicator');
        downIndicator.classList.remove('joystick-down-indicator');
      }
    }
    
    // Handle scrolling based on joystick position
    handleScrollFromJoystick(dy);
  };
  
  const handleScrollFromJoystick = (yPosition: number) => {
    // Enhanced scrolling with non-linear scaling for better feel
    if (yPosition < -5) {
      // Scroll up - negative yPosition means joystick moved up
      const scrollSpeed = Math.abs(yPosition) * (1 + Math.abs(yPosition) / 30);
      window.scrollBy({
        top: -scrollSpeed,
        behavior: 'auto'
      });
    } else if (yPosition > 5) {
      // Scroll down - positive yPosition means joystick moved down
      const scrollSpeed = Math.abs(yPosition) * (1 + Math.abs(yPosition) / 30);
      window.scrollBy({
        top: scrollSpeed,
        behavior: 'auto'
      });
    }
  };
  
  // Mouse event handlers
  const handleJoystickMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    if (baseRef.current) {
      const rect = baseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      updateJoystickPosition(e.clientX - centerX, e.clientY - centerY);
    }
    
    window.addEventListener('mousemove', handleJoystickMouseMove);
    window.addEventListener('mouseup', handleJoystickMouseUp);
  };
  
  const handleJoystickMouseMove = (e: MouseEvent) => {
    if (!isDragging || !baseRef.current) return;
    
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    updateJoystickPosition(e.clientX - centerX, e.clientY - centerY);
  };
  
  const handleJoystickMouseUp = () => {
    setIsDragging(false);
    setJoystickPosition({ x: 0, y: 0 });
    
    // Remove visual indicators
    const upIndicator = document.querySelector('.up-indicator');
    const downIndicator = document.querySelector('.down-indicator');
    
    if (upIndicator && downIndicator) {
      upIndicator.classList.remove('joystick-up-indicator');
      downIndicator.classList.remove('joystick-down-indicator');
    }
    
    window.removeEventListener('mousemove', handleJoystickMouseMove);
    window.removeEventListener('mouseup', handleJoystickMouseUp);
  };
  
  // Touch event handlers
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    if (baseRef.current && e.touches[0]) {
      const rect = baseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      updateJoystickPosition(
        e.touches[0].clientX - centerX,
        e.touches[0].clientY - centerY
      );
    }
    
    window.addEventListener('touchmove', handleJoystickTouchMove, { passive: false });
    window.addEventListener('touchend', handleJoystickTouchEnd);
  };
  
  const handleJoystickTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (!isDragging || !baseRef.current || !e.touches[0]) return;
    
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    updateJoystickPosition(
      e.touches[0].clientX - centerX,
      e.touches[0].clientY - centerY
    );
  };
  
  const handleJoystickTouchEnd = () => {
    setIsDragging(false);
    setJoystickPosition({ x: 0, y: 0 });
    
    // Remove visual indicators
    const upIndicator = document.querySelector('.up-indicator');
    const downIndicator = document.querySelector('.down-indicator');
    
    if (upIndicator && downIndicator) {
      upIndicator.classList.remove('joystick-up-indicator');
      downIndicator.classList.remove('joystick-down-indicator');
    }
    
    window.removeEventListener('touchmove', handleJoystickTouchMove);
    window.removeEventListener('touchend', handleJoystickTouchEnd);
  };
  
  // Continuous scrolling
  useEffect(() => {
    if (isDragging && joystickPosition.y !== 0) {
      const scrollInterval = setInterval(() => {
        handleScrollFromJoystick(joystickPosition.y);
      }, 16); // ~60fps
      
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
      {/* Base ring */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          border: '1px solid rgba(135, 106, 245, 0.5)',
          opacity: isDragging ? 0.6 : 0.2
        }}
      />
      
      {/* Up indicator arrow */}
      <div 
        className="up-indicator absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-3 rounded-t-full pointer-events-none"
        style={{
          background: 'rgba(135, 106, 245, 0.3)',
          transition: 'background 0.2s ease, height 0.2s ease'
        }}
      />
      
      {/* Down indicator arrow */}
      <div 
        className="down-indicator absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1 h-3 rounded-b-full pointer-events-none"
        style={{
          background: 'rgba(135, 106, 245, 0.3)',
          transition: 'background 0.2s ease, height 0.2s ease'
        }}
      />
      
      {/* Joystick knob with direction-based styling */}
      <div 
        ref={joystickRef}
        className="w-8 h-8 rounded-full absolute transition-all duration-75 ease-out"
        style={{ 
          transform: `translate(${joystickPosition.x}px, ${joystickPosition.y}px)`,
          background: '#333340',
          boxShadow: isDragging 
            ? joystickPosition.y < -5 
              ? '0 -4px 12px rgba(135, 106, 245, 0.7)' 
              : joystickPosition.y > 5 
                ? '0 4px 12px rgba(135, 106, 245, 0.7)'
                : '0 0 10px rgba(135, 106, 245, 0.6)'
            : 'none',
          borderTop: joystickPosition.y > 5 ? '2px solid rgba(135, 106, 245, 0.7)' : 'none',
          borderBottom: joystickPosition.y < -5 ? '2px solid rgba(135, 106, 245, 0.7)' : 'none',
        }}
      />
    </div>
  );
};

export default AnimatedJoystick;
