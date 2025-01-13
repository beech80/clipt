import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Gamepad2 } from 'lucide-react';
import { toast } from 'sonner';
import { AuthError } from '@supabase/supabase-js';

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        navigate('/');
      }
      if (event === 'USER_UPDATED' && session?.user) {
        navigate('/');
      }
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      }
      if (event === 'AUTH_ERROR') {
        setError('Authentication error occurred. Please try again.');
        toast.error('Authentication error occurred. Please try again.');
      }
    });

    return () => subscription.unsubscribe();
  }, [user, navigate]);

  return (
    <div className="mx-auto max-w-md space-y-6 pt-12">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-lg bg-gaming-400/20 flex items-center justify-center animate-glow">
            <Gamepad2 className="h-6 w-6 text-gaming-400" />
          </div>
        </div>
        <h1 className="gaming-gradient text-4xl font-bold">GameShare</h1>
        <p className="text-muted-foreground">Connect with fellow gamers</p>
      </div>

      <div className="gaming-card">
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#8B5CF6',
                  brandAccent: '#7C3AED',
                }
              }
            }
          }}
          providers={[]}
          redirectTo={window.location.origin}
        />
      </div>
    </div>
  );
};

export default Login;