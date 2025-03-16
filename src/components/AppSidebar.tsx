
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

interface AppSidebarProps {
  isVisible?: boolean;
}

const AppSidebar = ({ isVisible = false }: AppSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { 
      title: 'Settings', 
      icon: <Settings className="h-5 w-5" />, 
      path: '/settings',
      color: 'text-white'
    },
    { 
      title: 'Streaming', 
      icon: <Video className="h-5 w-5" />, 
      path: '/streaming',
      color: 'text-white'
    },
    { 
      title: 'Profile', 
      icon: <User className="h-5 w-5" />, 
      path: '/profile',
      color: 'text-white'
    },
    { 
      title: 'Messages', 
      icon: <MessageSquare className="h-5 w-5" />, 
      path: '/messages',
      color: 'text-yellow-300'
    },
    { 
      title: 'Discovery', 
      icon: <Search className="h-5 w-5" />, 
      path: '/discovery',
      color: 'text-orange-300'
    },
    { 
      title: 'Top Clips', 
      icon: <Award className="h-5 w-5" />, 
      path: '/top-clipts',
      color: 'text-blue-300'
    },
    { 
      title: 'Clips', 
      icon: <MonitorPlay className="h-5 w-5" />, 
      path: '/clipts',
      color: 'text-red-300'
    }
  ];

  return (
    <div 
      id="app-sidebar"
      className={`fixed left-0 top-0 bottom-0 w-64 bg-[#121212] border-r border-[#1A1A1A] z-50 transform transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="px-2 py-4">
        <div className="mb-6 px-3">
          <h2 className="text-xl font-bold text-purple-400 flex items-center">
            Menu
            <div className="h-px flex-grow bg-gradient-to-r from-purple-500/50 to-transparent ml-3"></div>
          </h2>
        </div>
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.title}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-left transition-all ${
                    isActive 
                      ? 'bg-[#1A1A1A] shadow-[0_0_10px_rgba(139,92,246,0.1)]' 
                      : 'hover:bg-[#1A1A1A] hover:shadow-[0_0_10px_rgba(139,92,246,0.05)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`${isActive ? "text-purple-400" : "text-white"}`}>
                      {item.icon}
                    </span>
                    <span className={`${isActive ? "text-purple-400" : item.color} font-medium`}>{item.title}</span>
                  </div>
                  <ChevronRight className={`h-4 w-4 opacity-0 transform transition-all ${
                    isActive ? "opacity-100 text-purple-400" : "group-hover:opacity-50 text-gray-400"
                  }`} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default AppSidebar;
