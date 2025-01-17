import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { KeyboardShortcutsProvider } from "@/components/KeyboardShortcutsProvider";
import { Toaster } from "@/components/ui/toaster";
import { MainNav } from "@/components/MainNav";
import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Profile from "@/pages/Profile";
import EditProfile from "@/pages/EditProfile";
import Settings from "@/pages/Settings";
import Messages from "@/pages/Messages";
import Stream from "@/pages/Stream";
import Explore from "@/pages/Explore";
import Following from "@/pages/Following";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <KeyboardShortcutsProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-background text-foreground">
                <MainNav />
                <main className="container mx-auto px-4 py-8">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/edit" element={<EditProfile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/stream" element={<Stream />} />
                    <Route path="/explore" element={<Explore />} />
                    <Route path="/following" element={<Following />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
              <Toaster />
            </BrowserRouter>
          </KeyboardShortcutsProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;