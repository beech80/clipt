// This is a helper file to implement the improved joystick functionality
// Import this file in GameBoyControls.tsx

import { RefObject, useEffect } from 'react';

export type JoystickPosition = {
  x: number;
  y: number;
};

export type JoystickRefs = {
  baseRef: RefObject<HTMLDivElement>;
  joystickRef: RefObject<HTMLDivElement>;
};

export function setupJoystickListeners(
  refs: JoystickRefs,
  isDragging: boolean,
  setIsDragging: (isDragging: boolean) => void,
  joystickPosition: JoystickPosition,
  setJoystickPosition: (position: JoystickPosition) => void
) {
  // Add continuous scrolling if joystick is held
  useEffect(() => {
    if (isDragging && joystickPosition.y !== 0) {
      const intervalId = setInterval(() => {
        // Use a non-linear scale for more intuitive control
        const absY = Math.abs(joystickPosition.y);
        const speedFactor = absY > 15 ? 2.0 : 1.2; // Higher speed factor for better response
        const scrollSpeed = absY * speedFactor;
        
        if (joystickPosition.y < -5) {
          // Scroll up - negative y means joystick moved up
          window.scrollBy({
            top: -scrollSpeed,
            behavior: 'auto'
          });
        } else if (joystickPosition.y > 5) {
          // Scroll down - positive y means joystick moved down
          window.scrollBy({
            top: scrollSpeed,
            behavior: 'auto'
          });
        }
      }, 16); // ~60fps for smooth scrolling
      
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [isDragging, joystickPosition]);
  
  return {
    handleMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      if (!refs.baseRef.current) return;
      
      setIsDragging(true);
      
      const rect = refs.baseRef.current.getBoundingClientRect();
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
      
      // Initial scroll
      if (limitedY < -5) {
        window.scrollBy({
          top: -Math.abs(limitedY) * 1.8,
          behavior: 'auto'
        });
      } else if (limitedY > 5) {
        window.scrollBy({
          top: Math.abs(limitedY) * 1.8,
          behavior: 'auto'
        });
      }
      
      const handleMouseMove = (ev: MouseEvent) => {
        ev.preventDefault();
        if (!refs.baseRef.current) return;
        
        const rect = refs.baseRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width/2;
        const centerY = rect.top + rect.height/2;
        
        const dx = ev.clientX - centerX;
        const dy = ev.clientY - centerY;
        
        // Limit distance
        const distance = Math.sqrt(dx*dx + dy*dy);
        const maxDist = rect.width/2.5;
        
        let limitedX = dx;
        let limitedY = dy;
        
        if (distance > maxDist) {
          limitedX = (dx/distance) * maxDist;
          limitedY = (dy/distance) * maxDist;
        }
        
        setJoystickPosition({ x: limitedX, y: limitedY });
        
        // Scroll based on joystick position
        if (limitedY < -5) {
          window.scrollBy({
            top: -Math.abs(limitedY) * 1.8,
            behavior: 'auto'
          });
        } else if (limitedY > 5) {
          window.scrollBy({
            top: Math.abs(limitedY) * 1.8,
            behavior: 'auto'
          });
        }
      };
      
      const handleMouseUp = () => {
        setIsDragging(false);
        setJoystickPosition({ x: 0, y: 0 });
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
      
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    
    handleTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      if (!refs.baseRef.current) return;
      
      setIsDragging(true);
      
      const rect = refs.baseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width/2;
      const centerY = rect.top + rect.height/2;
      
      const touch = e.touches[0];
      const dx = touch.clientX - centerX;
      const dy = touch.clientY - centerY;
      
      // Limit distance
      const distance = Math.sqrt(dx*dx + dy*dy);
      const maxDist = rect.width/2.5;
      
      let limitedX = dx;
      let limitedY = dy;
      
      if (distance > maxDist) {
        limitedX = (dx/distance) * maxDist;
        limitedY = (dy/distance) * maxDist;
      }
      
      setJoystickPosition({ x: limitedX, y: limitedY });
      
      // Initial scroll
      if (limitedY < -5) {
        window.scrollBy({
          top: -Math.abs(limitedY) * 1.8,
          behavior: 'auto'
        });
      } else if (limitedY > 5) {
        window.scrollBy({
          top: Math.abs(limitedY) * 1.8,
          behavior: 'auto'
        });
      }
      
      const handleTouchMove = (ev: TouchEvent) => {
        ev.preventDefault();
        if (!refs.baseRef.current) return;
        
        const rect = refs.baseRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width/2;
        const centerY = rect.top + rect.height/2;
        
        const touch = ev.touches[0];
        const dx = touch.clientX - centerX;
        const dy = touch.clientY - centerY;
        
        // Limit distance
        const distance = Math.sqrt(dx*dx + dy*dy);
        const maxDist = rect.width/2.5;
        
        let limitedX = dx;
        let limitedY = dy;
        
        if (distance > maxDist) {
          limitedX = (dx/distance) * maxDist;
          limitedY = (dy/distance) * maxDist;
        }
        
        setJoystickPosition({ x: limitedX, y: limitedY });
        
        // Scroll based on joystick position
        if (limitedY < -5) {
          window.scrollBy({
            top: -Math.abs(limitedY) * 1.8,
            behavior: 'auto'
          });
        } else if (limitedY > 5) {
          window.scrollBy({
            top: Math.abs(limitedY) * 1.8,
            behavior: 'auto'
          });
        }
      };
      
      const handleTouchEnd = () => {
        setIsDragging(false);
        setJoystickPosition({ x: 0, y: 0 });
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
      
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }
  };
}
