import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy components
const UserMenu = lazy(() => import('./UserMenu'));
const NotificationsPopover = lazy(() => import('./NotificationsPopover'));

export function MainNav() {
  const { user } = useAuth();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold">Lovable</span>
        </Link>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {user ? (
            <div className="flex items-center space-x-4">
              <Suspense fallback={<Skeleton className="h-9 w-9 rounded-full" />}>
                <NotificationsPopover />
              </Suspense>
              <Suspense fallback={<Skeleton className="h-9 w-9 rounded-full" />}>
                <UserMenu />
              </Suspense>
            </div>
          ) : (
            <Button asChild>
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}