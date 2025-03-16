
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Video, 
  User, 
  MessageSquare, 
  Search, 
  Award,
  MonitorPlay,
  Gamepad
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Menu = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const menuItems = [
    { 
      title: 'Settings', 
      icon: <Settings className="h-6 w-6 text-purple-400" />, 
      path: '/settings' 
    },
    { 
      title: 'Streaming', 
      icon: <Video className="h-6 w-6 text-purple-400" />, 
      path: '/streaming' 
    },
    { 
      title: 'Profile', 
      icon: <User className="h-6 w-6 text-purple-400" />, 
      path: '/profile' 
    },
    { 
      title: 'Messages', 
      icon: <MessageSquare className="h-6 w-6 text-purple-400" />, 
      path: '/messages' 
    },
    { 
      title: 'Discovery', 
      icon: <Search className="h-6 w-6 text-purple-400" />, 
      path: '/discovery' 
    },
    { 
      title: 'Top Clipts', 
      icon: <Award className="h-6 w-6 text-purple-400" />, 
      path: '/top-clipts' 
    },
    { 
      title: 'Clipts', 
      icon: <MonitorPlay className="h-6 w-6 text-purple-400" />, 
      path: '/clipts' 
    }
  ];

  return (
    <div className="min-h-screen bg-[#131420] flex flex-col p-4">
      {/* Header */}
      <div className="py-8 text-center mb-6">
        <h1 className="text-3xl font-bold text-purple-400 tracking-widest relative inline-block">
          MENU
          <div className="w-full h-1 bg-gradient-to-r from-purple-700 to-purple-400 mt-2 rounded-full"></div>
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-purple-700 to-purple-400 rounded-full opacity-30"></div>
        </h1>
      </div>

      {/* Menu Grid */}
      <div className="flex-1 px-4 max-w-md mx-auto w-full">
        <div className="grid grid-cols-1 gap-4">
          {menuItems.map((item) => (
            <div 
              key={item.title}
              onClick={() => navigate(item.path)}
              className="
                bg-[#1e1a2e] border border-purple-900/30 rounded-lg p-4
                hover:bg-[#252040] cursor-pointer transition-all duration-300
                shadow-lg hover:shadow-purple-900/40
                transform hover:-translate-y-1 hover:scale-[1.02]
                flex items-center space-x-4
              "
            >
              <div className="bg-[#252040] p-3 rounded-lg transition-colors relative">
                {item.icon}
                <div className="absolute inset-0 bg-purple-500/10 rounded-lg animate-pulse opacity-0 group-hover:opacity-100"></div>
              </div>
              
              <span className="text-white font-medium text-lg">
                {item.title}
              </span>
              
              <div className="ml-auto">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="#9b87f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Graphic */}
      <div className="py-10 flex justify-center">
        <div className="relative w-48 opacity-30">
          <Gamepad size={48} className="text-purple-400 mx-auto" />
          <div className="h-1 w-24 bg-gradient-to-r from-purple-700 to-purple-400 mx-auto mt-4 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default Menu;
