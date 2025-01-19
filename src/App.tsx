import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { MainNav } from "@/components/MainNav";
import Home from "@/pages/Home";
import Post from "@/pages/Post";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Index from "@/pages/Index";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary fallback={
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-center text-muted-foreground">
            Something went wrong. Please refresh the page.
          </p>
        </div>
      }>
        <AuthProvider>
          <LanguageProvider>
            <BrowserRouter>
              <MainNav />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/home" element={<Home />} />
                <Route path="/post/:id" element={<Post />} />
                <Route path="/profile/:username" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </BrowserRouter>
            <Toaster />
          </LanguageProvider>
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;