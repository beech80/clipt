import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "@/pages/Home";
import Profile from "@/pages/Profile";
import Messages from "@/pages/Messages";
import Streaming from "@/pages/Streaming";
import TopClips from "@/pages/TopClips";
import Clipts from "@/pages/Clipts";
import Settings from "@/pages/Settings";
import Discover from "@/pages/Discover";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import UpdatePassword from "@/pages/UpdatePassword";
import Collections from "@/pages/Collections";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/streaming" element={<Streaming />} />
            <Route path="/top-clips" element={<TopClips />} />
            <Route path="/clipts" element={<Clipts />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/collections" element={<Collections />} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;