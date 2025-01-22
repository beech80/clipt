import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Loader2 } from "lucide-react";

// Lazy load route components
const Home = lazy(() => import('./pages/Home'));
const Post = lazy(() => import('./pages/Post'));
const Profile = lazy(() => import('./pages/Profile'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Settings = lazy(() => import('./pages/Settings'));
const Clips = lazy(() => import('./pages/Clips'));
const GamePage = lazy(() => import('./pages/GamePage'));
const Messages = lazy(() => import('./pages/Messages'));
const Collections = lazy(() => import('./pages/Collections'));
const Discover = lazy(() => import('./pages/Discover'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="w-8 h-8 animate-spin" />
  </div>
);

// Wrap components with Suspense
const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: withSuspense(Home),
  },
  {
    path: "/post/:id",
    element: withSuspense(Post),
  },
  {
    path: "/profile/:username",
    element: withSuspense(Profile),
  },
  {
    path: "/edit-profile",
    element: withSuspense(EditProfile),
  },
  {
    path: "/settings",
    element: withSuspense(Settings),
  },
  {
    path: "/clips",
    element: withSuspense(Clips),
  },
  {
    path: "/game/:slug",
    element: withSuspense(GamePage),
  },
  {
    path: "/messages",
    element: withSuspense(Messages),
  },
  {
    path: "/collections",
    element: withSuspense(Collections),
  },
  {
    path: "/discover",
    element: withSuspense(Discover),
  },
]);