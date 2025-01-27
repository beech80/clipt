import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ReportDialogProvider } from '@/hooks/use-report-dialog';
import { routes } from '@/config/routes';

function App() {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div>Loading...</div>}>
        <ReportDialogProvider>
          <Routes>
            {routes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={route.element}
              />
            ))}
          </Routes>
          <Toaster position="top-center" />
        </ReportDialogProvider>
      </React.Suspense>
    </ErrorBoundary>
  );
}

export default App;