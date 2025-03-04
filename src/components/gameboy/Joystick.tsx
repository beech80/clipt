import React from 'react';
import { NavigateFunction } from 'react-router-dom';

interface JoystickProps {
  navigate: NavigateFunction;
}

const Joystick: React.FC<JoystickProps> = ({ navigate }) => {
  const navigateToRoute = (route: string) => {
    navigate(route);
  };

  return (
    <div className="relative w-[68px] h-[68px] select-none">
      {/* Main joystick circle */}
      <div className="absolute inset-0 bg-[#1A1B26] rounded-full shadow-lg">
        {/* Inner shadow ring */}
        <div className="absolute inset-[6px] rounded-full bg-[#171821]"></div>
        
        {/* Center darker circle */}
        <div className="absolute inset-[16px] rounded-full bg-[#12131A]"></div>
      </div>
      
      {/* Directional navigation */}
      <button onClick={() => navigateToRoute('/')} 
              className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 w-10 h-8"
              aria-label="Navigate Up">
      </button>
      
      <button onClick={() => navigateToRoute('/discover')} 
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 w-8 h-10"
              aria-label="Navigate Right">
      </button>
      
      <button onClick={() => navigateToRoute('/collections')} 
              className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 w-10 h-8"
              aria-label="Navigate Down">
      </button>
      
      <button onClick={() => navigateToRoute('/clipts')} 
              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 w-8 h-10"
              aria-label="Navigate Left">
      </button>
    </div>
  );
};

export default Joystick;