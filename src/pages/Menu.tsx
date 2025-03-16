
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
  Gamepad,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Menu = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const menuItems = [
    { 
      title: 'Settings', 
      icon: <Settings className="h-5 w-5" />, 
      path: '/settings' 
    },
    { 
      title: 'Streaming', 
      icon: <Video className="h-5 w-5" />, 
      path: '/streaming' 
    },
    { 
      title: 'Profile', 
      icon: <User className="h-5 w-5" />, 
      path: '/profile' 
    },
    { 
      title: 'Messages', 
      icon: <MessageSquare className="h-5 w-5" />, 
      path: '/messages' 
    },
    { 
      title: 'Discovery', 
      icon: <Search className="h-5 w-5" />, 
      path: '/discovery' 
    },
    { 
      title: 'Top Clips', 
      icon: <Award className="h-5 w-5" />, 
      path: '/top-clipts' 
    },
    { 
      title: 'Clips', 
      icon: <MonitorPlay className="h-5 w-5" />, 
      path: '/clipts' 
    }
  ];

  return (
    <div className="min-h-screen bg-[#0D0B14] flex flex-col">
      {/* Glowing Header */}
      <div className="relative py-5 text-center mb-4">
        <h1 className="text-3xl font-bold text-white tracking-wider relative inline-block">
          MENU
          <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 via-[#9b87f5] to-purple-600 rounded-full"></div>
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-purple-500/50 rounded-full"></div>
        </h1>
      </div>

      {/* Menu list with modern styling */}
      <div className="flex-1 px-3 py-3 space-y-2.5 max-w-md mx-auto w-full">
        {menuItems.map((item) => (
          <div 
            key={item.title}
            onClick={() => navigate(item.path)}
            className="
              group relative overflow-hidden
              bg-[#1A1525] border border-[#2A2535]/50 rounded-md p-3
              hover:bg-[#25243b] transition-all duration-300
              shadow-lg hover:shadow-purple-900/20
              flex items-center space-x-4
              cursor-pointer
            "
          >
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/5 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Icon container with glow */}
            <div className="relative z-10 bg-[#252040] p-2.5 rounded-md flex items-center justify-center">
              <div className="text-[#9b87f5]">
                {item.icon}
              </div>
              <div className="absolute inset-0 bg-purple-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            {/* Title with hover effect */}
            <span className="relative z-10 text-white font-medium text-base group-hover:text-[#9b87f5] transition-colors duration-300">
              {item.title}
            </span>
            
            {/* Arrow indicator */}
            <div className="ml-auto relative z-10">
              <ChevronRight className="h-5 w-5 text-[#9b87f5] transform transition-transform duration-300 group-hover:translate-x-0.5" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom design element */}
      <div className="py-8 flex justify-center">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#252040] rounded-full opacity-10 animate-pulse"></div>
          <Gamepad size={28} className="text-[#9b87f5] animate-float" />
        </div>
      </div>

      {/* Add a CSS animation for the floating effect */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Menu;
