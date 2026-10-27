import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  User, 
  Video, 
  Compass, 
  MessageSquare, 
  Settings as SettingsIcon,
  Home, 
  Award,
  LogOut,
  Bell,
  Crown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LegalLinks } from '@/components/LegalLinks';

const Menu = ({ embedded = false }: { embedded?: boolean }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const signOutBusy = useRef(false);
  const { data: isModerator } = useQuery({
    queryKey: ['menu-moderator', user?.id], enabled: Boolean(user), retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('role')
        .eq('user_id', user!.id).in('role', ['admin','moderator']).limit(1).retry(false);
      if (error) throw error;
      return data.length > 0;
    },
  });

  const menuItems = [
    { title: 'Clipts (Home)', icon: <Home className="h-6 w-6 mr-4" />, path: '/clipts' },
    { title: 'Post / Create', icon: <Video className="h-6 w-6 mr-4" />, path: '/new-post' },
    { title: 'Profile', icon: <User className="h-6 w-6 mr-4" />, path: '/profile' },
    { title: 'Membership / Subscription', icon: <Crown className="h-6 w-6 mr-4" />, path: '/subscription' },
    { title: 'Live Streams', icon: <Video className="h-6 w-6 mr-4" />, path: '/live' },
    { title: 'Stream Setup', icon: <Video className="h-6 w-6 mr-4" />, path: '/stream-setup' },
    { title: 'Discovery', icon: <Compass className="h-6 w-6 mr-4" />, path: '/discovery' },
    { title: 'Messages', icon: <MessageSquare className="h-6 w-6 mr-4" />, path: '/messages' },
    { title: 'Notifications', icon: <Bell className="h-6 w-6 mr-4" />, path: '/notifications' },
    { title: 'Top Clipts', icon: <Award className="h-6 w-6 mr-4" />, path: '/top-clipts' },
    { title: 'Token Store', icon: <Award className="h-6 w-6 mr-4" />, path: '/tokens' },
    { title: 'Creator Dashboard', icon: <Award className="h-6 w-6 mr-4" />, path: '/creator-dashboard' },
    { title: 'Boosts', icon: <Award className="h-6 w-6 mr-4" />, path: '/boosts' },
    { title: 'Achievements', icon: <Award className="h-6 w-6 mr-4" />, path: '/achievements' },
    { title: 'Settings', icon: <SettingsIcon className="h-6 w-6 mr-4" />, path: '/settings' }
  ];

  const handleLogout = async () => {
    if (signOutBusy.current) return;
    signOutBusy.current = true;
    setSigningOut(true);
    setSignOutError('');
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setSignOutError('Sign out was not confirmed. Please try again.');
    } finally {
      signOutBusy.current = false;
      setSigningOut(false);
    }
  };

  return (
    <main className={embedded ? 'clipt-menu-embedded' : 'clipt-auth min-h-64 mx-auto max-w-6xl px-4 py-6'}>
      <div className="gaming-card p-4 border border-purple-500/40">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <h1 className="text-3xl font-bold text-white">Menu</h1>
        </div>
      </div>

      <div className="pt-5">
        <div className="gaming-card p-4 sm:p-6">
          <nav aria-label="Global Clipt menu" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {menuItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className="flex min-h-16 justify-start items-center py-4 text-base whitespace-normal text-white border border-purple-500/30 hover:bg-purple-800/30 transition"
                asChild
              >
                <Link to={item.path}>
                {item.icon}
                {item.title}
                </Link>
              </Button>
            ))}
            
            <hr className="col-span-full border-purple-500/30 my-2" />
            {isModerator ? <Button variant="ghost" onClick={() => navigate('/admin')}>Moderation Dashboard</Button> : null}
            
            {user ? <Button
              variant="ghost"
              className="flex justify-start items-center py-6 text-lg text-red-400 hover:bg-white/10 transition"
              onClick={handleLogout}
              disabled={signingOut}
            >
              <LogOut className="h-6 w-6 mr-4" />
              {signingOut ? 'Signing out…' : 'Sign Out'}
            </Button> : <Button variant="ghost" onClick={() => navigate('/login')}>Sign In</Button>}
          </nav>
          <LegalLinks />
          {signOutError && <p role="alert" className="mt-4 text-red-200">{signOutError}</p>}
        </div>
      </div>
    </main>
  );
};

export default Menu;
