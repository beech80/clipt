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
  Flame,
  Users,
  Bookmark,
  Radio,
  Bell,
  Zap
} from "lucide-react";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMenu, setSelectedMenu] = useState(0);
  const [animateBackground, setAnimateBackground] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3); // Mock notification count
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
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
  
  // Menu options - updated to match the specific list requested
  const menuOptions = [
    { name: "Profile", icon: <User className="h-6 w-6" />, action: () => navigate('/profile') },
    { name: "Discovery", icon: <Compass className="h-6 w-6" />, action: () => navigate('/discover') },
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

  // Navigate to notifications page when clicking on the bell icon
  const handleNotificationsClick = () => {
    navigate('/notifications');
  };

  // If not logged in, don't render the home page (will redirect to login)
  if (!user) {
    return null;
  }

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

      {/* Enhanced animated grid lines */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        {/* Horizontal lines */}
        {[...Array(8)].map((_, i) => (
          <div 
            key={`h-${i}`} 
            className="absolute w-full h-px bg-blue-400/50" 
            style={{ 
              top: `${(i + 1) * 12}%`,
              transform: `translateY(${Math.sin(i * 0.5) * 5}px)`,
              opacity: i % 2 === 0 ? 0.5 : 0.3,
              filter: `blur(${i % 3 === 0 ? 1 : 0}px)`
            }}
          ></div>
        ))}
        
        {/* Vertical lines */}
        {[...Array(8)].map((_, i) => (
          <div 
            key={`v-${i}`} 
            className="absolute h-full w-px bg-blue-400/50" 
            style={{
              left: `${(i + 1) * 12}%`,
              transform: `translateX(${Math.sin(i * 0.5) * 5}px)`,
              opacity: i % 2 === 0 ? 0.5 : 0.3,
              filter: `blur(${i % 3 === 0 ? 1 : 0}px)`
            }}
          ></div>
        ))}
        
        {/* Animated scanning line */}
        <div 
          className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none" 
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.1) 50%, transparent)',
            backgroundSize: '100% 10px',
            animation: 'scan 8s linear infinite'
          }}
        ></div>
      </div>
      
      <div className="relative z-10 text-white">
        {/* Enhanced top status bar with visual improvements */}
        <div className="relative">
          {/* Animated glow line under header */}
          <div className="absolute bottom-0 left-0 w-full h-px bg-blue-500/50 z-0 animate-pulse-slow"></div>
          
          {/* Main header with enhanced styling */}
          <div className="flex justify-between items-center p-4 bg-black/40 backdrop-blur-md border-b border-blue-900/40 relative z-10">
            {/* Left side with user info */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/40"></div>
                <div className="absolute -inset-1 rounded-full bg-green-500/20 animate-ping opacity-75"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium tracking-wide">{user ? user.email : 'Guest'}</span>
                <span className="text-xs text-blue-400/80">Online</span>
              </div>
            </div>
            
            {/* Center with logo/branding */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
              <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-green-400">
                CLIPT
              </span>
              <Zap className="h-5 w-5 text-yellow-400 ml-1 animate-pulse-slow" />
            </div>
            
            {/* Right side with notification indicator */}
            <div className="flex items-center space-x-4">
              {/* Notification indicator - now clickable to navigate to notifications page */}
              <div className="relative group cursor-pointer" onClick={handleNotificationsClick}>
                <Bell className="h-5 w-5 text-blue-300 group-hover:text-blue-100 transition-colors" />
                {notificationCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-[10px] font-bold">{notificationCount}</span>
                  </div>
                )}
                <div className="absolute -inset-2 rounded-full bg-blue-500/0 group-hover:bg-blue-500/10 transition-all"></div>
              </div>
            </div>
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
              
              {/* Enhanced menu items with scrollable container for more items */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-blue-900/20">
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
                  
                  <div className="flex flex-col">
                    <button 
                      onClick={() => navigate('/streaming')}
                      className="w-full bg-gradient-to-r from-green-600/80 to-blue-600/80 hover:from-green-500/80 hover:to-blue-500/80 text-white py-3 px-8 rounded-lg font-medium transition-all shadow-lg hover:shadow-blue-500/20 border border-green-500/30 flex items-center justify-center"
                    >
                      <Radio className="mr-2 h-5 w-5" />
                      Start Streaming
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Game Controls have been removed */}
        
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
  
  @keyframes scan {
    0% { background-position: 0 0; }
    100% { background-position: 0 100%; }
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
  
  /* Custom scrollbar styling */
  .scrollbar-thin::-webkit-scrollbar {
    width: 4px;
  }
  
  .scrollbar-thumb-blue-700::-webkit-scrollbar-thumb {
    background-color: rgba(29, 78, 216, 0.5);
    border-radius: 9999px;
  }
  
  .scrollbar-track-blue-900\/20::-webkit-scrollbar-track {
    background-color: rgba(30, 58, 138, 0.2);
    border-radius: 9999px;
  }
`;

export default Home;
