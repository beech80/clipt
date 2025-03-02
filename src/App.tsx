import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ReportDialogProvider } from '@/components/report/ReportDialogProvider';
import { MessagesProvider } from '@/contexts/MessagesContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { routes } from '@/config/routes';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt';
import GameBoyControllerUI from '@/components/GameBoyControllerUI';

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
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div>Loading...</div>}>
        <AuthProvider>
          <MessagesProvider>
            <ReportDialogProvider>
              <Toaster richColors position="top-center" />
              <AppContent />
              <PWAInstallPrompt />
              <GameBoyControllerUI />
            </ReportDialogProvider>
          </MessagesProvider>
        </AuthProvider>
      </React.Suspense>
    </ErrorBoundary>
  );
}

export default App;
