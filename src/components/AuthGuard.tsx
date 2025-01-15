import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const path = window.location.pathname;

  useEffect(() => {
    // Allow access to streaming routes without authentication
    if (path.startsWith('/streaming')) {
      return;
    }

    // Require authentication for other routes
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate, path]);

  return <>{children}</>;
};