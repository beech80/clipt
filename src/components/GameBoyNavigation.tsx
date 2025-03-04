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
    <div className="gameboy-navigation fixed top-0 left-0 right-0 bg-[#1a1b26]/90 backdrop-blur-md border-b border-[#2c2d4a] z-40">
      <div className="max-w-screen-md mx-auto">
        <div className="flex justify-between items-center">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
                            (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <button
                key={item.path}
                className={`flex-1 py-3 flex flex-col items-center justify-center focus:outline-none transition-colors ${
                  isActive ? 'text-purple-400' : 'text-gray-400 hover:text-gray-200'
                }`}
                onClick={() => navigate(item.path)}
              >
                <div className="mb-1">{item.icon}</div>
                <span className="text-xs font-medium">{item.name}</span>
                {isActive && (
                  <div className="h-0.5 w-8 bg-purple-400 rounded-full mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* CLIPT Logo in center */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-10 h-10 bg-[#1a1b26] rounded-full border border-[#2c2d4a] flex items-center justify-center">
          <span className="text-sm font-bold relative z-10">CLIPT</span>
          <div className="absolute inset-0 w-full h-full">
            <div className="w-full h-full rounded-full" style={{ 
              border: '2px solid transparent',
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #8B5CF6, #6366F1) border-box',
              WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude'
            }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoyNavigation;
