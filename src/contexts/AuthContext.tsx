import * as React from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ requiresEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
}

// Create context with an initial value to prevent null errors
const AuthContext = React.createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => { throw new Error('Authentication provider unavailable'); },
  signOut: async () => {},
  resetPassword: async () => {},
  resendVerificationEmail: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    let mounted = true;
    let authRevision = 0;
    let previousUserId: string | null = null;
    const acceptSession = (nextUser: User | null) => {
      if (!mounted) return;
      if (previousUserId !== (nextUser?.id ?? null)) {
        queryClient.clear();
        previousUserId = nextUser?.id ?? null;
      }
      setUser(nextUser);
      setLoading(false);
    };

    // Get initial session
    const getInitialSession = async () => {
      const revision = authRevision;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && revision === authRevision) {
          acceptSession(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted && revision === authRevision) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        authRevision += 1;
        acceptSession(session?.user ?? null);
        // Retry caller-scoped reads after the provider upgrades this session.
        // This event is not an authorization substitute; RLS still decides.
        if (event === 'MFA_CHALLENGE_VERIFIED') void queryClient.invalidateQueries();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned from sign in');

      // The existing database Auth trigger owns profile initialization.
      // Signing in must not manufacture profile data or perform an upsert.
      
      toast.success('Successfully signed in!');
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error(error instanceof Error ? error.message : 'Authentication request failed.');
      throw error;
    }
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: metadata
        },
      });

      if (error) throw error;
      if (data.user?.identities?.length === 0) {
        throw new Error('Account already exists');
      }

      if (!data.user) throw new Error('No user returned from signup');
      return { requiresEmailConfirmation: !data.session };
    } catch (error) {
      console.error('Sign up error:', error);
      toast.error(error instanceof Error ? error.message : 'Authentication request failed.');
      throw error;
    }
  };

  const signOut = React.useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      queryClient.clear();
      toast.success('Successfully signed out!');
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error(error instanceof Error ? error.message : 'Authentication request failed.');
      throw error;
    }
  }, [queryClient]);

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      toast.success('If an account exists, a reset link has been requested. Check your inbox.');
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error instanceof Error ? error.message : 'Authentication request failed.');
      throw error;
    }
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: `${window.location.origin}/login` },
      });
      if (error) throw error;
      toast.success('Verification request accepted. Check your inbox; delivery is not yet verified.');
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.error(error instanceof Error ? error.message : 'Authentication request failed.');
      throw error;
    }
  };

  const value = React.useMemo(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      resendVerificationEmail,
    }),
    [user, loading, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return React.useContext(AuthContext);
};
