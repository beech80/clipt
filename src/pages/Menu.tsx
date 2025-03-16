import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  User, 
  Video, 
  Compass, 
  MessageSquare, 
  Settings as SettingsIcon,
  Home, 
  Film,
  Award,
  LogOut,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Menu = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const menuItems = [
    { title: 'Home', icon: <Home className="h-6 w-6 mr-4" />, path: '/' },
    { title: 'Profile', icon: <User className="h-6 w-6 mr-4" />, path: '/profile' },
    { title: 'Streaming', icon: <Video className="h-6 w-6 mr-4" />, path: '/streaming' },
    { title: 'Discovery', icon: <Compass className="h-6 w-6 mr-4" />, path: '/discovery' },
    { title: 'Messages', icon: <MessageSquare className="h-6 w-6 mr-4" />, path: '/messages' },
    { title: 'All Comments', icon: <MessageCircle className="h-6 w-6 mr-4" />, path: '/comments' },
    { title: 'Clipts', icon: <Film className="h-6 w-6 mr-4" />, path: '/clipts' },
    { title: 'Top Clipts', icon: <Award className="h-6 w-6 mr-4" />, path: '/top-clipts' },
    { title: 'Settings', icon: <SettingsIcon className="h-6 w-6 mr-4" />, path: '/settings' }
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c]">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <h1 className="text-3xl font-bold text-white">Menu</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-20 max-w-md">
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-xl">
          <div className="flex flex-col space-y-2">
            {menuItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                className="flex justify-start items-center py-6 text-lg text-white hover:bg-white/10 transition"
                onClick={() => navigate(item.path)}
              >
                {item.icon}
                {item.title}
              </Button>
            ))}
            
            <hr className="border-white/10 my-2" />
            
            <Button
              variant="ghost"
              className="flex justify-start items-center py-6 text-lg text-red-400 hover:bg-white/10 transition"
              onClick={handleLogout}
            >
              <LogOut className="h-6 w-6 mr-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;
