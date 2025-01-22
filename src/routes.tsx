import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import { Loader2 } from "lucide-react";
import { AuthProvider } from "@/contexts/AuthContext";
import { EmoteProvider } from "@/contexts/EmoteContext";
import { MessagesProvider } from "@/contexts/MessagesContext";
import { SecurityProvider } from "@/components/security/SecurityProvider";
import GameBoyControls from "@/components/GameBoyControls";

// Enhanced loading component with proper ARIA labels
const PageLoader = () => (
  <div 
    className="flex items-center justify-center min-h-screen"
    role="progressbar"
    aria-label="Loading page content"
    aria-busy="true"
  >
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
    <span className="sr-only">Loading page content...</span>
  </div>
);

// Root layout component that provides context
const RootLayout = () => {
  return (
    <SecurityProvider>
      <AuthProvider>
        <EmoteProvider>
          <MessagesProvider>
            <div className="min-h-screen w-full bg-gaming-900 text-white">
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
              <GameBoyControls />
            </div>
          </MessagesProvider>
        </EmoteProvider>
      </AuthProvider>
    </SecurityProvider>
  );
};

// Lazy load route components with error boundaries
const lazyLoad = (Component: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

// Lazy loaded components with descriptive chunk names
const Home = lazy(() => import('./pages/Home' /* webpackChunkName: "home" */));
const Post = lazy(() => import('./pages/Post' /* webpackChunkName: "post" */));
const Profile = lazy(() => import('./pages/Profile' /* webpackChunkName: "profile" */));
const EditProfile = lazy(() => import('./pages/EditProfile' /* webpackChunkName: "edit-profile" */));
const Settings = lazy(() => import('./pages/Settings' /* webpackChunkName: "settings" */));
const Clips = lazy(() => import('./pages/Clips' /* webpackChunkName: "clips" */));
const ClipEditor = lazy(() => import('./pages/ClipEditor' /* webpackChunkName: "clip-editor" */));
const GamePage = lazy(() => import('./pages/GamePage' /* webpackChunkName: "game" */));
const Messages = lazy(() => import('./pages/Messages' /* webpackChunkName: "messages" */));
const Collections = lazy(() => import('./pages/Collections' /* webpackChunkName: "collections" */));
const Discover = lazy(() => import('./pages/Discover' /* webpackChunkName: "discover" */));
const Analytics = lazy(() => import('./pages/Analytics' /* webpackChunkName: "analytics" */));
const Achievements = lazy(() => import('./pages/Achievements' /* webpackChunkName: "achievements" */));
const ModReports = lazy(() => import('./pages/ModReports' /* webpackChunkName: "mod-reports" */));
const GroupChat = lazy(() => import('./pages/GroupChat' /* webpackChunkName: "group-chat" */));
const Onboarding = lazy(() => import('./pages/Onboarding' /* webpackChunkName: "onboarding" */));
const Login = lazy(() => import('./pages/Login' /* webpackChunkName: "login" */));
const Support = lazy(() => import('./pages/Support' /* webpackChunkName: "support" */));
const Schedule = lazy(() => import('./pages/Schedule' /* webpackChunkName: "schedule" */));
const Streaming = lazy(() => import('./pages/Streaming' /* webpackChunkName: "streaming" */));
const TopClips = lazy(() => import('./pages/TopClips' /* webpackChunkName: "top-clips" */));

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: lazyLoad(Home),
      },
      {
        path: "/post/:id",
        element: lazyLoad(Post),
      },
      {
        path: "/profile/:username",
        element: lazyLoad(Profile),
      },
      {
        path: "/edit-profile",
        element: lazyLoad(EditProfile),
      },
      {
        path: "/settings",
        element: lazyLoad(Settings),
      },
      {
        path: "/clips",
        element: lazyLoad(Clips),
      },
      {
        path: "/clip-editor/:id",
        element: lazyLoad(ClipEditor),
      },
      {
        path: "/game/:slug",
        element: lazyLoad(GamePage),
      },
      {
        path: "/messages",
        element: lazyLoad(Messages),
      },
      {
        path: "/collections",
        element: lazyLoad(Collections),
      },
      {
        path: "/discover",
        element: lazyLoad(Discover),
      },
      {
        path: "/analytics",
        element: lazyLoad(Analytics),
      },
      {
        path: "/achievements",
        element: lazyLoad(Achievements),
      },
      {
        path: "/mod-reports",
        element: lazyLoad(ModReports),
      },
      {
        path: "/group-chat",
        element: lazyLoad(GroupChat),
      },
      {
        path: "/onboarding",
        element: lazyLoad(Onboarding),
      },
      {
        path: "/login",
        element: lazyLoad(Login),
      },
      {
        path: "/support",
        element: lazyLoad(Support),
      },
      {
        path: "/schedule",
        element: lazyLoad(Schedule),
      },
      {
        path: "/streaming",
        element: lazyLoad(Streaming),
      },
      {
        path: "/top-clips",
        element: lazyLoad(TopClips),
      }
    ]
  }
]);