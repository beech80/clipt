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
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;