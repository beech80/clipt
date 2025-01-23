import { Routes, Route } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";

// Pages
import Home from "@/pages/Home";
import Profile from "@/pages/Profile";
import EditProfile from "@/pages/EditProfile";
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
import Achievements from "@/pages/Achievements";
import Analytics from "@/pages/Analytics";
import Support from "@/pages/Support";
import Verification from "@/pages/Verification";
import Schedule from "@/pages/Schedule";
import PaymentSuccess from "@/pages/payment-success";
import PaymentCancelled from "@/pages/payment-cancelled";
import ClipEditor from "@/pages/ClipEditor";
import GamePage from "@/pages/GamePage";
import Index from "@/pages/Index";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route element={<AuthGuard />}>
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/group-chat" element={<GroupChat />} />
        <Route path="/streaming" element={<Streaming />} />
        <Route path="/top-clips" element={<TopClips />} />
        <Route path="/clipts" element={<Clipts />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/post/:id" element={<Post />} />
        <Route path="/clip-editor/:id" element={<ClipEditor />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/support" element={<Support />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-cancelled" element={<PaymentCancelled />} />
        <Route path="/game/:slug" element={<GamePage />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="/resend-verification" element={<ResendVerification />} />
    </Routes>
  );
};

export default AppRoutes;