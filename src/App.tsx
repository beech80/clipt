import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ReportDialogProvider } from '@/components/report/ReportDialogProvider';
import { MessagesProvider } from '@/contexts/MessagesContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { CommentsProvider } from '@/contexts/CommentContext';
import { routes } from '@/config/routes';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { useQueryClient } from '@tanstack/react-query';
import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt';
import GameBoyControls from '@/components/GameBoyControls';
import ScrollToTop from './components/common/ScrollToTop';
import '@/index.css';
import '@/styles/animations.css';

function AppContent() {
  usePerformanceMonitoring('App');
  
  return (
    <Routes>
      {routes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={route.element}
        />
      ))}
    </Routes>
  );
}

function App() {
  const location = useLocation();
  const [currentPostId, setCurrentPostId] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient(); 
  
  // Extract post ID from URL if on a post page
  useEffect(() => {
    const match = location.pathname.match(/\/post\/([^/?#]+)/);
    let newPostId = undefined;
    
    if (match && match[1] && match[1] !== 'undefined' && match[1] !== 'null') {
      newPostId = match[1];
    }
    
    console.log("App detected post ID:", {
      pathname: location.pathname,
      extractedId: match?.[1] || 'none',
      settingId: newPostId
    });
    
    setCurrentPostId(newPostId);
    
    // Clear the cache when navigation occurs
    // This forces components to re-fetch fresh data
    if (location.pathname.startsWith('/profile/') || 
        location.pathname.startsWith('/game/')) {
      console.log("Clearing query cache for navigation:", location.pathname);
      queryClient.clear();
    }
  }, [location.pathname, queryClient]);

  // Routes that should not display the GameBoyControls
  const noControlsRoutes = ['/auth'];
  const shouldShowControls = !noControlsRoutes.some(route => 
    location.pathname.startsWith(route)
  );

  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div>Loading...</div>}>
        <AuthProvider>
          <MessagesProvider>
            <ReportDialogProvider>
              <CommentsProvider>
                <Toaster richColors position="top-center" />
                <ScrollToTop />
                <div className="app-content-wrapper" style={{ paddingBottom: '250px', minHeight: '100vh' }}>
                  <AppContent />
                </div>
                <PWAInstallPrompt />
                {shouldShowControls && <GameBoyControls currentPostId={currentPostId} />}
              </CommentsProvider>
            </ReportDialogProvider>
          </MessagesProvider>
        </AuthProvider>
      </React.Suspense>
    </ErrorBoundary>
  );
}

export default App;
