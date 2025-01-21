import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Gamepad2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthError, AuthApiError } from '@supabase/supabase-js';
import { useAuthSecurity } from '@/hooks/useAuthSecurity';

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { checkIPStatus, recordAuthAttempt, is2FAEnabled } = useAuthSecurity();

  useEffect(() => {
    if (user) {
      navigate('/');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        // Record successful login attempt
        const ip = await fetch('https://api.ipify.org?format=json')
          .then(res => res.json())
          .then(data => data.ip);
        await recordAuthAttempt(ip, session?.user?.email || '', true);
        navigate('/');
      }
      if (event === 'USER_UPDATED' && session?.user) {
        navigate('/');
      }
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      }
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/update-password');
      }
      if (event === 'USER_DELETED') {
        setError('Your account has been deleted.');
      }
    });

    // Check IP status on component mount
    const checkIP = async () => {
      const ip = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip);
      
      const isRestricted = await checkIPStatus(ip);
      if (isRestricted) {
        setError('Too many login attempts. Please try again later.');
      }
    };
    
    checkIP();

    return () => {
      subscription.unsubscribe();
      setError(null);
    };
  }, [user, navigate, checkIPStatus, recordAuthAttempt]);

  return (
    <div className="mx-auto max-w-md space-y-6 pt-12">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-lg bg-gaming-400/20 flex items-center justify-center">
            <Gamepad2 className="h-6 w-6 text-gaming-400" />
          </div>
        </div>
        <h1 className="text-4xl font-bold">Clip</h1>
        <p className="text-muted-foreground">Share your gaming moments</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-card rounded-lg p-4 shadow-sm">
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
          showLinks={true}
          view="sign_in"
        />
        <div className="mt-4 text-center space-y-2">
          <Link to="/reset-password" className="text-sm text-primary hover:underline block">
            Forgot your password?
          </Link>
          <Link to="/resend-verification" className="text-sm text-primary hover:underline block">
            Resend verification email
          </Link>
          {is2FAEnabled && (
            <div className="text-sm text-muted-foreground">
              Two-factor authentication is enabled for your account
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;