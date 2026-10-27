
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please login to access this page', { id: 'clipt-auth-required' });
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div role="status" className="flex min-h-[calc(100dvh-160px-env(safe-area-inset-bottom))] items-center justify-center gap-3">
        <div aria-hidden="true" className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
        <span>Checking your session…</span>
      </div>
    );
  }

  return user ? <>{children}</> : null;
};
