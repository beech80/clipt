import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ReportDialogProvider } from '@/components/report/ReportDialogProvider';
import { Toaster } from 'sonner';
import { Routes, Route } from 'react-router-dom';
import { routes } from '@/config/routes';
import ErrorBoundary from '@/components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <AuthProvider>
            <React.Suspense fallback={<div>Loading...</div>}>
              <ReportDialogProvider>
                <Routes>
                  {routes.map((route) => (
                    <Route
                      key={route.path}
                      path={route.path}
                      element={route.element}
                    >
                      {route.children?.map((childRoute) => (
                        <Route
                          key={childRoute.path}
                          path={childRoute.path}
                          element={childRoute.element}
                        />
                      ))}
                    </Route>
                  ))}
                </Routes>
                <Toaster position="top-center" />
              </ReportDialogProvider>
            </React.Suspense>
          </AuthProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;