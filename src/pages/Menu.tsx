
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Video, 
  User, 
  MessageSquare, 
  Search, 
  Award,
  MonitorPlay
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Menu = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const menuItems = [
    { 
      title: 'Settings', 
      icon: <Settings className="h-6 w-6 text-purple-400" />, 
      description: 'Configure your game',
      path: '/settings' 
    },
    { 
      title: 'Streaming', 
      icon: <Video className="h-6 w-6 text-purple-400" />, 
      description: 'Live gameplay',
      path: '/streaming' 
    },
    { 
      title: 'Profile', 
      icon: <User className="h-6 w-6 text-purple-400" />, 
      description: 'Your player stats',
      path: '/profile' 
    },
    { 
      title: 'Messages', 
      icon: <MessageSquare className="h-6 w-6 text-purple-400" />, 
      description: 'Chat with players',
      path: '/messages' 
    },
    { 
      title: 'Discovery', 
      icon: <Search className="h-6 w-6 text-purple-400" />, 
      description: 'Find new games',
      path: '/discovery' 
    },
    { 
      title: 'Top Clips', 
      icon: <Award className="h-6 w-6 text-purple-400" />, 
      description: 'Hall of fame',
      path: '/top-clipts' 
    },
    { 
      title: 'Clips', 
      icon: <MonitorPlay className="h-6 w-6 text-purple-400" />, 
      description: 'View all clips',
      path: '/clipts' 
    }
  ];

  return (
    <div className="min-h-screen bg-[#0D0B14] flex flex-col">
      {/* Menu Header */}
      <div className="relative py-5 mb-6 mt-2 text-center border-b border-dashed border-gray-700">
        <h1 className="text-3xl font-bold text-white tracking-wider">
          GAME MENU
        </h1>
      </div>

      {/* Menu Grid */}
      <div className="flex-1 px-4 py-3 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <div 
              key={item.title}
              onClick={() => navigate(item.path)}
              className="
                group relative
                bg-[#181626] border border-[#2c2b3a] rounded-md
                hover:border-[#3d3b4f] transition-all duration-300
                cursor-pointer
                overflow-hidden
              "
            >
              {/* Menu item border dots (corners) */}
              <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-gray-500 rounded-full opacity-40"></div>
              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-gray-500 rounded-full opacity-40"></div>
              <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-gray-500 rounded-full opacity-40"></div>
              <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-gray-500 rounded-full opacity-40"></div>
              
              <div className="p-4 flex items-start">
                {/* Icon container */}
                <div className="p-3 rounded bg-[#1e1c2c] mr-4">
                  {item.icon}
                </div>
                
                {/* Text content */}
                <div className="flex-1">
                  <h3 className="text-white text-lg font-medium mb-1">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {item.description}
                  </p>
                </div>
                
                {/* Arrow indicator */}
                <div className="text-purple-400 ml-2 flex items-center">
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 16 16" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="transform group-hover:translate-x-1 transition-transform duration-300"
                  >
                    <path 
                      d="M6 12L10 8L6 4" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom border */}
      <div className="border-t border-dashed border-gray-700 py-6 mt-4">
      </div>
    </div>
  );
};

export default Menu;
