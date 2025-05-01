import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/navigation-bar.css';
import { MessageSquare, Home, User, Settings } from 'lucide-react';

const NavigationBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Only show navigation bar on pages that aren't Clipts, SquadsClipts, or Messages
  const hiddenRoutes = ['/clipts', '/squads-clipts', '/messages'];
  
  if (hiddenRoutes.includes(location.pathname)) {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-orange-600/30 flex justify-around py-2 px-1">
      <button 
        onClick={() => navigate('/')} 
        className="flex flex-col items-center justify-center p-2 text-gray-400 hover:text-orange-500"
      >
        <Home size={24} className="mb-1" />
        <span className="text-xs">Home</span>
      </button>
      
      <button 
        onClick={() => navigate('/messages')} 
        className={`flex flex-col items-center justify-center p-2 ${location.pathname === '/messages' ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'}`}
      >
        <MessageSquare size={24} className="mb-1" />
        <span className="text-xs">Messages</span>
      </button>
      
      <button 
        onClick={() => navigate('/profile')} 
        className={`flex flex-col items-center justify-center p-2 ${location.pathname.includes('/profile') ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'}`}
      >
        <User size={24} className="mb-1" />
        <span className="text-xs">Profile</span>
      </button>
      
      <button 
        onClick={() => navigate('/settings')} 
        className={`flex flex-col items-center justify-center p-2 ${location.pathname === '/settings' ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'}`}
      >
        <Settings size={24} className="mb-1" />
        <span className="text-xs">Settings</span>
      </button>
    </div>
  );
};

export default NavigationBar;
