
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
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from "@/lib/utils";

const Menu = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const menuItems = [
    { title: 'Home', icon: <Home className="h-6 w-6" />, path: '/' },
    { title: 'Profile', icon: <User className="h-6 w-6" />, path: '/profile' },
    { title: 'Streaming', icon: <Video className="h-6 w-6" />, path: '/streaming' },
    { title: 'Discovery', icon: <Compass className="h-6 w-6" />, path: '/discovery' },
    { title: 'Messages', icon: <MessageSquare className="h-6 w-6" />, path: '/messages' },
    { title: 'Clipts', icon: <Film className="h-6 w-6" />, path: '/clipts' },
    { title: 'Top Clipts', icon: <Award className="h-6 w-6" />, path: '/top-clipts' },
    { title: 'Settings', icon: <SettingsIcon className="h-6 w-6" />, path: '/settings' }
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
    <div className="min-h-screen bg-gradient-to-b from-[#0a0d20] to-[#111827] backdrop-blur-lg">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/60 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">Menu</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-20 max-w-md">
        {/* Menu Items */}
        <div className="bg-black/30 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          {menuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className={cn(
                "flex justify-between w-full items-center py-6 px-6 text-lg text-white hover:bg-white/10 transition-all hover:pl-8 group relative overflow-hidden",
                "border-b border-white/5 last:border-0"
              )}
              onClick={() => navigate(item.path)}
            >
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/0 to-purple-600/0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              
              <div className="flex items-center gap-4 z-10">
                <div className="bg-white/10 p-3 rounded-xl group-hover:bg-purple-600/20 transition-all">
                  {item.icon}
                </div>
                <span className="font-medium">{item.title}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-white/40 group-hover:text-white/80 transition-all group-hover:translate-x-1" />
            </Button>
          ))}
          
          {/* Sign Out Button */}
          <div className="px-4 py-4 mt-2">
            <Button
              variant="destructive"
              className="flex justify-between w-full items-center py-6 text-lg group hover:bg-red-600/80 relative overflow-hidden"
              onClick={handleLogout}
            >
              {/* Background pulse effect */}
              <div className="absolute inset-0 bg-red-600/20 opacity-0 group-hover:opacity-30 transition-all"></div>
              
              <div className="flex items-center gap-4 z-10">
                <div className="bg-red-500/20 p-3 rounded-xl group-hover:bg-red-500/30 transition-all">
                  <LogOut className="h-6 w-6" />
                </div>
                <span className="font-medium">Sign Out</span>
              </div>
              <ChevronRight className="h-5 w-5 opacity-60 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
        
        {/* User Profile Card */}
        {user && (
          <div className="mt-6 bg-black/40 backdrop-blur-xl rounded-2xl p-5 border border-white/10 flex items-center gap-4 group hover:bg-black/50 transition-all cursor-pointer" onClick={() => navigate('/profile')}>
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center overflow-hidden p-0.5">
              <img 
                src={user.user_metadata?.avatar_url || "/placeholder.svg"} 
                alt="User avatar" 
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg group-hover:text-purple-300 transition-colors">
                {user.user_metadata?.full_name || user.email}
              </h3>
              <p className="text-white/60 text-sm group-hover:text-white/80 transition-colors">{user.email}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-white/40 group-hover:text-white/80 transition-all group-hover:translate-x-1" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;
