import { Routes as RouterRoutes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Profile from "@/pages/Profile";
import Messages from "@/pages/Messages";
import Settings from "@/pages/Settings";
import Streaming from "@/pages/Streaming";
import Discover from "@/pages/Discover";
import ForYou from "@/pages/ForYou";
import TopClips from "@/pages/TopClips";
import EditProfile from "@/pages/EditProfile";
import Login from "@/pages/Login";

const Routes = () => {
  return (
    <RouterRoutes>
      <Route path="/" element={<Home />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/streaming" element={<Streaming />} />
      <Route path="/discover" element={<Discover />} />
      <Route path="/for-you" element={<ForYou />} />
      <Route path="/top-clips" element={<TopClips />} />
      <Route path="/edit-profile" element={<EditProfile />} />
      <Route path="/login" element={<Login />} />
    </RouterRoutes>
  );
};

export default Routes;