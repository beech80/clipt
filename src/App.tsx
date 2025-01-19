import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { MainNav } from "@/components/MainNav";
import ErrorBoundary from "@/components/ErrorBoundary";
import Home from "@/pages/Home";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import NotificationsPage from "@/pages/Notifications";
import ActivityHistory from "@/pages/ActivityHistory";
import DraftsPage from "@/pages/Drafts";
import NotFound from "@/pages/NotFound";
import ErrorPage from "@/pages/ErrorPage";
import MaintenanceMode from "@/pages/MaintenanceMode";

const queryClient = new QueryClient();

const App = () => {
  // In a real app, you'd fetch this from an API or environment variable
  const isMaintenanceMode = false;

  if (isMaintenanceMode) {
    return <MaintenanceMode />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary fallback={<ErrorPage />}>
        <Router>
          <AuthProvider>
            <div className="min-h-screen bg-background">
              <MainNav />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/activity" element={<ActivityHistory />} />
                <Route path="/drafts" element={<DraftsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </div>
          </AuthProvider>
        </Router>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;