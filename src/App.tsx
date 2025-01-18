import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { ReportDialogProvider } from "@/components/report/ReportDialogProvider";
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
import ResendVerification from "@/pages/ResendVerification";
import Collections from "@/pages/Collections";
import Post from "@/pages/Post";
import GroupChat from "@/pages/GroupChat";
import Onboarding from "@/pages/Onboarding";
import Connections from "@/pages/Connections";
import Achievements from "@/pages/Achievements";
import Analytics from "@/pages/Analytics";
import Support from "@/pages/Support";

const queryClient = new QueryClient();

function App() {
  return (
    <React.StrictMode>
      <Router>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route path="/resend-verification" element={<ResendVerification />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/group-chat" element={<GroupChat />} />
              <Route path="/streaming" element={<Streaming />} />
              <Route path="/top-clips" element={<TopClips />} />
              <Route path="/clipts" element={<Clipts />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/post/:id" element={<Post />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/connections" element={<Connections />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/support" element={<Support />} />
            </Routes>
            <ReportDialogProvider />
            <Toaster />
          </AuthProvider>
        </QueryClientProvider>
      </Router>
    </React.StrictMode>
  );
}

export default App;