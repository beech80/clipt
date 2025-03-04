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
    <div className="relative w-[60px] h-[60px]">
      {/* Outer circle with subtle shadow */}
      <div className="absolute inset-0 rounded-full bg-[#1B1C27] shadow-[0_1px_3px_rgba(0,0,0,0.5)]"></div>
      
      {/* First inner circle */}
      <div className="absolute inset-[5px] rounded-full bg-[#191A24]"></div>
      
      {/* Second inner circle */}
      <div className="absolute inset-[12px] rounded-full bg-[#161722]"></div>
      
      {/* Center circle */}
      <div className="absolute inset-[18px] rounded-full bg-[#11121A]"></div>
      
      {/* Invisible directional buttons */}
      <button 
        onClick={() => navigateToRoute('/')} 
        className="absolute top-0 left-0 w-full h-1/4 opacity-0" 
        aria-label="Navigate Up"
      ></button>
      
      <button 
        onClick={() => navigateToRoute('/discover')} 
        className="absolute top-0 right-0 w-1/4 h-full opacity-0" 
        aria-label="Navigate Right"
      ></button>
      
      <button 
        onClick={() => navigateToRoute('/collections')} 
        className="absolute bottom-0 left-0 w-full h-1/4 opacity-0" 
        aria-label="Navigate Down"
      ></button>
      
      <button 
        onClick={() => navigateToRoute('/clipts')} 
        className="absolute top-0 left-0 w-1/4 h-full opacity-0" 
        aria-label="Navigate Left"
      ></button>
    </div>
  );
};

export default Joystick;