
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Trophy, User, Menu as MenuIcon } from 'lucide-react';
import AppSidebar from './AppSidebar';

const GameBoyNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  // Navigation items
  const navItems = [
    { name: 'Home', path: '/', icon: <Home size={20} /> },
    { name: 'Discover', path: '/discover', icon: <Search size={20} /> },
    { name: 'Top Clips', path: '/topclips', icon: <Trophy size={20} /> },
    { name: 'Profile', path: '/profile', icon: <User size={20} /> },
    { 
      name: 'Menu', 
      path: '#', 
      icon: <MenuIcon size={20} className="text-purple-400" />, 
      onClick: () => setSidebarVisible(!sidebarVisible) 
    }
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

  // Handle click outside to close sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('app-sidebar');
      const menuButton = document.getElementById('menu-button');
      
      if (sidebar && 
          !sidebar.contains(event.target as Node) && 
          menuButton && 
          !menuButton.contains(event.target as Node) &&
          sidebarVisible) {
        setSidebarVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarVisible]);

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && sidebarVisible) {
        setSidebarVisible(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [sidebarVisible]);

  // Prevent body scrolling when sidebar is open
  useEffect(() => {
    if (sidebarVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarVisible]);

  return (
    <>
      <AppSidebar isVisible={sidebarVisible} />
      
      <div className={`gameboy-navigation fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled 
          ? 'bg-[#0D0B14]/90 backdrop-blur-md border-t border-purple-900/50 shadow-lg' 
          : 'bg-[#0D0B14]/80 backdrop-blur-sm border-t border-purple-900/30'
      }`}>
        <div className="max-w-screen-md mx-auto">
          <div className="flex justify-between items-center">
            {navItems.map((item) => {
              const isActive = 
                item.path !== '#' && (
                  location.pathname === item.path || 
                  (item.path !== '/' && location.pathname.startsWith(item.path))
                );
              
              const isMenu = item.name === 'Menu';
              
              return (
                <button
                  id={isMenu ? 'menu-button' : undefined}
                  key={item.name}
                  className={`flex-1 py-4 flex flex-col items-center justify-center focus:outline-none transition-all duration-300 ${
                    isActive 
                      ? 'text-[#9b87f5]' 
                      : isMenu && sidebarVisible
                        ? 'text-purple-400'
                        : 'text-gray-400 hover:text-gray-200'
                  }`}
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick();
                    } else if (item.path !== '#') {
                      navigate(item.path);
                    }
                  }}
                >
                  <div className={`relative transition-transform duration-300 ${
                    isActive ? 'scale-110' : 
                    isMenu && sidebarVisible ? 'rotate-90 scale-110' : ''
                  }`}>
                    {item.icon}
                    {isActive && (
                      <span className="absolute inset-0 animate-ping-slow rounded-full bg-purple-500/20" />
                    )}
                  </div>
                  <span className={`text-xs font-medium mt-1 ${
                    isMenu && sidebarVisible ? 'text-purple-400' : ''
                  }`}>{item.name}</span>
                  {(isActive || (isMenu && sidebarVisible)) && (
                    <div className={`h-0.5 w-6 ${
                      isMenu && sidebarVisible 
                        ? 'bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500' 
                        : 'bg-gradient-to-r from-purple-400 via-[#9b87f5] to-purple-400'
                    } rounded-full mt-1`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default GameBoyNavigation;
