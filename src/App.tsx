import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { ReportDialogProvider } from "@/components/report/ReportDialogProvider";
import { MessagesProvider } from "@/contexts/MessagesContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import AppRoutes from "./AppRoutes";

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
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <Router>
          <ErrorBoundary>
            <AuthProvider>
              <MessagesProvider>
                <ReportDialogProvider>
                  <AppRoutes />
                  <Toaster />
                </ReportDialogProvider>
              </MessagesProvider>
            </AuthProvider>
          </ErrorBoundary>
        </Router>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

export default App;