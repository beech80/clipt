
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
    <div className={`gameboy-navigation fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ${
      scrolled 
        ? 'bg-[#131420]/90 backdrop-blur-md border-t border-purple-900/50 shadow-lg' 
        : 'bg-[#131420]/80 backdrop-blur-sm border-t border-purple-900/30'
    }`}>
      <div className="max-w-screen-md mx-auto">
        <div className="flex justify-between items-center">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
                           (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <button
                key={item.path}
                className={`flex-1 py-4 flex flex-col items-center justify-center focus:outline-none transition-all duration-300 ${
                  isActive 
                    ? 'text-purple-400' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                onClick={() => navigate(item.path)}
              >
                <div className={`relative transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
                  {item.icon}
                  {isActive && (
                    <span className="absolute inset-0 animate-ping-slow rounded-full bg-purple-500/20" />
                  )}
                </div>
                <span className="text-xs font-medium mt-1">{item.name}</span>
                {isActive && (
                  <div className="h-1 w-8 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-400 rounded-full mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GameBoyNavigation;
