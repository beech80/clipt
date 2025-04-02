import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import usePostDetector from './gameboy/PostDetector';
import { triggerPostInteraction } from './gameboy/PostInteractions';
import { dispatchVideoControl } from './gameboy/VideoControls';
import ActionButtons from './gameboy/ActionButtons';

const GameBoyControls: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(true);
  const activePost = usePostDetector(enabled);
  
  // Toggle visibility of the controls panel
  const [isVisible, setIsVisible] = useState(true);
  
  // Toggle the active state of the CLIPT button
  const [isCliptActive, setIsCliptActive] = useState(false);
  
  useEffect(() => {
    // Check if we should disable the controls on certain routes
    const disabledRoutes = ['/auth', '/onboarding', '/messages'];
    const shouldDisable = disabledRoutes.some(route => location.pathname.startsWith(route));
    setEnabled(!shouldDisable);
  }, [location]);
  
  // Handle navigation using D-pad
  const handleDPadPress = (dx: number, dy: number) => {
    if (!enabled) return;
    
    if (dy < 0) {
      // Up: Scroll up
      window.scrollBy({ top: -200, behavior: 'smooth' });
    } else if (dy > 0) {
      // Down: Scroll down
      window.scrollBy({ top: 200, behavior: 'smooth' });
    } else if (dx < 0) {
      // Left: Previous page or handle video scrubbing
      const activeVideo = document.querySelector('video:focus') as HTMLVideoElement;
      if (activeVideo) {
        dispatchVideoControl('backward');
      } else {
        navigate(-1);
      }
    } else if (dx > 0) {
      // Right: Next page or handle video scrubbing
      const activeVideo = document.querySelector('video:focus') as HTMLVideoElement;
      if (activeVideo) {
        dispatchVideoControl('forward');
      } else if (location.pathname === '/') {
        navigate('/explore');
      }
    }
  };
  
  // Toggle CLIPT button state and navigate to post creation
  const handleCliptPress = () => {
    setIsCliptActive(true);
    
    // Navigate to create post page
    navigate('/create');
    
    // Reset button state after a delay
    setTimeout(() => {
      setIsCliptActive(false);
    }, 300);
  };
  
  // Only render if enabled
  if (!enabled) return null;
  
  return (
    <div className="gameboy-controls-container">
      <div className="gameboy-controls">
        {/* D-Pad / Joystick for navigation */}
        <div className="d-pad">
          <div className="d-pad-button up" onClick={(e) => {e.stopPropagation(); handleDPadPress(0, -1);}}>
            <span>↑</span>
          </div>
          <div className="d-pad-button right" onClick={(e) => {e.stopPropagation(); handleDPadPress(1, 0);}}>
            <span>→</span>
          </div>
          <div className="d-pad-button down" onClick={(e) => {e.stopPropagation(); handleDPadPress(0, 1);}}>
            <span>↓</span>
          </div>
          <div className="d-pad-button left" onClick={(e) => {e.stopPropagation(); handleDPadPress(-1, 0);}}>
            <span>←</span>
          </div>
          <div className="d-pad-center"></div>
        </div>
        
        {/* CLIPT Button (Center) */}
        <button 
          className={`clipt-button ${isCliptActive ? 'active' : ''}`} 
          onClick={handleCliptPress}
          aria-label="Create new post"
        >
          CLIPT
        </button>
        
        {/* Action Buttons */}
        <ActionButtons activePostId={activePost?.id || null} />
      </div>
    </div>
  );
};

export default GameBoyControls;
