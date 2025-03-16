
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
    <div className="min-h-screen bg-[#131420] flex flex-col">
      {/* Header */}
      <div className="py-6 text-center">
        <h1 className="text-2xl font-bold text-purple-400 tracking-wider">MENU</h1>
        <div className="w-24 h-1 bg-gradient-to-r from-purple-700 to-purple-400 mx-auto mt-2 rounded-full"></div>
      </div>

      {/* Menu List */}
      <div className="flex-1 px-6 py-4 max-w-md mx-auto w-full">
        <div className="bg-[#1e1a2e] border border-purple-900/30 rounded-2xl p-3 shadow-lg shadow-purple-900/20">
          {menuItems.map((item, index) => (
            <div 
              key={item.title}
              onClick={() => navigate(item.path)}
              className={`
                flex items-center space-x-4 p-4 cursor-pointer transition-all
                hover:bg-[#252040] rounded-xl group
                ${index !== menuItems.length - 1 ? 'border-b border-purple-900/20' : ''}
              `}
            >
              <div className="bg-[#252040] group-hover:bg-[#38336a] p-3 rounded-lg transition-colors">
                {item.icon}
              </div>
              <span className="text-white font-medium group-hover:text-purple-400 transition-colors">
                {item.title}
              </span>
              
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="#9b87f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Game controller decoration at bottom */}
      <div className="py-10 flex justify-center">
        <div className="relative w-32 h-12 opacity-10">
          <div className="absolute left-0 top-0 w-12 h-12 rounded-full border-2 border-purple-400"></div>
          <div className="absolute right-0 top-0 w-12 h-12 rounded-full border-2 border-purple-400"></div>
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-4 bg-purple-400 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default Menu;
