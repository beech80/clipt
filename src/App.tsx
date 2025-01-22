import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { ReportDialogProvider } from "@/components/report/ReportDialogProvider";
import { MessagesProvider } from "@/contexts/MessagesContext";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { SecurityProvider } from "@/components/security/SecurityProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import GameBoyControls from "@/components/GameBoyControls";
import { BrowserRouter, RouterProvider } from "react-router-dom";
import { router } from "./routes";

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
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <SecurityProvider>
              <AccessibilityProvider>
                <MessagesProvider>
                  <ReportDialogProvider>
                    <RouterProvider router={router} />
                    <GameBoyControls />
                    <Toaster />
                  </ReportDialogProvider>
                </MessagesProvider>
              </AccessibilityProvider>
            </SecurityProvider>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;