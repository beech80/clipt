import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthGuard } from "@/components/AuthGuard";
import { MainNav } from "@/components/MainNav";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Messages from "@/pages/Messages";
import Profile from "@/pages/Profile";
import Discover from "@/pages/Discover";
import TopClips from "@/pages/TopClips";
import Streaming from "@/pages/Streaming";

function App() {
  return (
    <Router>
      <MainNav />
      <Toaster />
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
          path="/messages"
          element={
            <AuthGuard>
              <Messages />
            </AuthGuard>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <AuthGuard>
              <Profile />
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
          path="/top-clips"
          element={
            <AuthGuard>
              <TopClips />
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
      </Routes>
    </Router>
  );
}

export default App;