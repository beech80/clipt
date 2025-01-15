import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { MessagesProvider } from "./contexts/MessagesContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Camera } from "lucide-react";
import React, { useEffect, useState } from 'react';
import { useSheetState } from "./hooks/use-sheet-state";
import Home from "./pages/Home";
import Discover from "./pages/Discover";
import ForYou from "./pages/ForYou";
import Clipts from "./pages/Clipts";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Login from "./pages/Login";
import Streaming from "./pages/Streaming";
import TopClips from "./pages/TopClips";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const { setSheetOpen } = useSheetState();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSheetOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [setSheetOpen]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MessagesProvider>
          <Router>
            <div className="min-h-screen">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/for-you" element={<ForYou />} />
                <Route path="/clipts" element={<Clipts />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/edit-profile" element={<EditProfile />} />
                <Route path="/login" element={<Login />} />
                <Route path="/streaming" element={<Streaming />} />
                <Route path="/top-clips" element={<TopClips />} />
              </Routes>

              <button
                onClick={() => setIsRecording(!isRecording)}
                className="clip-button fixed bottom-24 right-6 z-50 group"
              >
                <div className="clip-button-icon">
                  <Camera 
                    className={`w-8 h-8 transition-transform duration-300 ${
                      isRecording ? 'text-red-500 scale-110' : 'text-white'
                    }`}
                    strokeWidth={2.5}
                  />
                </div>
                <div className={`absolute inset-0 rounded-full ${
                  isRecording ? 'animate-pulse bg-red-500/20' : ''
                }`} />
              </button>

              <Toaster position="top-center" />
            </div>
          </Router>
        </MessagesProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;