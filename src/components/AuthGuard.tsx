import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  // Allow access to all pages without authentication
  return <>{children}</>;
};