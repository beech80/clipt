import { ReactNode, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AuthGuardProps {
  children?: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Temporarily commenting out the auth redirect
  /*
  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please sign in to access this page');
      navigate('/login');
    }
  }, [user, loading, navigate]);
  */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  // Temporarily removed the user check
  return children ? <>{children}</> : <Outlet />;
};