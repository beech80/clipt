import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { GlobalErrorBoundary } from "@/components/errors/GlobalErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { EmoteProvider } from "@/contexts/EmoteContext";
import Routes from "./Routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      meta: {
        onError: (error: Error) => {
          console.error('Query error:', error);
        }
      }
    },
    mutations: {
      retry: 1,
      meta: {
        onError: (error: Error) => {
          console.error('Mutation error:', error);
        }
      }
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <EmoteProvider>
              <Routes />
              <Toaster />
            </EmoteProvider>
          </AuthProvider>
        </BrowserRouter>
      </GlobalErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;