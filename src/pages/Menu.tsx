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
  MessageCircle,
  Users,
  Bell
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Menu = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const menuItems = [
    {
      title: 'GAME TOOLS',
      items: [
        { title: 'Settings', icon: <SettingsIcon className="h-6 w-6 mr-4 text-purple-400" />, path: '/settings', description: 'Configure your game' },
        { title: 'Streaming', icon: <Video className="h-6 w-6 mr-4 text-purple-400" />, path: '/streaming', description: 'Live gameplay' },
        { title: 'Profile', icon: <User className="h-6 w-6 mr-4 text-purple-400" />, path: '/profile', description: 'Your player stats' },
        { title: 'Messages', icon: <MessageSquare className="h-6 w-6 mr-4 text-purple-400" />, path: '/messages', description: 'Chat with players' },
        { title: 'Notifications', icon: <Bell className="h-6 w-6 mr-4 text-purple-400" />, path: '/notifications', description: 'View all notifications' },
        { title: 'Video Debug', icon: <Film className="h-6 w-6 mr-4 text-red-400" />, path: '/video-debug', description: 'Fix video issues [DEV]', className: 'dev-tool' }
      ]
    },
    {
      title: 'EXPLORE',
      items: [
        { title: 'Discovery', icon: <Compass className="h-6 w-6 mr-4 text-blue-400" />, path: '/discovery', description: 'Find new games' },
        { title: 'Top Clipts', icon: <Award className="h-6 w-6 mr-4 text-blue-400" />, path: '/top-clipts', description: 'Hall of fame' },
        { title: 'Squads Clipts', icon: <Users className="h-6 w-6 mr-4 text-purple-400" />, path: '/squads-clipts', description: 'Your squads clipts', className: 'squads-menu-item' },
        { title: 'Clipts', icon: <Film className="h-6 w-6 mr-4 text-blue-400" />, path: '/clipts', description: 'View all clipts' },
        { title: 'All Comments', icon: <MessageCircle className="h-6 w-6 mr-4 text-blue-400" />, path: '/comments', description: 'Community chat' },
        { title: 'Home', icon: <Home className="h-6 w-6 mr-4 text-blue-400" />, path: '/', description: 'Main screen', className: 'home-menu-item'}
      ]
    },
    {
      title: 'SOCIAL',
      items: [
        { title: 'Invite Friends', icon: <Users className="h-6 w-6 mr-4 text-green-400" />, path: '/notifications', description: 'Share with friends' }
      ]
    }
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Debug output for menu items
  console.log('Menu items:', menuItems);

  return (
    <div className="min-h-screen bg-[#0f112a] text-white">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-[#141644] border-b-4 border-[#4a4dff] shadow-[0_4px_0_0_#000]">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <h1 className="text-3xl font-bold text-white pixel-font retro-text-shadow">GAME MENU</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-20 max-w-4xl">
        {menuItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-[#5ce1ff] pixel-font retro-text-shadow">{section.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ display: 'grid' }}>
              {section.items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => navigate(item.path)}
                  className={`retro-menu-item p-4 flex items-center border-2 border-[#4a4dff] bg-[#1a1d45] hover:bg-[#252968] transition-all transform hover:translate-y-[-2px] focus:outline-none focus:ring-2 focus:ring-[#5ce1ff] ${
                    item.className === 'dev-tool' 
                    ? 'border-red-500 bg-red-900/40 hover:bg-red-900/60' 
                    : ''
                  } ${item.className || ''}`}
                  data-testid={`menu-item-${item.title.toLowerCase()}`}
                >
                  <div className="bg-[#252968] p-2 rounded-none border border-[#4a4dff]">
                    {item.icon}
                  </div>
                  <div className="ml-4 text-left">
                    <h3 className="text-lg font-bold pixel-font">{item.title}</h3>
                    <p className="text-gray-400 text-sm">{item.description}</p>
                  </div>
                  <div className="ml-auto">
                    <svg className="w-5 h-5 text-[#5ce1ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
        
        <div className="mt-8 text-center">
          <button
            onClick={handleLogout}
            className="retro-button-secondary px-6 py-3 flex items-center mx-auto"
          >
            <LogOut className="h-5 w-5 mr-2" />
            <span className="pixel-font">SIGN OUT</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Menu;
