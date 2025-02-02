import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ReportDialogProvider } from '@/components/report/ReportDialogProvider';
import { MessagesProvider } from '@/contexts/MessagesContext';
import { routes } from '@/config/routes';
import { MainNav } from '@/components/MainNav';

function App() {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div>Loading...</div>}>
        <ReportDialogProvider>
          <MessagesProvider>
            <div className="min-h-screen bg-background">
              <header className="border-b">
                <div className="container mx-auto p-4">
                  <MainNav />
                </div>
              </header>
              <main>
                <Routes>
                  {routes.map((route) => (
                    <Route
                      key={route.path}
                      path={route.path}
                      element={route.element}
                    />
                  ))}
                </Routes>
              </main>
            </div>
            <Toaster position="top-center" />
          </MessagesProvider>
        </ReportDialogProvider>
      </React.Suspense>
    </ErrorBoundary>
  );
}

export default App;