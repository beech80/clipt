import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ReportDialogProvider } from '@/components/report/ReportDialogProvider';
import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt';
import ScrollToTop from '@/components/common/ScrollToTop';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { MessagesProvider } from '@/contexts/MessagesContext';
import { CommentsProvider } from '@/contexts/CommentContext';
import { usePerformanceMonitoring } from '@/lib/performance';
import { useQueryClient } from '@tanstack/react-query';
import { initUserInteractionTracking } from '@/utils/userInteraction';
import { ensureTablesExist } from '@/lib/supabase';
import GameBoyControls from '@/components/GameBoyControls';
import '@/index.css';
import '@/styles/animations.css';
import '@/styles/retro-game.css';
import '@/components/enhanced-joystick.css';
import TabsNavigation from '@/components/TabsNavigation';

const Home = React.lazy(() => import('./pages/Home'));
const Auth = React.lazy(() => import('./pages/Auth'));
const NewPost = React.lazy(() => import('./pages/NewPost'));
const PostPage = React.lazy(() => import('./pages/PostPage'));
const GameDetailsPage = React.lazy(() => import('./pages/GameDetails'));
const TopGames = React.lazy(() => import('./pages/TopGames'));
const Clipts = React.lazy(() => import('./pages/Clipts'));
const TopClipts = React.lazy(() => import('./pages/TopClipts'));
const SquadsClipts = React.lazy(() => import('./pages/SquadsClipts'));
const UserProfile = React.lazy(() => import('./pages/UserProfile'));
const Discovery = React.lazy(() => import('./pages/Discovery'));
const Explore = React.lazy(() => import('./pages/Explore'));
const AllStreamers = React.lazy(() => import('./pages/AllStreamers'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const Menu = React.lazy(() => import('./pages/Menu'));
const Profile = React.lazy(() => import('./pages/Profile'));
const GameMenu = React.lazy(() => import('./pages/GameMenu'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
// Fix the problematic imports with more reliable patterns
const Streaming = React.lazy(() => 
  import('./pages/Streaming').catch(error => {
    console.error('Error loading Streaming module:', error);
    return { default: () => <div>Failed to load streaming page. Please refresh.</div> };
  })
);
const Messages = React.lazy(() => import('./pages/Messages'));
const Settings = React.lazy(() => import('./pages/Settings'));
const EditProfile = React.lazy(() => 
  import('./pages/EditProfile').catch(error => {
    console.error('Error loading EditProfile module:', error);
    return { default: () => <div>Failed to load profile editor. Please refresh.</div> };
  })
);
const Admin = React.lazy(() => import('./pages/Admin'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const GameStreamers = React.lazy(() => import('./pages/GameStreamers'));
const RetroSearchPage = React.lazy(() => import('./pages/RetroSearchPage'));
const CommentsPage = React.lazy(() => import('./pages/CommentsPage'));
const AllCommentsPage = React.lazy(() => import('./pages/AllCommentsPage'));
const GroupChat = React.lazy(() => import('./pages/GroupChat'));
const CommentsFullPage = React.lazy(() => import('./pages/CommentsFullPage'));
const VideoDebug = React.lazy(() => import('./pages/VideoDebug'));
const StreamSetup = React.lazy(() => import('./pages/StreamSetup'));
const StreamView = React.lazy(() => import('./pages/StreamView'));
const Saved = React.lazy(() => import('./pages/Saved'));
const ClipEditor = React.lazy(() => import('./pages/ClipEditor'));

// Protected route component to prevent redirecting authenticated users to login/signup
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // If we're still loading, show nothing yet
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-blue-950">
        <div className="text-center p-4">
          <div className="animate-pulse text-blue-300 mb-2">Loading...</div>
          <div className="text-sm text-blue-400">Please wait while we get things ready</div>
        </div>
      </div>
    );
  }
  
  // If user is already authenticated and tries to access login/signup pages,
  // redirect them to the main page
  if (user && (location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/auth')) {
    return <Navigate to="/" replace />;
  }
  
  // Otherwise, render the children
  return <>{children}</>;
};

function AppContent() {
  usePerformanceMonitoring('App');
  
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/clipts" replace />} />
      <Route path="/home" element={<Home />} />
      <Route path="/auth" element={
        <ProtectedRoute>
          <Auth />
        </ProtectedRoute>
      } />
      <Route path="/login" element={
        <ProtectedRoute>
          <Login />
        </ProtectedRoute>
      } />
      <Route path="/signup" element={
        <ProtectedRoute>
          <Signup />
        </ProtectedRoute>
      } />
      <Route path="/create" element={<Navigate to="/post/new" replace />} />
      <Route path="/post/new" element={<NewPost />} />
      <Route path="/post/:id" element={<PostPage />} />
      <Route path="/post/:postId/comments" element={<CommentsPage />} />
      {/* Removed All Comments page as requested */}
      <Route path="/comments-full/:postId" element={<CommentsFullPage />} />
      <Route path="/group-chat" element={<GroupChat />} />
      <Route path="/game/:id" element={<GameDetailsPage />} />
      <Route path="/games" element={<TopGames />} />
      <Route path="/clipts" element={<Clipts />} />
      <Route path="/top-clipts" element={<TopClipts />} />
      <Route path="/squads-clipts" element={<SquadsClipts />} />
      <Route path="/profile/:id?" element={<UserProfile />} />
      <Route path="/discover" element={<Discovery />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/streamers" element={<AllStreamers />} />
      <Route path="/stream/:id" element={<StreamView />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/edit" element={
        <ErrorBoundary fallback={<div className="p-4 text-red-500">Error loading profile editor</div>}>
          <EditProfile />
        </ErrorBoundary>
      } />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/messages/:threadId" element={<Messages />} />
      <Route path="/messages/new/:recipientId" element={<Messages />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/streaming/:id?" element={<Streaming />} />
      <Route path="/stream-setup" element={<StreamSetup />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/game-streamers/:gameId" element={<GameStreamers />} />
      <Route path="/retro-search" element={<RetroSearchPage />} />
      {/* Removed Video Debug page as requested */}
      {/* Removed Posts page as requested */}
      {/* <Route path="/posts" element={<Home />} /> */}
      <Route path="/trophies" element={<TopClipts />} />
      <Route path="/saved" element={<Saved />} />
      <Route path="/clip-editor/:id" element={<ClipEditor />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/game-menu" element={<GameMenu />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  const location = useLocation();
  const [currentPostId, setCurrentPostId] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient(); 
  
  // Initialize user interaction tracking for video autoplay
  useEffect(() => {
    // Set up user interaction tracking for autoplay with sound
    initUserInteractionTracking();
    
    // Debug log to verify it's running
    console.log("User interaction tracking initialized for autoplay");
  }, []);
  
  // Extract post ID from URL if on a post page
  useEffect(() => {
    const match = location.pathname.match(/\/post\/([^/?#]+)/);
    let newPostId = undefined;
    
    if (match && match[1] && match[1] !== 'undefined' && match[1] !== 'null') {
      newPostId = match[1];
    }
    
    console.log("App detected post ID:", {
      pathname: location.pathname,
      extractedId: match?.[1] || 'none',
      settingId: newPostId
    });
    
    setCurrentPostId(newPostId);
    // Clear the cache when navigation occurs
    // This forces components to re-fetch fresh data
    if (location.pathname.startsWith('/profile/') || 
        location.pathname.startsWith('/game/')) {
      console.log("Clearing query cache for navigation:", location.pathname);
      queryClient.clear();
    }
  }, [location.pathname, queryClient]);

  // Initialize database tables on app startup
  useEffect(() => {
    // Ensure all required database tables exist
    ensureTablesExist().catch(error => {
      console.error("Error ensuring tables exist:", error);
    });
  }, []);

  // Routes that should display the tabs navigation
  const tabNavigationRoutes = ['/trophies', '/saved'];
  const shouldShowTabNavigation = tabNavigationRoutes.some(route => 
    location.pathname === route
  );

  return (
    <ErrorBoundary>
      <React.Suspense fallback={
        <div className="flex items-center justify-center h-screen bg-blue-950">
          <div className="text-center p-4">
            <div className="animate-pulse text-blue-300 mb-2">Loading...</div>
            <div className="text-sm text-blue-400">Please wait while we get things ready</div>
          </div>
        </div>
      }>
        <AuthProvider>
          <MessagesProvider>
            <ReportDialogProvider>
              <CommentsProvider>
                <Toaster richColors position="top-center" />
                <ScrollToTop />
                {shouldShowTabNavigation && <TabsNavigation />}
                <div className="app-content-wrapper" style={{ 
                  paddingTop: shouldShowTabNavigation ? '60px' : '0',
                  minHeight: '100vh',
                  maxHeight: '100vh',
                  overflow: 'auto',
                  overscrollBehavior: 'none'
                }}>
                  <AppContent />
                </div>
                <GameBoyControls />
                <PWAInstallPrompt />
              </CommentsProvider>
            </ReportDialogProvider>
          </MessagesProvider>
        </AuthProvider>
      </React.Suspense>
    </ErrorBoundary>
  );
}

/* Global styles are imported from CSS files */

export default App;
