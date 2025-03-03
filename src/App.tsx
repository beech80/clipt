import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ReportDialogProvider } from '@/components/report/ReportDialogProvider';
import { MessagesProvider } from '@/contexts/MessagesContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { routes } from '@/config/routes';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt';
import GameBoyControls from '@/components/GameBoyControls';

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
  
  // Extract post ID from URL if on a post page
  useEffect(() => {
    const match = location.pathname.match(/\/post\/([^/?#]+)/);
    if (match && match[1]) {
      setCurrentPostId(match[1]);
    } else {
      setCurrentPostId(undefined);
    }
  }, [location.pathname]);

  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div>Loading...</div>}>
        <AuthProvider>
          <MessagesProvider>
            <ReportDialogProvider>
              <Toaster richColors position="top-center" />
              <AppContent />
              <PWAInstallPrompt />
              <GameBoyControls currentPostId={currentPostId} />
            </ReportDialogProvider>
          </MessagesProvider>
        </AuthProvider>
      </React.Suspense>
    </ErrorBoundary>
  );
}

export default App;
