import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GameBoyControls from "@/components/GameBoyControls";
import { AuthGuard } from "@/components/AuthGuard";

// Lazy load route components
const Home = lazy(() => import('@/pages/Home'));
const ForYou = lazy(() => import('@/pages/ForYou'));
const Discover = lazy(() => import('@/pages/Discover'));
const Profile = lazy(() => import('@/pages/Profile'));
const Messages = lazy(() => import('@/pages/Messages'));
const Settings = lazy(() => import('@/pages/Settings'));
const Streaming = lazy(() => import('@/pages/Streaming'));
const Login = lazy(() => import('@/pages/Login'));
const EditProfile = lazy(() => import('@/pages/EditProfile'));

// Create a client
const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="space-y-3">
      <Skeleton className="h-[125px] w-[250px] rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<AuthGuard />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/for-you" element={<ForYou />} />
                  <Route path="/discover" element={<Discover />} />
                  <Route path="/profile/:username" element={<Profile />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/streaming" element={<Streaming />} />
                  <Route path="/edit-profile" element={<EditProfile />} />
                </Route>
              </Routes>
            </Suspense>
            <GameBoyControls />
            <Toaster />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;