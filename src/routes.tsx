import { createBrowserRouter, Outlet } from "react-router-dom";
import { SecurityProvider } from "@/components/security/SecurityProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { EmoteProvider } from "@/contexts/EmoteContext";
import { MessagesProvider } from "@/contexts/MessagesContext";
import GameBoyControls from "@/components/GameBoyControls";

import Home from "@/pages/Home";
import Clips from "@/pages/Clips";
import Settings from "@/pages/Settings";
import TopClips from "@/pages/TopClips";
import Messages from "@/pages/Messages";
import Profile from "@/pages/Profile";
import Search from "@/pages/Search";
import Notifications from "@/pages/Notifications";
import Onboarding from "@/pages/Onboarding";
import Stream from "@/pages/Stream";
import Tournament from "@/pages/Tournament";
import Squad from "@/pages/Squad";
import Analytics from "@/pages/Analytics";
import Comments from "@/pages/Comments";
import Hashtag from "@/pages/Hashtag";

const RootLayout = () => {
  return (
    <SecurityProvider>
      <AuthProvider>
        <EmoteProvider>
          <MessagesProvider>
            <div className="min-h-screen w-full bg-gaming-900 text-white">
              <Outlet />
              <GameBoyControls />
            </div>
          </MessagesProvider>
        </EmoteProvider>
      </AuthProvider>
    </SecurityProvider>
  );
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "clips",
        element: <Clips />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "top-clips",
        element: <TopClips />,
      },
      {
        path: "messages",
        element: <Messages />,
      },
      {
        path: "profile/:username",
        element: <Profile />,
      },
      {
        path: "search",
        element: <Search />,
      },
      {
        path: "notifications",
        element: <Notifications />,
      },
      {
        path: "onboarding",
        element: <Onboarding />,
      },
      {
        path: "stream/:streamId",
        element: <Stream />,
      },
      {
        path: "tournament/:tournamentId",
        element: <Tournament />,
      },
      {
        path: "squad/:squadId",
        element: <Squad />,
      },
      {
        path: "analytics",
        element: <Analytics />,
      },
      {
        path: "comments/:postId",
        element: <Comments />,
      },
      {
        path: "hashtag/:tag",
        element: <Hashtag />,
      }
    ],
  },
]);