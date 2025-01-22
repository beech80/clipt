import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Loader2 } from "lucide-react";

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

// Lazy load route components with error boundaries
const lazyLoad = (Component: React.ComponentType, label: string) => (
  <Suspense 
    fallback={<PageLoader />}
  >
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
const GamePage = lazy(() => import('./pages/GamePage' /* webpackChunkName: "game" */));
const Messages = lazy(() => import('./pages/Messages' /* webpackChunkName: "messages" */));
const Collections = lazy(() => import('./pages/Collections' /* webpackChunkName: "collections" */));
const Discover = lazy(() => import('./pages/Discover' /* webpackChunkName: "discover" */));

export const router = createBrowserRouter([
  {
    path: "/",
    element: lazyLoad(Home, 'Home Page'),
  },
  {
    path: "/post/:id",
    element: lazyLoad(Post, 'Post Page'),
  },
  {
    path: "/profile/:username",
    element: lazyLoad(Profile, 'Profile Page'),
  },
  {
    path: "/edit-profile",
    element: lazyLoad(EditProfile, 'Edit Profile Page'),
  },
  {
    path: "/settings",
    element: lazyLoad(Settings, 'Settings Page'),
  },
  {
    path: "/clips",
    element: lazyLoad(Clips, 'Clips Page'),
  },
  {
    path: "/game/:slug",
    element: lazyLoad(GamePage, 'Game Page'),
  },
  {
    path: "/messages",
    element: lazyLoad(Messages, 'Messages Page'),
  },
  {
    path: "/collections",
    element: lazyLoad(Collections, 'Collections Page'),
  },
  {
    path: "/discover",
    element: lazyLoad(Discover, 'Discover Page'),
  },
]);