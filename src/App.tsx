import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import MainNav from "@/components/MainNav";
import Home from "@/pages/Home";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import NotificationsPage from "@/pages/Notifications";
import ActivityHistory from "@/pages/ActivityHistory";
import DraftsPage from "@/pages/Drafts";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
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
            </Routes>
            <Toaster />
          </div>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
