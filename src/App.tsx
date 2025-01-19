import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { MainNav } from "@/components/MainNav";
import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Post from "@/pages/Post";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Index from "@/pages/Index";
import React from "react";

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <MainNav />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/home" element={<Home />} />
              <Route path="/post/:id" element={<Post />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;