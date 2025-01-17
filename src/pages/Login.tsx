import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Gamepad2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthError, AuthApiError } from '@supabase/supabase-js';

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        navigate('/');
      }
      if (event === 'USER_UPDATED' && session?.user) {
        navigate('/');
      }
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      }
      if (event === 'PASSWORD_RECOVERY') {
        setError('Please check your email to reset your password.');
      }
      // Handle authentication errors through the event listener
      if (event === 'USER_DELETED' as any) {
        setError('Your account has been deleted.');
      }
      if (event === 'INITIAL_SESSION') {
        const { error } = await supabase.auth.getSession();
        if (error) {
          handleAuthError(error);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      setError(null);
    };
  }, [user, navigate]);

  const handleAuthError = (error: AuthError) => {
    let errorMessage = 'An error occurred during authentication.';
    
    if (error instanceof AuthApiError) {
      switch (error.status) {
        case 400:
          if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password. Please check your credentials.';
          } else {
            errorMessage = 'Invalid request. Please check your input.';
          }
          break;
        case 422:
          errorMessage = 'Invalid email format. Please enter a valid email address.';
          break;
        case 429:
          errorMessage = 'Too many login attempts. Please try again later.';
          break;
        default:
          errorMessage = error.message;
      }
    }
    
    setError(errorMessage);
  };

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
        />
      </div>
    </div>
  );
};

export default Login;