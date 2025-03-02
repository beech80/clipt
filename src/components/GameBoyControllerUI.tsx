import React from 'react';
import { Heart, MessageSquare, UserPlus, Trophy, Camera } from 'lucide-react';
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';

interface GameBoyControllerUIProps {
  pageId?: string;
}

const GameBoyControllerUI = ({ pageId }: GameBoyControllerUIProps) => {
  const navigate = useNavigate();
  
  // Handle joystick actions
  const handleJoystickAction = (direction: string) => {
    toast.info(`Joystick moved: ${direction}`);
    // Navigate based on direction
    switch(direction) {
      case 'up':
        navigate('/');
        break;
      case 'down':
        navigate('/profile');
        break;
      case 'left':
        navigate('/discover');
        break;
      case 'right':
        navigate('/streaming');
        break;
      default:
        break;
    }
  };

  // Handle action button presses
  const handleAction = (action: string) => {
    switch(action) {
      case 'like':
        toast.success("Liked!");
        break;
      case 'comment':
        toast.success("Commenting...");
        break;
      case 'follow':
        toast.success("Following!");
        break;
      case 'trophy':
        toast.success("Ranked!");
        break;
      case 'post':
        toast.success("Creating post!");
        break;
      case 'menu':
        toast.info("Menu opened");
        break;
      default:
        break;
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="relative w-full h-full">
        {/* Left joystick */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-auto">
          <div className="w-24 h-24 bg-black rounded-full border-4 border-gray-700 flex items-center justify-center shadow-lg">
            <div 
              className="w-16 h-16 bg-gray-800 rounded-full cursor-pointer flex items-center justify-center hover:bg-gray-700 transition-all shadow-inner"
              onClick={() => handleJoystickAction('center')}
            ></div>
          </div>
        </div>

        {/* Center CLIPT logo */}
        <div className="absolute left-1/2 top-1/4 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-blue-400 animate-pulse opacity-60"></div>
              <Camera className="w-8 h-8 text-white z-10" />
            </div>
            <div className="text-white font-bold mt-1">CLIPT</div>
          </div>
        </div>

        {/* Menu button */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <button 
            className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700"
            onClick={() => handleAction('menu')}
          >
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="w-6 h-0.5 bg-white"></div>
              <div className="w-6 h-0.5 bg-white"></div>
              <div className="w-6 h-0.5 bg-white"></div>
            </div>
          </button>
        </div>

        {/* Right action buttons in diamond formation */}
        <div className="absolute right-4 top-1/4 transform -translate-y-1/2 grid grid-cols-3 gap-2 pointer-events-auto">
          {/* Top button (heart/like) */}
          <div className="col-start-2">
            <button 
              className="w-12 h-12 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center"
              onClick={() => handleAction('like')}
            >
              <Heart className="w-6 h-6 text-white" />
            </button>
          </div>
          
          {/* Left button (comment) */}
          <div className="col-start-1 row-start-2">
            <button 
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center"
              onClick={() => handleAction('comment')}
            >
              <MessageSquare className="w-6 h-6 text-white" />
            </button>
          </div>
          
          {/* Right button (follow) */}
          <div className="col-start-3 row-start-2">
            <button 
              className="w-12 h-12 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center"
              onClick={() => handleAction('follow')}
            >
              <UserPlus className="w-6 h-6 text-white" />
            </button>
          </div>
          
          {/* Bottom button (trophy) */}
          <div className="col-start-2 row-start-3">
            <button 
              className="w-12 h-12 bg-yellow-600 hover:bg-yellow-700 rounded-full flex items-center justify-center"
              onClick={() => handleAction('trophy')}
            >
              <Trophy className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Post button below diamond */}
        <div className="absolute right-4 top-2/3 transform -translate-y-1/2 flex justify-center pointer-events-auto">
          <button 
            className="w-14 h-14 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center text-white text-xs font-bold"
            onClick={() => handleAction('post')}
          >
            POST
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameBoyControllerUI;
