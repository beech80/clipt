import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { EmoteProvider } from "@/contexts/EmoteContext";
import { MessagesProvider } from "@/contexts/MessagesContext";
import { SecurityProvider } from "@/components/security/SecurityProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import GameBoyControls from "@/components/GameBoyControls";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { router } from "./routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Create a router instance
const browserRouter = createBrowserRouter(router);

// Create an AppContent component to wrap providers that need router context
function AppContent() {
  return (
    <AuthProvider>
      <SecurityProvider>
        <EmoteProvider>
          <MessagesProvider>
            <div className="min-h-screen w-full bg-gaming-900 text-white">
              <RouterProvider router={browserRouter} />
              <GameBoyControls />
            </div>
          </MessagesProvider>
        </EmoteProvider>
      </SecurityProvider>
    </AuthProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;