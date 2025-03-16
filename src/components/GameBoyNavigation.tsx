
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Trophy, User, Menu as MenuIcon } from 'lucide-react';

const GameBoyNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  
  // Navigation items
  const navItems = [
    { name: 'Home', path: '/', icon: <Home size={20} /> },
    { name: 'Discover', path: '/discover', icon: <Search size={20} /> },
    { name: 'Top Clips', path: '/topclips', icon: <Trophy size={20} /> },
    { name: 'Profile', path: '/profile', icon: <User size={20} /> },
    { name: 'Menu', path: '/menu', icon: <MenuIcon size={20} /> }
  ];

  // Add scroll listener to apply blur effect when scrolling
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  return (
    <div className={`gameboy-navigation fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
      scrolled 
        ? 'bg-[#1e1a2e]/90 backdrop-blur-md border-b border-purple-900/50 shadow-lg' 
        : 'bg-[#1e1a2e]/70 backdrop-blur-sm border-b border-purple-900/30'
    }`}>
      <div className="max-w-screen-md mx-auto">
        <div className="flex justify-between items-center">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
                           (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <button
                key={item.path}
                className={`flex-1 py-3 flex flex-col items-center justify-center focus:outline-none transition-all duration-300 ${
                  isActive 
                    ? 'text-purple-400' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                onClick={() => navigate(item.path)}
              >
                <div className={`relative mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
                  {item.icon}
                  {isActive && (
                    <span className="absolute inset-0 animate-ping-slow rounded-full bg-purple-500/20" />
                  )}
                </div>
                <span className="text-xs font-medium">{item.name}</span>
                {isActive && (
                  <div className="h-0.5 w-8 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-400 rounded-full mt-1.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* CLIPT Logo in center */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-600/30 to-blue-600/30 backdrop-blur-md rounded-full border border-purple-500/50 flex items-center justify-center shadow-lg">
          <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-br from-purple-400 to-blue-400">CLIPT</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          70% {
            transform: scale(1.7);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
        
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default GameBoyNavigation;
