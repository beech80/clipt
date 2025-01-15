import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthGuard } from "./components/AuthGuard";
import { MainNav } from "./components/MainNav";
import GameBoyControls from "./components/GameBoyControls";
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
import React from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const App = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-[#1A1F2C] pb-48 md:pb-48 md:pt-16">
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <MainNav />
                <main className="container mx-auto px-4 py-4 retro-screen">
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                      path="/"
                      element={
                        <AuthGuard>
                          <Home />
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/discover"
                      element={
                        <AuthGuard>
                          <Discover />
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/for-you"
                      element={
                        <AuthGuard>
                          <ForYou />
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/clipts"
                      element={
                        <AuthGuard>
                          <Clipts />
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/messages"
                      element={
                        <AuthGuard>
                          <Messages />
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <AuthGuard>
                          <Profile />
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/profile/edit"
                      element={
                        <AuthGuard>
                          <EditProfile />
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/streaming"
                      element={
                        <AuthGuard>
                          <Streaming />
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/top-clips"
                      element={
                        <AuthGuard>
                          <TopClips />
                        </AuthGuard>
                      }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
                <GameBoyControls />
              </BrowserRouter>
            </div>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;