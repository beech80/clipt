import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function DiscordCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code');

  useEffect(() => {
    const handleDiscordCallback = async () => {
      if (!code) {
        toast.error('No authorization code provided');
        navigate('/settings');
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('Not authenticated');
        }

        const { data, error } = await supabase.functions.invoke('discord-auth', {
          body: { code, action: 'token' },
          headers: { 'x-user-id': user.id }
        });

        if (error) throw error;

        toast.success('Successfully connected Discord account!');
        navigate('/settings');
      } catch (error) {
        console.error('Discord connection error:', error);
        toast.error('Failed to connect Discord account');
        navigate('/settings');
      }
    };

    handleDiscordCallback();
  }, [code, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Connecting Discord...</h2>
        <p className="text-muted-foreground">Please wait while we complete the connection.</p>
      </div>
    </div>
  );
}