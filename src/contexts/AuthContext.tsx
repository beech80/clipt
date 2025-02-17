
import React from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
}

interface AuthState {
  user: User | null;
  loading: boolean;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export class AuthProvider extends React.Component<{ children: React.ReactNode }, AuthState> {
  private subscription: { unsubscribe: () => void } | null = null;

  state = {
    user: null,
    loading: true
  };

  async componentDidMount() {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    this.setState({ 
      user: session?.user ?? null,
      loading: false 
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      this.setState({ 
        user: session?.user ?? null,
        loading: false 
      });
    });

    this.subscription = subscription;
  }

  componentWillUnmount() {
    this.subscription?.unsubscribe();
  }

  signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success('Successfully signed in!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Successfully signed out!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success('Password reset instructions sent to your email!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  resendVerificationEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      if (error) throw error;
      toast.success('Verification email resent!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  render() {
    const value = {
      user: this.state.user,
      loading: this.state.loading,
      signIn: this.signIn,
      signUp: this.signUp,
      signOut: this.signOut,
      resetPassword: this.resetPassword,
      resendVerificationEmail: this.resendVerificationEmail,
    };

    return (
      <AuthContext.Provider value={value}>
        {this.props.children}
      </AuthContext.Provider>
    );
  }
}

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
