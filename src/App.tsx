import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { MessagesProvider } from "./contexts/MessagesContext";
import { EmoteProvider } from "./contexts/EmoteContext";
import { ReportDialogProvider } from "./components/report/ReportDialogProvider";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Discover from "./pages/Discover";
import Streaming from "./pages/Streaming";
import EditProfile from "./pages/EditProfile";
import Settings from "./pages/Settings";
import Clips from "./pages/Clips";
import TopClips from "./pages/TopClips";
import ModReports from "./pages/ModReports";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MessagesProvider>
          <EmoteProvider>
            <Router>
              <ReportDialogProvider />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/profile/:username" element={<Profile />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/streaming" element={<Streaming />} />
                <Route path="/edit-profile" element={<EditProfile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/clips" element={<Clips />} />
                <Route path="/top-clips" element={<TopClips />} />
                <Route path="/mod/reports" element={<ModReports />} />
              </Routes>
              <Toaster />
            </Router>
          </EmoteProvider>
        </MessagesProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;