import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

interface AuthGuardProps {
  children?: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  // For now, we allow access to all pages without authentication
  return children ? <>{children}</> : <Outlet />;
};