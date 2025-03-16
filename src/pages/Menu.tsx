
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
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Menu = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const menuItems = [
    { 
      title: 'Settings', 
      description: 'Configure your game',
      icon: <Settings className="h-6 w-6 text-purple-400" />, 
      path: '/settings' 
    },
    { 
      title: 'Streaming', 
      description: 'Live gameplay',
      icon: <Video className="h-6 w-6 text-purple-400" />, 
      path: '/streaming' 
    },
    { 
      title: 'Profile', 
      description: 'Your player stats',
      icon: <User className="h-6 w-6 text-purple-400" />, 
      path: '/profile' 
    },
    { 
      title: 'Messages', 
      description: 'Chat with players',
      icon: <MessageSquare className="h-6 w-6 text-purple-400" />, 
      path: '/messages' 
    },
    { 
      title: 'Discovery', 
      description: 'Find new games',
      icon: <Search className="h-6 w-6 text-purple-400" />, 
      path: '/discovery' 
    },
    { 
      title: 'Top Clipts', 
      description: 'Hall of fame',
      icon: <Award className="h-6 w-6 text-purple-400" />, 
      path: '/top-clipts' 
    },
    { 
      title: 'Clipts', 
      description: 'View all clipts',
      icon: <MonitorPlay className="h-6 w-6 text-purple-400" />, 
      path: '/clipts' 
    }
  ];

  return (
    <div className="min-h-screen bg-[#1e1a2e] flex flex-col">
      {/* Header */}
      <div className="py-6 text-center border-b border-gray-700">
        <h1 className="text-2xl font-bold text-white tracking-wider">GAME MENU</h1>
      </div>

      {/* Menu Grid */}
      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item) => (
            <div 
              key={item.title}
              onClick={() => navigate(item.path)}
              className="cursor-pointer border border-gray-700 rounded-lg relative group"
            >
              {/* Pseudo-elements for the corner dots */}
              <div className="absolute w-2 h-2 bg-gray-600 rounded-full top-2 left-2"></div>
              <div className="absolute w-2 h-2 bg-gray-600 rounded-full top-2 right-2"></div>
              <div className="absolute w-2 h-2 bg-gray-600 rounded-full bottom-2 left-2"></div>
              <div className="absolute w-2 h-2 bg-gray-600 rounded-full bottom-2 right-2"></div>
              
              <div className="p-6 flex items-center">
                <div className="bg-[#252040] p-3 rounded-lg">
                  {item.icon}
                </div>
                
                <div className="ml-4 flex-1">
                  <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </div>
                
                <ChevronRight className="text-purple-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom border */}
      <div className="border-t border-gray-700 h-10"></div>
    </div>
  );
};

export default Menu;
