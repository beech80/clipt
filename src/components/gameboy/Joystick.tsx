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
    <div className="relative w-[70px] h-[70px] select-none">
      {/* Outer circle - dark with subtle border */}
      <div className="absolute inset-0 bg-black rounded-full border border-gray-800 shadow-lg"></div>
      
      {/* Second circle */}
      <div className="absolute inset-[5px] bg-[#131419] rounded-full border border-gray-800"></div>
      
      {/* Inner circle */}
      <div className="absolute inset-[20px] bg-[#0C0D11] rounded-full border border-gray-800"></div>
      
      {/* Center nub */}
      <div className="absolute inset-[28px] bg-[#0A0A0C] rounded-full"></div>
      
      {/* Directional buttons - positioned over the joystick */}
      
      {/* Up button */}
      <button
        onClick={() => navigateToRoute('/')}
        aria-label="Navigate Up"
        className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-4 text-gray-400 hover:text-white 
                  flex items-center justify-center focus:outline-none active:scale-95"
      >
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="transform rotate-0"
        >
          <path d="M12 4L4 12H9V20H15V12H20L12 4Z" fill="currentColor" />
        </svg>
      </button>
      
      {/* Right button */}
      <button
        onClick={() => navigateToRoute('/discover')}
        aria-label="Navigate Right"
        className="absolute top-1/2 right-2 -translate-y-1/2 w-4 h-6 text-gray-400 hover:text-white 
                  flex items-center justify-center focus:outline-none active:scale-95"
      >
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="transform rotate-90"
        >
          <path d="M12 4L4 12H9V20H15V12H20L12 4Z" fill="currentColor" />
        </svg>
      </button>
      
      {/* Down button */}
      <button
        onClick={() => navigateToRoute('/collections')}
        aria-label="Navigate Down"
        className="absolute bottom-2 left-1/2 -translate-x-1/2 w-6 h-4 text-gray-400 hover:text-white 
                  flex items-center justify-center focus:outline-none active:scale-95"
      >
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="transform rotate-180"
        >
          <path d="M12 4L4 12H9V20H15V12H20L12 4Z" fill="currentColor" />
        </svg>
      </button>
      
      {/* Left button */}
      <button
        onClick={() => navigateToRoute('/clipts')}
        aria-label="Navigate Left"
        className="absolute top-1/2 left-2 -translate-y-1/2 w-4 h-6 text-gray-400 hover:text-white 
                  flex items-center justify-center focus:outline-none active:scale-95"
      >
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="transform -rotate-90"
        >
          <path d="M12 4L4 12H9V20H15V12H20L12 4Z" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
};

export default Joystick;