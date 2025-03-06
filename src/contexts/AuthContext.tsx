import * as React from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: { [key: string]: any }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
}

// Create context with an initial value to prevent null errors
const AuthContext = React.createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  resendVerificationEmail: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned from sign in');

      // Create profile if it doesn't exist
      await ensureUserProfile(data.user);
      
      toast.success('Successfully signed in!');
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, metadata?: { [key: string]: any }) => {
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

      toast.success('Account created successfully! Please check your email to verify your account.');
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Successfully signed out!');
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error(error.message);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) throw error;
      toast.success('Password reset instructions sent to your email!');
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.message);
      throw error;
    }
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });
      if (error) throw error;
      toast.success('Verification email resent!');
    } catch (error: any) {
      console.error('Resend verification error:', error);
      toast.error(error.message);
      throw error;
    }
  };

  // Helper function to ensure a user profile exists
  const ensureUserProfile = async (user: User) => {
    if (!user) return;
    
    try {
      // Check if profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (profileError || !existingProfile) {
        console.log('Creating new profile for user:', user.id);
        
        // Default username from email or a random one
        const username = user.email 
          ? user.email.split('@')[0] 
          : `user_${Math.random().toString(36).substring(2, 10)}`;
        
        // Create a new profile
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username,
            display_name: user.user_metadata?.name || username,
            bio: 'Welcome to my Clipt profile!',
            avatar_url: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`,
            followers: 0,
            following: 0,
            achievements: 0,
            created_at: new Date().toISOString()
          });
          
        if (createError) {
          console.error('Error creating profile:', createError);
        } else {
          // Create default achievements for the new user
          try {
            const { achievementService } = await import('@/services/achievementService');
            await achievementService.createDefaultAchievementsForUser(user.id);
          } catch (err) {
            console.error('Error creating default achievements:', err);
          }
        }
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
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
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return React.useContext(AuthContext);
};
