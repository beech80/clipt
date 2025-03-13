import React, { useEffect, useRef, useState } from 'react';

// A standalone joystick component with enhanced animations for up/down movement
const EnhancedJoystick: React.FC = () => {
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  
  // Add animation styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse-arrow {
        0% { opacity: 0.4; transform: scaleY(1); }
        50% { opacity: 0.9; transform: scaleY(1.2); }
        100% { opacity: 0.4; transform: scaleY(1); }
      }
      
      @keyframes glow-up {
        0% { box-shadow: 0 -3px 8px rgba(135, 106, 245, 0.4); }
        50% { box-shadow: 0 -6px 15px rgba(135, 106, 245, 0.7); }
        100% { box-shadow: 0 -3px 8px rgba(135, 106, 245, 0.4); }
      }
      
      @keyframes glow-down {
        0% { box-shadow: 0 3px 8px rgba(135, 106, 245, 0.4); }
        50% { box-shadow: 0 6px 15px rgba(135, 106, 245, 0.7); }
        100% { box-shadow: 0 3px 8px rgba(135, 106, 245, 0.4); }
      }
      
      .joystick-up-indicator.active {
        background: rgba(135, 106, 245, 0.8) !important;
        height: 8px !important;
        animation: pulse-arrow 1.5s infinite !important;
      }
      
      .joystick-down-indicator.active {
        background: rgba(135, 106, 245, 0.8) !important;
        height: 8px !important;
        animation: pulse-arrow 1.5s infinite !important;
      }
      
      .joystick-handle-up {
        animation: glow-up 1.5s infinite ease-in-out !important;
        border-bottom: 2px solid rgba(135, 106, 245, 0.7) !important;
      }
      
      .joystick-handle-down {
        animation: glow-down 1.5s infinite ease-in-out !important;
        border-top: 2px solid rgba(135, 106, 245, 0.7) !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Update direction indicators for better visual feedback
  const updateDirectionIndicators = (yPosition: number) => {
    const joystickHandle = joystickRef.current;
    const upIndicator = document.querySelector('.joystick-up-indicator');
    const downIndicator = document.querySelector('.joystick-down-indicator');
    
    if (joystickHandle && upIndicator && downIndicator) {
      if (yPosition < -5) {
        // Moving up
        upIndicator.classList.add('active');
        downIndicator.classList.remove('active');
        joystickHandle.classList.add('joystick-handle-up');
        joystickHandle.classList.remove('joystick-handle-down');
      } else if (yPosition > 5) {
        // Moving down
        downIndicator.classList.add('active');
        upIndicator.classList.remove('active');
        joystickHandle.classList.add('joystick-handle-down');
        joystickHandle.classList.remove('joystick-handle-up');
      } else {
        // Neutral
        upIndicator.classList.remove('active');
        downIndicator.classList.remove('active');
        joystickHandle.classList.remove('joystick-handle-up', 'joystick-handle-down');
      }
    }
  };
  
  // Handle scrolling based on joystick position
  const handleScrollFromJoystick = (yPosition: number) => {
    // Enhanced scrolling with non-linear scaling for better feel
    if (yPosition < -5) {
      // Scroll up - use non-linear scaling for more intuitive control
      const scrollSpeed = Math.abs(yPosition) * (1 + Math.abs(yPosition) / 40);
      window.scrollBy({
        top: -scrollSpeed,
        behavior: 'auto'
      });
    } else if (yPosition > 5) {
      // Scroll down - use non-linear scaling for more intuitive control
      const scrollSpeed = Math.abs(yPosition) * (1 + Math.abs(yPosition) / 40);
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
    
    if (!baseRef.current) return;
    
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width/2;
    const centerY = rect.top + rect.height/2;
    
    // Calculate initial position
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    
    // Limit to circle
    const distance = Math.sqrt(dx*dx + dy*dy);
    const maxDist = rect.width/2.5;
    
    let limitedX = dx;
    let limitedY = dy;
    
    if (distance > maxDist) {
      limitedX = (dx/distance) * maxDist;
      limitedY = (dy/distance) * maxDist;
    }
    
    setJoystickPosition({ x: limitedX, y: limitedY });
    updateDirectionIndicators(limitedY);
    handleScrollFromJoystick(limitedY);
    
    // Add event listeners to window for mouse movement and release
    window.addEventListener('mousemove', handleJoystickMouseMove);
    window.addEventListener('mouseup', handleJoystickMouseUp);
  };
  
  const handleJoystickMouseMove = (e: MouseEvent) => {
    if (!isDragging || !baseRef.current) return;
    
    // Get joystick base position and dimensions
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate relative position
    let dx = e.clientX - centerX;
    let dy = e.clientY - centerY;
    
    // Limit joystick movement to a circle
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = rect.width / 2.5; // Increased for better control
    
    if (distance > maxDistance) {
      dx = (dx / distance) * maxDistance;
      dy = (dy / distance) * maxDistance;
    }
    
    // Update joystick position
    setJoystickPosition({ x: dx, y: dy });
    updateDirectionIndicators(dy);
    handleScrollFromJoystick(dy);
  };
  
  const handleJoystickMouseUp = () => {
    setIsDragging(false);
    
    // Return joystick to center with animation
    setJoystickPosition({ x: 0, y: 0 });
    
    // Reset indicators
    if (joystickRef.current) {
      joystickRef.current.classList.remove('joystick-handle-up', 'joystick-handle-down');
    }
    
    const upIndicator = document.querySelector('.joystick-up-indicator');
    const downIndicator = document.querySelector('.joystick-down-indicator');
    
    if (upIndicator) upIndicator.classList.remove('active');
    if (downIndicator) downIndicator.classList.remove('active');
    
    // Remove event listeners
    window.removeEventListener('mousemove', handleJoystickMouseMove);
    window.removeEventListener('mouseup', handleJoystickMouseUp);
  };
  
  // Touch event handlers
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    if (!baseRef.current || !e.touches[0]) return;
    
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width/2;
    const centerY = rect.top + rect.height/2;
    
    // Calculate initial position
    const touch = e.touches[0];
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    
    // Limit to circle
    const distance = Math.sqrt(dx*dx + dy*dy);
    const maxDist = rect.width/2.5;
    
    let limitedX = dx;
    let limitedY = dy;
    
    if (distance > maxDist) {
      limitedX = (dx/distance) * maxDist;
      limitedY = (dy/distance) * maxDist;
    }
    
    setJoystickPosition({ x: limitedX, y: limitedY });
    updateDirectionIndicators(limitedY);
    handleScrollFromJoystick(limitedY);
    
    // Add event listeners to window for touch movement and release
    window.addEventListener('touchmove', handleJoystickTouchMove, { passive: false });
    window.addEventListener('touchend', handleJoystickTouchEnd);
  };
  
  const handleJoystickTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (!isDragging || !baseRef.current || !e.touches[0]) return;
    
    // Get joystick base position and dimensions
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate relative position
    const touch = e.touches[0];
    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;
    
    // Limit joystick movement to a circle
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = rect.width / 2.5;
    
    if (distance > maxDistance) {
      dx = (dx / distance) * maxDistance;
      dy = (dy / distance) * maxDistance;
    }
    
    // Update joystick position
    setJoystickPosition({ x: dx, y: dy });
    updateDirectionIndicators(dy);
    handleScrollFromJoystick(dy);
  };
  
  const handleJoystickTouchEnd = () => {
    setIsDragging(false);
    
    // Return joystick to center with animation
    setJoystickPosition({ x: 0, y: 0 });
    
    // Reset indicators
    if (joystickRef.current) {
      joystickRef.current.classList.remove('joystick-handle-up', 'joystick-handle-down');
    }
    
    const upIndicator = document.querySelector('.joystick-up-indicator');
    const downIndicator = document.querySelector('.joystick-down-indicator');
    
    if (upIndicator) upIndicator.classList.remove('active');
    if (downIndicator) downIndicator.classList.remove('active');
    
    // Remove event listeners
    window.removeEventListener('touchmove', handleJoystickTouchMove);
    window.removeEventListener('touchend', handleJoystickTouchEnd);
  };
  
  // Continuous scrolling if joystick is held
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
      {/* Joystick base indicator */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          border: '1px solid rgba(135, 106, 245, 0.5)',
          opacity: isDragging ? 0.6 : 0.2
        }}
      />
      
      {/* Up indicator arrow */}
      <div 
        className="joystick-up-indicator absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-4 rounded-t-full pointer-events-none"
        style={{
          background: 'rgba(135, 106, 245, 0.3)',
          transition: 'background 0.2s ease, height 0.2s ease'
        }}
      />
      
      {/* Down indicator arrow */}
      <div 
        className="joystick-down-indicator absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-2 h-4 rounded-b-full pointer-events-none"
        style={{
          background: 'rgba(135, 106, 245, 0.3)',
          transition: 'background 0.2s ease, height 0.2s ease'
        }}
      />
      
      {/* Joystick handle with enhanced animation */}
      <div 
        ref={joystickRef}
        className="w-8 h-8 bg-[#333340] rounded-full absolute transition-all duration-75 ease-out"
        style={{ 
          transform: `translate(${joystickPosition.x}px, ${joystickPosition.y}px)`,
          boxShadow: isDragging ? '0 0 8px rgba(135, 106, 245, 0.4)' : 'none'
        }}
      />
    </div>
  );
};

export default EnhancedJoystick;
