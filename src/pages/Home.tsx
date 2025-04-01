import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from "react-router-dom";
import { 
  Gamepad2, 
  User, 
  LogIn, 
  Power, 
  Settings, 
  Trophy, 
  Image, 
  Film, 
  Users, 
  MessageSquare
} from "lucide-react";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMenu, setSelectedMenu] = useState(0);
  
  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Menu options
  const menuOptions = [
    { name: "Play Game", icon: <Gamepad2 className="h-6 w-6" />, action: () => navigate('/squads') },
    { name: "My Profile", icon: <User className="h-6 w-6" />, action: () => navigate('/profile') },
    { name: "Squads", icon: <Users className="h-6 w-6" />, action: () => navigate('/squads') },
    { name: "Achievements", icon: <Trophy className="h-6 w-6" />, action: () => navigate('/achievements') },
    { name: "Media", icon: <Film className="h-6 w-6" />, action: () => navigate('/media') },
    { name: "Messages", icon: <MessageSquare className="h-6 w-6" />, action: () => navigate('/messages') },
    { name: "Settings", icon: <Settings className="h-6 w-6" />, action: () => navigate('/settings') }
  ];

  // Handle key navigation (simulate controller/d-pad input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          setSelectedMenu(prev => (prev > 0 ? prev - 1 : menuOptions.length - 1));
          break;
        case 'ArrowDown':
          setSelectedMenu(prev => (prev < menuOptions.length - 1 ? prev + 1 : 0));
          break;
        case 'Enter':
          menuOptions[selectedMenu].action();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMenu, menuOptions]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0D1033] to-[#060818] text-white overflow-hidden">
      {/* Top status bar - PlayStation style */}
      <div className="flex justify-between items-center p-4 bg-black/30 border-b border-blue-900/30">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-medium">{user ? user.email : 'Guest'}</span>
        </div>
        <div className="text-sm font-medium">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <div className="w-3 h-3 rounded-full bg-white"></div>
        </div>
      </div>

      {/* Console welcome - Xbox style */}
      <div className="pt-8 pb-8 text-center">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-green-400 mb-2">
          Welcome{user ? `, ${user.email?.split('@')[0]}` : ' to Clipt'}
        </h1>
        <p className="text-blue-300/80 text-lg">Your gaming moments, shared.</p>
      </div>

      {/* Main console UI - mixed console style */}
      <div className="container mx-auto px-4 flex justify-between">
        {/* Left side - Nintendo DS style touchscreen menu */}
        <div className="w-1/2 pr-6">
          <div className="bg-blue-900/20 rounded-lg border border-blue-800/50 p-4 shadow-inner">
            {menuOptions.map((option, index) => (
              <div 
                key={index}
                onClick={() => {
                  setSelectedMenu(index);
                  option.action();
                }}
                className={`flex items-center p-3 rounded-md transition-all cursor-pointer mb-2 ${
                  selectedMenu === index 
                    ? 'bg-gradient-to-r from-blue-600/80 to-purple-600/80 shadow-lg translate-x-1' 
                    : 'hover:bg-blue-800/30'
                }`}
              >
                <div className={`mr-4 ${selectedMenu === index ? 'text-white' : 'text-blue-400'}`}>
                  {option.icon}
                </div>
                <span className={`font-medium ${selectedMenu === index ? 'text-white' : 'text-blue-300'}`}>
                  {option.name}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Right side - Wii style bubble UI */}
        <div className="w-1/2 pl-6">
          <div className="relative h-80 bg-blue-900/20 rounded-lg border border-blue-800/50 p-6 flex flex-col justify-center items-center">
            <div className="absolute -left-4 top-1/4 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <div className="absolute left-1/4 -top-4 w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-blue-500"></div>
            
            {!user ? (
              <div className="text-center space-y-6">
                <Gamepad2 className="h-20 w-20 mx-auto text-blue-400/80" />
                <h2 className="text-2xl font-bold text-blue-300">Start Your Journey</h2>
                <div className="space-y-3">
                  <button 
                    onClick={() => navigate('/login')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center"
                  >
                    <LogIn className="mr-2 h-5 w-5" />
                    Sign In
                  </button>
                  <button 
                    onClick={() => navigate('/signup')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center"
                  >
                    <User className="mr-2 h-5 w-5" />
                    Create Account
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-blue-800 border-4 border-blue-400 flex items-center justify-center mx-auto">
                  <User className="h-12 w-12 text-blue-300" />
                </div>
                <h2 className="text-2xl font-bold text-blue-300">{user.email?.split('@')[0]}</h2>
                <p className="text-blue-400/80">Level 5 Gamer</p>
                <button 
                  onClick={() => navigate('/squads')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-8 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700"
                >
                  View Squad Content
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Game Controls - Bottom console UI */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/50 border-t border-blue-900/30">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          {/* D-Pad - PS5/Xbox style */}
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-900/80 to-purple-900/80 border border-blue-500/50 shadow-lg"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            </div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/3 text-xs bg-black/50 px-2 py-1 rounded-md">↑</div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/3 text-xs bg-black/50 px-2 py-1 rounded-md">↓</div>
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/3 text-xs bg-black/50 px-2 py-1 rounded-md">←</div>
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/3 text-xs bg-black/50 px-2 py-1 rounded-md">→</div>
          </div>
          
          {/* Center Button - Nintendo style */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 to-blue-500 flex items-center justify-center shadow-lg">
              <span className="text-xs font-bold text-white">CLIPT</span>
            </div>
          </div>
          
          {/* Action Buttons - Xbox style */}
          <div className="relative w-24 h-24">
            <div className="absolute top-1/4 right-1/4 w-10 h-10 rounded-full bg-blue-700 border border-blue-400 flex items-center justify-center shadow-md">
              <span className="text-xs font-bold">X</span>
            </div>
            <div className="absolute bottom-1/4 right-1/4 w-10 h-10 rounded-full bg-red-700 border border-red-400 flex items-center justify-center shadow-md">
              <span className="text-xs font-bold">A</span>
            </div>
            <div className="absolute bottom-1/4 left-1/4 w-10 h-10 rounded-full bg-yellow-700 border border-yellow-400 flex items-center justify-center shadow-md">
              <span className="text-xs font-bold">Y</span>
            </div>
            <div className="absolute top-1/4 left-1/4 w-10 h-10 rounded-full bg-green-700 border border-green-400 flex items-center justify-center shadow-md">
              <span className="text-xs font-bold">B</span>
            </div>
          </div>
        </div>
        
        {/* Menu Buttons - Wii/PS5 style */}
        <div className="flex justify-center mt-2 space-x-8">
          <button className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center shadow">
            <span className="text-sm">≡</span>
          </button>
          <button className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center shadow">
            <span className="text-sm">◎</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
