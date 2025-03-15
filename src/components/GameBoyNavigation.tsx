
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Trophy, User } from 'lucide-react';

const GameBoyNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { name: 'Home', path: '/', icon: <Home size={20} /> },
    { name: 'Discover', path: '/discover', icon: <Search size={20} /> },
    { name: 'Top Clips', path: '/topclips', icon: <Trophy size={20} /> },
    { name: 'Profile', path: '/profile', icon: <User size={20} /> }
  ];

  return (
    <div className="gameboy-navigation fixed top-0 left-0 right-0 bg-[#0a0d20]/90 backdrop-blur-md border-b border-[#2c2d4a] z-40">
      <div className="max-w-screen-md mx-auto">
        <div className="flex justify-between items-center">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
                            (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <button
                key={item.path}
                className={`flex-1 py-3 flex flex-col items-center justify-center focus:outline-none transition-all duration-200 ${
                  isActive 
                    ? 'text-purple-400' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                onClick={() => navigate(item.path)}
              >
                <div className={`mb-1 transform transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>{item.icon}</div>
                <span className="text-xs font-medium">{item.name}</span>
                {isActive && (
                  <div className="h-0.5 w-8 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-400 rounded-full mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* CLIPT Logo in center */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
        <div className="w-12 h-12 bg-gradient-to-br from-[#8B5CF6]/20 to-[#6366F1]/20 backdrop-blur-md rounded-full border border-[#6366F1]/50 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-br from-purple-400 to-blue-400">CLIPT</span>
          <div className="absolute inset-0 w-full h-full">
            <div className="w-full h-full rounded-full" style={{ 
              border: '2px solid transparent',
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #8B5CF6, #6366F1) border-box',
              WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoyNavigation;
