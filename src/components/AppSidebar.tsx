
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

const AppSidebar = () => {
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
    <div className="fixed left-0 top-0 bottom-0 w-64 bg-[#121212] border-r border-[#1A1A1A]">
      <div className="px-2 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.title}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors ${
                    isActive ? 'bg-[#1A1A1A]' : 'hover:bg-[#1A1A1A]'
                  }`}
                >
                  <span className="text-white">{item.icon}</span>
                  <span className={`${item.color} font-medium`}>{item.title}</span>
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
