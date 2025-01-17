import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { AuthGuard } from "@/components/AuthGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthProvider } from "@/contexts/AuthContext";

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

// Loading fallback component
const PageLoader = () => (
  <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center p-4">
    <div className="space-y-4 w-full max-w-3xl">
      <Skeleton className="h-12 w-[250px]" />
      <Skeleton className="h-[200px] w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[80%]" />
        <Skeleton className="h-4 w-[60%]" />
      </div>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
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
          <Toaster />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
