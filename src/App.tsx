import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ReportDialogProvider } from '@/components/report/ReportDialogProvider';
import { MessagesProvider } from '@/contexts/MessagesContext';
import { routes } from '@/config/routes';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

function App() {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div>Loading...</div>}>
        <ReportDialogProvider>
          <MessagesProvider>
            <SidebarProvider>
              <div className="min-h-screen bg-background flex">
                <AppSidebar />
                <main className="flex-1">
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
            </SidebarProvider>
            <Toaster position="top-center" />
          </MessagesProvider>
        </ReportDialogProvider>
      </React.Suspense>
    </ErrorBoundary>
  );
}

export default App;