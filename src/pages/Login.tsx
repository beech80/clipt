import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Gamepad2 } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
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
          onError={(error) => {
            toast.error(error.message);
          }}
        />
      </div>
    </div>
  );
};

export default Login;