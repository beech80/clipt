
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
    <div className="min-h-screen bg-[#111111] flex flex-col">
      {/* Sidebar-style Menu */}
      <div className="w-full max-w-xs mx-auto mt-8 px-4 py-6 bg-[#191919] rounded-lg">
        <ul className="space-y-4">
          {menuItems.map((item) => (
            <li key={item.title}>
              <button
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-4 px-4 py-2.5 rounded-md transition-colors hover:bg-[#252525]"
              >
                <span className="text-white">{item.icon}</span>
                <span className={`${item.color} font-medium`}>{item.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Menu;
