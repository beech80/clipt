import { RouteObject } from "react-router-dom";

// Pages
import Home from "@/pages/Home";
import Profile from "@/pages/Profile";
import EditProfile from "@/pages/EditProfile";
import Messages from "@/pages/Messages";
import Streaming from "@/pages/Streaming";
import Broadcasting from "@/pages/Broadcasting";
import Esports from "@/pages/Esports";
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
import Subscription from "@/pages/Subscription";

// Documentation Pages
import { DocsLayout } from "@/components/docs/DocsLayout";
import GettingStarted from "@/pages/docs/GettingStarted";
import StreamingGuide from "@/pages/docs/StreamingGuide";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Index />
  },
  {
    path: "/home",
    element: <Home />
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/reset-password",
    element: <ResetPassword />
  },
  {
    path: "/update-password",
    element: <UpdatePassword />
  },
  {
    path: "/resend-verification",
    element: <ResendVerification />
  },
  {
    path: "/profile",
    element: <Profile />
  },
  {
    path: "/profile/edit",
    element: <EditProfile />
  },
  {
    path: "/messages",
    element: <Messages />
  },
  {
    path: "/group-chat",
    element: <GroupChat />
  },
  {
    path: "/streaming",
    element: <Streaming />
  },
  {
    path: "/broadcasting",
    element: <Broadcasting />
  },
  {
    path: "/esports",
    element: <Esports />
  },
  {
    path: "/top-clips",
    element: <TopClips />
  },
  {
    path: "/clipts",
    element: <Clipts />
  },
  {
    path: "/settings",
    element: <Settings />
  },
  {
    path: "/discover",
    element: <Discover />
  },
  {
    path: "/collections",
    element: <Collections />
  },
  {
    path: "/post/:id",
    element: <Post />
  },
  {
    path: "/clip-editor/:id",
    element: <ClipEditor />
  },
  {
    path: "/onboarding",
    element: <Onboarding />
  },
  {
    path: "/achievements",
    element: <Achievements />
  },
  {
    path: "/analytics",
    element: <Analytics />
  },
  {
    path: "/support",
    element: <Support />
  },
  {
    path: "/verification",
    element: <Verification />
  },
  {
    path: "/schedule",
    element: <Schedule />
  },
  {
    path: "/payment-success",
    element: <PaymentSuccess />
  },
  {
    path: "/payment-cancelled",
    element: <PaymentCancelled />
  },
  {
    path: "/game/:slug",
    element: <GamePage />
  },
  {
    path: "/subscription",
    element: <Subscription />
  },
  {
    path: "/docs",
    element: <DocsLayout><Outlet /></DocsLayout>,
    children: [
      {
        path: "getting-started",
        element: <GettingStarted />
      },
      {
        path: "streaming",
        element: <StreamingGuide />
      }
    ]
  }
];