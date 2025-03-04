import React from 'react';
import { NavigateFunction } from 'react-router-dom';

interface JoystickProps {
  navigate: NavigateFunction;
}

const Joystick: React.FC<JoystickProps> = ({ navigate }) => {
  return (
    <div className="relative">
      {/* Base circle */}
      <div className="w-[80px] h-[80px] rounded-full bg-[#151924] flex items-center justify-center border border-gray-800 shadow-lg">
        {/* Center joystick */}
        <div className="w-[50px] h-[50px] rounded-full bg-black flex items-center justify-center cursor-pointer relative shadow-inner border border-gray-800" 
          style={{
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Directional indicators - hidden but used for click targets */}
          <div className="absolute inset-0 grid grid-rows-3 grid-cols-3">
            {/* Up */}
            <div className="col-start-2 row-start-1 flex justify-center items-start"
              onClick={() => navigate('/')}
            >
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-gray-700 opacity-60 hover:opacity-100 mt-1"></div>
            </div>
            
            {/* Left */}
            <div className="col-start-1 row-start-2 flex justify-start items-center pl-1"
              onClick={() => navigate('/clipts')}
            >
              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[10px] border-r-gray-700 opacity-60 hover:opacity-100"></div>
            </div>
            
            {/* Center dot */}
            <div className="col-start-2 row-start-2 flex justify-center items-center">
              <div className="w-[4px] h-[4px] rounded-full bg-gray-700"></div>
            </div>
            
            {/* Right */}
            <div className="col-start-3 row-start-2 flex justify-end items-center pr-1"
              onClick={() => navigate('/discover')}
            >
              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-gray-700 opacity-60 hover:opacity-100"></div>
            </div>
            
            {/* Down */}
            <div className="col-start-2 row-start-3 flex justify-center items-end mb-1"
              onClick={() => navigate('/collections')}
            >
              <div className="w-0 h-0 border-t-[10px] border-t-gray-700 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent opacity-60 hover:opacity-100"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Joystick;