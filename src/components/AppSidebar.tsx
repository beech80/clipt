
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Settings, 
  Video, 
  User, 
  MessageSquare, 
  Search, 
  Award,
  MonitorPlay
} from 'lucide-react';

interface AppSidebarProps {
  isVisible?: boolean;
}

const AppSidebar = ({ isVisible = false }: AppSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { 
      title: 'Settings', 
      icon: <Settings className="h-6 w-6 text-purple-400" />, 
      path: '/settings',
      description: 'Configure your game'
    },
    { 
      title: 'Streaming', 
      icon: <Video className="h-6 w-6 text-purple-400" />, 
      path: '/streaming',
      description: 'Live gameplay'
    },
    { 
      title: 'Profile', 
      icon: <User className="h-6 w-6 text-purple-400" />, 
      path: '/profile',
      description: 'Your player stats'
    },
    { 
      title: 'Messages', 
      icon: <MessageSquare className="h-6 w-6 text-purple-400" />, 
      path: '/messages',
      description: 'Chat with players'
    },
    { 
      title: 'Discovery', 
      icon: <Search className="h-6 w-6 text-purple-400" />, 
      path: '/discovery',
      description: 'Find new games'
    },
    { 
      title: 'Top Clips', 
      icon: <Award className="h-6 w-6 text-purple-400" />, 
      path: '/top-clipts',
      description: 'Hall of fame'
    },
    { 
      title: 'Clips', 
      icon: <MonitorPlay className="h-6 w-6 text-purple-400" />, 
      path: '/clipts',
      description: 'View all clips'
    }
  ];

  return (
    <div 
      id="app-sidebar"
      className={`fixed left-0 top-0 bottom-0 w-full h-full bg-[#0f0b23]/95 backdrop-blur-md z-50 transition-all duration-300 ease-in-out overflow-auto ${
        isVisible ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}
    >
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6 border-b border-gray-700 pb-4">
          <h2 className="text-2xl font-bold text-center text-white uppercase tracking-wide">
            Game Menu
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <div 
                key={item.title}
                className="relative border border-gray-800 bg-gray-900/50 rounded-lg p-4 backdrop-blur-sm transition-all hover:bg-gray-800/70 hover:shadow-lg overflow-hidden"
              >
                <button
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-start text-left"
                >
                  <div className="flex-shrink-0 p-3 bg-gray-800 rounded-md">
                    {item.icon}
                  </div>
                  
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <p className="text-sm text-gray-400">{item.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <div className="text-purple-400 rotate-90 transform">▶</div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AppSidebar;
