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
      {/* Main outer circle */}
      <div className="w-full h-full rounded-full bg-[#1D1E25] shadow-md"></div>
      
      {/* Inner circle shadow */}
      <div className="absolute inset-[10px] rounded-full bg-[#191A21]"></div>
      
      {/* Center circle */}
      <div className="absolute inset-[20px] rounded-full bg-[#16171D]"></div>
      
      {/* Navigation hot zones - invisible but functional */}
      <button 
        onClick={() => navigateToRoute('/')} 
        className="absolute top-0 left-0 w-full h-[33%] opacity-0"
        aria-label="Navigate Up"
      ></button>
      
      <button 
        onClick={() => navigateToRoute('/discover')} 
        className="absolute top-0 right-0 h-full w-[33%] opacity-0"
        aria-label="Navigate Right"
      ></button>
      
      <button 
        onClick={() => navigateToRoute('/collections')} 
        className="absolute bottom-0 left-0 w-full h-[33%] opacity-0"
        aria-label="Navigate Down"
      ></button>
      
      <button 
        onClick={() => navigateToRoute('/clipts')} 
        className="absolute top-0 left-0 h-full w-[33%] opacity-0"
        aria-label="Navigate Left"
      ></button>
    </div>
  );
};

export default Joystick;