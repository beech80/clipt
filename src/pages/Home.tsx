import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from "react-router-dom";
import { 
  User, 
  LogIn, 
  Power, 
  Settings, 
  Film, 
  MessageSquare,
  Compass,
  Sparkles,
  CloudLightning,
  Flame
} from "lucide-react";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMenu, setSelectedMenu] = useState(0);
  const [animateBackground, setAnimateBackground] = useState(false);
  
  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Background animation effect
  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimateBackground(true);
    }, 500);
    
    return () => clearTimeout(timeout);
  }, []);
  
  // Menu options - updated to match actual existing pages
  const menuOptions = [
    { name: "My Profile", icon: <User className="h-6 w-6" />, action: () => navigate('/profile') },
    { name: "Explore", icon: <Compass className="h-6 w-6" />, action: () => navigate('/discovery') },
    { name: "Clips", icon: <Film className="h-6 w-6" />, action: () => navigate('/clips') },
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
    <div className={`min-h-screen relative overflow-hidden transition-all duration-1000 ${
      animateBackground ? 'bg-gradient-to-b from-[#0D1033] to-[#060818]' : 'bg-[#060818]'
    }`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute w-[500px] h-[500px] rounded-full bg-blue-500/5 filter blur-[100px] -top-[250px] -left-[250px] transition-all duration-3000 ${
          animateBackground ? 'opacity-100' : 'opacity-0'
        }`}></div>
        <div className={`absolute w-[600px] h-[600px] rounded-full bg-purple-500/5 filter blur-[120px] -bottom-[300px] -right-[300px] transition-all duration-3000 delay-500 ${
          animateBackground ? 'opacity-100' : 'opacity-0'
        }`}></div>
        <div className={`absolute w-[300px] h-[300px] rounded-full bg-green-400/5 filter blur-[80px] top-[30%] right-[10%] transition-all duration-3000 delay-1000 ${
          animateBackground ? 'opacity-100' : 'opacity-0'
        }`}></div>
      </div>

      {/* Futuristic grid lines */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute w-full h-px bg-blue-400/50 top-1/4"></div>
        <div className="absolute w-full h-px bg-blue-400/30 top-1/2"></div>
        <div className="absolute w-full h-px bg-blue-400/50 top-3/4"></div>
        <div className="absolute w-px h-full bg-blue-400/50 left-1/4"></div>
        <div className="absolute w-px h-full bg-blue-400/30 left-1/2"></div>
        <div className="absolute w-px h-full bg-blue-400/50 left-3/4"></div>
      </div>
      
      <div className="relative z-10 text-white">
        {/* Top status bar - Enhanced PlayStation style */}
        <div className="flex justify-between items-center p-4 bg-black/40 backdrop-blur-md border-b border-blue-900/40">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/40"></div>
            <span className="text-sm font-medium tracking-wide">{user ? user.email : 'Guest'}</span>
          </div>
          <div className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/40"></div>
            <div className="w-3 h-3 rounded-full bg-white shadow-lg shadow-white/40"></div>
          </div>
        </div>

        {/* Enhanced console welcome - Xbox style with particle effects */}
        <div className="pt-10 pb-8 text-center relative">
          {/* Animated particles */}
          <div className={`absolute inset-0 pointer-events-none transition-all duration-2000 ${
            animateBackground ? 'opacity-100' : 'opacity-0'
          }`}>
            {[...Array(20)].map((_, i) => (
              <div 
                key={i}
                className="absolute w-1 h-1 rounded-full bg-blue-400 animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDuration: `${Math.random() * 10 + 10}s`,
                  animationDelay: `${Math.random() * 5}s`
                }}
              ></div>
            ))}
          </div>
          
          <div className={`transition-all duration-1000 ${
            animateBackground ? 'transform-none opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <h1 className="text-5xl font-bold mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-green-400">
                Welcome{user ? `, ${user.email?.split('@')[0]}` : ' to Clipt'}
              </span>
            </h1>
            <p className="text-blue-300/80 text-lg">Your gaming moments, shared.</p>
          </div>
        </div>

        {/* Main console UI - Enhanced mixed console style */}
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between gap-8 mb-32">
          {/* Left side - Enhanced Nintendo DS style touchscreen menu */}
          <div className="w-full md:w-1/2 md:pr-6">
            <div className="bg-blue-900/10 backdrop-blur-md rounded-2xl border border-blue-800/50 p-6 shadow-xl relative overflow-hidden">
              {/* Holographic effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 z-0"></div>
              
              {/* Menu header */}
              <div className="mb-6 flex items-center">
                <Sparkles className="h-5 w-5 text-blue-400 mr-2" />
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                  Console Menu
                </h2>
              </div>
              
              {/* Enhanced menu items */}
              <div className="space-y-3">
                {menuOptions.map((option, index) => (
                  <div 
                    key={index}
                    onClick={() => {
                      setSelectedMenu(index);
                      option.action();
                    }}
                    className={`flex items-center p-4 rounded-lg transition-all cursor-pointer relative overflow-hidden group ${
                      selectedMenu === index 
                        ? 'bg-gradient-to-r from-blue-600/60 to-purple-600/60 shadow-lg shadow-blue-600/20 translate-x-1' 
                        : 'hover:bg-blue-800/20'
                    }`}
                  >
                    {/* Selection indicator */}
                    {selectedMenu === index && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400"></div>
                    )}
                    
                    {/* Icon wrapper */}
                    <div className={`mr-4 p-2 rounded-lg ${
                      selectedMenu === index 
                        ? 'bg-white/10 text-white' 
                        : 'bg-blue-900/30 text-blue-400 group-hover:text-blue-300'
                    } transition-all`}>
                      {option.icon}
                    </div>
                    
                    {/* Text */}
                    <span className={`font-medium transition-all ${
                      selectedMenu === index ? 'text-white' : 'text-blue-300 group-hover:text-blue-200'
                    }`}>
                      {option.name}
                    </span>
                    
                    {/* Animated hover effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity ${
                      selectedMenu === index ? 'opacity-100' : ''
                    }`}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right side - Enhanced Wii style bubble UI */}
          <div className="w-full md:w-1/2 md:pl-6">
            <div className="relative h-96 bg-blue-900/10 backdrop-blur-md rounded-2xl border border-blue-800/50 p-8 flex flex-col justify-center items-center shadow-xl overflow-hidden">
              {/* Glowing orbs */}
              <div className="absolute -left-6 top-1/4 w-12 h-12 rounded-full bg-gradient-to-r from-blue-500/30 to-purple-500/30 blur-md animate-pulse-slow"></div>
              <div className="absolute left-1/4 -top-6 w-10 h-10 rounded-full bg-gradient-to-r from-green-500/30 to-blue-500/30 blur-md animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
              <div className="absolute right-1/4 bottom-1/4 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-md animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
              
              {/* Futuristic grid */}
              <div className="absolute inset-0 z-0 opacity-10">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="absolute w-full h-px bg-blue-400/30" style={{ top: `${i * 10}%` }}></div>
                ))}
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="absolute w-px h-full bg-blue-400/30" style={{ left: `${i * 10}%` }}></div>
                ))}
              </div>
              
              {!user ? (
                <div className="text-center space-y-8 relative z-10">
                  <div className="w-24 h-24 mx-auto relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-ping-slow opacity-75"></div>
                    <div className="relative w-full h-full rounded-full bg-gradient-to-br from-blue-600/80 to-purple-600/80 flex items-center justify-center border border-blue-400/50 shadow-lg shadow-blue-500/20">
                      <Flame className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-blue-100">Start Your Journey</h2>
                  
                  <div className="space-y-4">
                    <button 
                      onClick={() => navigate('/login')}
                      className="w-full bg-gradient-to-r from-blue-600/90 to-blue-800/90 hover:from-blue-500/90 hover:to-blue-700/90 text-white py-4 px-6 rounded-xl font-medium flex items-center justify-center transition-all shadow-lg hover:shadow-blue-500/20 border border-blue-500/30"
                    >
                      <LogIn className="mr-3 h-5 w-5" />
                      Sign In
                    </button>
                    
                    <button 
                      onClick={() => navigate('/signup')}
                      className="w-full bg-gradient-to-r from-purple-600/90 to-purple-800/90 hover:from-purple-500/90 hover:to-purple-700/90 text-white py-4 px-6 rounded-xl font-medium flex items-center justify-center transition-all shadow-lg hover:shadow-purple-500/20 border border-purple-500/30"
                    >
                      <User className="mr-3 h-5 w-5" />
                      Create Account
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-6 relative z-10 w-full">
                  <div className="w-28 h-28 mx-auto relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-ping-slow opacity-75"></div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-md"></div>
                    <div className="relative w-full h-full rounded-full bg-gradient-to-br from-blue-700/80 to-purple-700/80 flex items-center justify-center border-4 border-blue-400/50 shadow-lg shadow-blue-500/30">
                      <User className="h-12 w-12 text-blue-100" />
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300">
                      {user.email?.split('@')[0]}
                    </h2>
                    <p className="text-blue-400/80 mt-1">Level 5 Gamer</p>
                  </div>
                  
                  <div className="flex flex-col space-y-3">
                    <button 
                      onClick={() => navigate('/clipts')}
                      className="w-full bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-500/80 hover:to-purple-500/80 text-white py-3 px-8 rounded-lg font-medium transition-all shadow-lg hover:shadow-purple-500/20 border border-blue-500/30 flex items-center justify-center"
                    >
                      <CloudLightning className="mr-2 h-5 w-5" />
                      Latest Content
                    </button>
                    
                    <button 
                      onClick={() => navigate('/discovery')}
                      className="w-full bg-gradient-to-r from-green-600/80 to-blue-600/80 hover:from-green-500/80 hover:to-blue-500/80 text-white py-3 px-8 rounded-lg font-medium transition-all shadow-lg hover:shadow-blue-500/20 border border-green-500/30 flex items-center justify-center"
                    >
                      <Compass className="mr-2 h-5 w-5" />
                      Explore Discovery
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Game Controls - Bottom console UI */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/60 backdrop-blur-md border-t border-blue-900/40">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            {/* Enhanced D-Pad - PS5/Xbox style */}
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-900/80 to-purple-900/80 border border-blue-500/50 shadow-lg"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-md"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-blue-500 shadow-md shadow-blue-500/50"></div>
              </div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/3 text-xs bg-black/70 px-2 py-1 rounded-md border border-blue-500/30">↑</div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/3 text-xs bg-black/70 px-2 py-1 rounded-md border border-blue-500/30">↓</div>
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/3 text-xs bg-black/70 px-2 py-1 rounded-md border border-blue-500/30">←</div>
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/3 text-xs bg-black/70 px-2 py-1 rounded-md border border-blue-500/30">→</div>
            </div>
            
            {/* Enhanced Center Button - Nintendo style */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500/50 to-blue-500/50 animate-pulse-slow blur-md"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 to-blue-500 flex items-center justify-center shadow-lg border border-white/20">
                <span className="text-xs font-bold text-white">CLIPT</span>
              </div>
            </div>
            
            {/* Enhanced Action Buttons - Xbox style */}
            <div className="relative w-24 h-24">
              <div className="absolute top-1/4 right-1/4 w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 border border-blue-400 flex items-center justify-center shadow-md">
                <span className="text-xs font-bold">X</span>
              </div>
              <div className="absolute bottom-1/4 right-1/4 w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 border border-red-400 flex items-center justify-center shadow-md">
                <span className="text-xs font-bold">A</span>
              </div>
              <div className="absolute bottom-1/4 left-1/4 w-10 h-10 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-800 border border-yellow-400 flex items-center justify-center shadow-md">
                <span className="text-xs font-bold">Y</span>
              </div>
              <div className="absolute top-1/4 left-1/4 w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-green-800 border border-green-400 flex items-center justify-center shadow-md">
                <span className="text-xs font-bold">B</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add these new animations to global CSS or inline here
const globalStyles = `
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
  
  @keyframes ping-slow {
    0% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.2); opacity: 0.4; }
    100% { transform: scale(1); opacity: 0.8; }
  }
  
  @keyframes pulse-slow {
    0% { opacity: 0.4; }
    50% { opacity: 0.8; }
    100% { opacity: 0.4; }
  }
  
  .animate-float {
    animation: float 15s ease-in-out infinite;
  }
  
  .animate-ping-slow {
    animation: ping-slow 3s ease-in-out infinite;
  }
  
  .animate-pulse-slow {
    animation: pulse-slow 4s ease-in-out infinite;
  }
`;

export default Home;
