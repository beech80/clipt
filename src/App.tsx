import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { EmoteProvider } from "@/contexts/EmoteContext";
import { MessagesProvider } from "@/contexts/MessagesContext";
import { SecurityProvider } from "@/components/security/SecurityProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import GameBoyControls from "@/components/GameBoyControls";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SecurityProvider>
            <EmoteProvider>
              <MessagesProvider>
                <div className="min-h-screen w-full bg-gaming-900 text-white">
                  <RouterProvider router={router} />
                  <GameBoyControls />
                </div>
              </MessagesProvider>
            </EmoteProvider>
          </SecurityProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;