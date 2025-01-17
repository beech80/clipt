import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "@/pages/Home";
import ExplorePage from "@/pages/Explore";
import PostListPage from "@/pages/PostListPage";
import Discover from "@/pages/Discover";
import Collections from "@/pages/Collections";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/posts" element={<PostListPage />} />
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