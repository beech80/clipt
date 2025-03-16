
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
  onClose?: () => void;
}

const AppSidebar = ({ isVisible = false, onClose }: AppSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { 
      title: 'Settings', 
      icon: <Settings className="h-5 w-5" stroke="#8be9fd" />, 
      path: '/settings',
    },
    { 
      title: 'Streaming', 
      icon: <Video className="h-5 w-5" stroke="#ff79c6" />, 
      path: '/streaming',
    },
    { 
      title: 'Profile', 
      icon: <User className="h-5 w-5" stroke="#50fa7b" />, 
      path: '/profile',
    },
    { 
      title: 'Messages', 
      icon: <MessageSquare className="h-5 w-5" stroke="#f1fa8c" />, 
      path: '/messages',
    },
    { 
      title: 'Discovery', 
      icon: <Search className="h-5 w-5" stroke="#bd93f9" />, 
      path: '/discovery',
    },
    { 
      title: 'Top Clipts', 
      icon: <Award className="h-5 w-5" stroke="#ff5555" />, 
      path: '/top-clipts',
    },
    { 
      title: 'Clipts', 
      icon: <MonitorPlay className="h-5 w-5" stroke="#8be9fd" />, 
      path: '/clipts',
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    if (onClose) {
      onClose();
    }
  };

  return (
    <div 
      id="app-sidebar"
      className={`fixed left-0 top-0 bottom-0 w-full h-full bg-[#0f0b23]/95 backdrop-blur-md z-50 transition-all duration-300 ease-in-out overflow-auto ${
        isVisible ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="px-4 py-6 flex-1">
          <div className="flex flex-col space-y-3">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.title}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-gray-800/80' 
                      : 'hover:bg-gray-800/40'
                  }`}
                >
                  <div className="mr-3">
                    {item.icon}
                  </div>
                  <span className={`text-sm font-medium ${
                    isActive ? 'text-white' : 'text-gray-300'
                  }`}>
                    {item.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppSidebar;
