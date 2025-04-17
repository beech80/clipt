import React, { useState, useEffect, lazy } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import PageTransition from '@/components/PageTransition';
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
import BackButton from '@/components/BackButton';
import SuspenseBoundary from '@/components/common/SuspenseBoundary';
import { LoadingFallback } from '@/components/ui/LoadingStates';
import '@/index.css';
import '@/styles/animations.css';
import '@/styles/retro-game.css';
import '@/styles/clipt-video.css';
import '@/components/enhanced-joystick.css';
import './styles/orange-theme-override.css'; // Import the orange theme overrides
import TabsNavigation from '@/components/TabsNavigation';

const LandingPage = React.lazy(() => import('./pages/LandingPage'));
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
// Using minimal version with no complex styling to ensure it displays
const Discovery = React.lazy(() => import('./pages/DiscoveryMinimal'));
const Explore = React.lazy(() => import('./pages/Explore'));
const AllStreamers = React.lazy(() => import('./pages/AllStreamers'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const Menu = React.lazy(() => import('./pages/Menu'));
const Profile = React.lazy(() => import('./pages/ProfileNew'));
const GameMenu = React.lazy(() => import('./pages/GameMenu'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
// Updated to use modern Streaming page with improved UI and animations
const Streaming = React.lazy(() => import('./pages/StreamingPage_modern'));
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
const GameClipts = React.lazy(() => import('./pages/GameClipts'));
const RetroSearchPage = React.lazy(() => import('./pages/RetroSearchPage'));
const CommentsPage = React.lazy(() => import('./pages/CommentsPage'));
const AllCommentsPage = React.lazy(() => import('./pages/AllCommentsPage'));
const GroupChat = React.lazy(() => import('./pages/GroupChat'));
const CommentsFullPage = React.lazy(() => import('./pages/CommentsFullPage'));
const VideoDebug = React.lazy(() => import('./pages/VideoDebug'));
const StreamSetup = React.lazy(() => import('./pages/StreamSetup'));
const StreamView = React.lazy(() => import('./pages/StreamView'));
const StreamViewer = React.lazy(() => import('./pages/StreamViewer'));
const Saved = React.lazy(() => import('./pages/Saved'));
const ClipEditor = React.lazy(() => import('./pages/ClipEditor'));
const PostTypeSelection = React.lazy(() => import('./pages/PostTypeSelection'));
const AdvancedSearch = React.lazy(() => import('./pages/AdvancedSearch'));

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

const AppContent = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Redirect authenticated users from auth pages to home
  if (user && ['/login', '/signup', '/auth'].includes(location.pathname)) {
    return <Navigate to="/home" replace />;  
  }

  // Redirect unauthenticated users from protected pages to login
  if (!user && !['/login', '/signup', '/auth', '/'].includes(location.pathname)) {
    return <Navigate to="/login" replace />;  
  }

  return (
    <PageTransition>
      <Routes>
        <Route path="/" element={<SuspenseBoundary><LandingPage /></SuspenseBoundary>} />
        <Route path="/home" element={<Navigate to="/clipts" replace />} />
        <Route path="/auth" element={<SuspenseBoundary><Auth /></SuspenseBoundary>} />
        <Route path="/login" element={<SuspenseBoundary><Login /></SuspenseBoundary>} />
        <Route path="/signup" element={<SuspenseBoundary><Signup /></SuspenseBoundary>} />
        <Route path="/create" element={<Navigate to="/post/new" replace />} />
        <Route path="/post/new" element={<SuspenseBoundary loadingMessage="Loading post form..."><NewPost /></SuspenseBoundary>} />
        <Route path="/post/:id" element={<SuspenseBoundary loadingMessage="Loading post..."><PostPage /></SuspenseBoundary>} />
        <Route path="/post/:postId/comments" element={<SuspenseBoundary loadingMessage="Loading comments..."><CommentsPage /></SuspenseBoundary>} />
        <Route path="/comments-full/:postId" element={<SuspenseBoundary loadingMessage="Loading comments..."><CommentsFullPage /></SuspenseBoundary>} />
        <Route path="/group-chat" element={<SuspenseBoundary loadingMessage="Loading chat..."><GroupChat /></SuspenseBoundary>} />
        <Route path="/game/:id" element={<SuspenseBoundary loadingMessage="Loading game details..."><GameDetailsPage /></SuspenseBoundary>} />
        <Route path="/games" element={<SuspenseBoundary loadingMessage="Finding top games..."><TopGames /></SuspenseBoundary>} />
        <Route path="/clipts" element={<SuspenseBoundary loadingMessage="Loading clipts..."><Clipts /></SuspenseBoundary>} />
        <Route path="/top-clipts" element={<SuspenseBoundary loadingMessage="Loading top clipts..."><TopClipts /></SuspenseBoundary>} />
        <Route path="/squads-clipts" element={<SuspenseBoundary loadingMessage="Loading squads clipts..."><SquadsClipts /></SuspenseBoundary>} />
        <Route path="/profile/:id?" element={<SuspenseBoundary loadingMessage="Loading profile..."><UserProfile /></SuspenseBoundary>} />
        {/* PRIMARY DISCOVERY ROUTE - updated with TikTok-style interface */}
        <Route path="/discover" element={<SuspenseBoundary loadingMessage="Loading Discovery page..."><Discovery /></SuspenseBoundary>} />
        {/* Backup route in case the other one doesn't work */}
        <Route path="/discovery" element={<Navigate to="/discover" replace />} />
        <Route path="/explore" element={<SuspenseBoundary loadingMessage="Loading explore feed..."><Explore /></SuspenseBoundary>} />
        <Route path="/streamers" element={<SuspenseBoundary loadingMessage="Loading streamers..."><AllStreamers /></SuspenseBoundary>} />
        <Route path="/stream/:id" element={<SuspenseBoundary loadingMessage="Loading stream..."><StreamView /></SuspenseBoundary>} />
        <Route path="/menu" element={<Navigate to="/clipts" replace />} />
        <Route path="/profile" element={<SuspenseBoundary><Profile /></SuspenseBoundary>} />
        <Route path="/profile/edit" element={
          <ErrorBoundary fallback={<div className="p-4 text-red-500">Error loading profile editor</div>}>
            <EditProfile />
          </ErrorBoundary>
        } />
        <Route path="/notifications" element={<SuspenseBoundary loadingMessage="Loading notifications..."><Notifications /></SuspenseBoundary>} />
        <Route path="/messages" element={<SuspenseBoundary loadingMessage="Loading messages..."><Messages /></SuspenseBoundary>} />
        <Route path="/messages/:threadId" element={<SuspenseBoundary loadingMessage="Loading messages..."><Messages /></SuspenseBoundary>} />
        <Route path="/messages/new/:recipientId" element={<SuspenseBoundary loadingMessage="Loading messages..."><Messages /></SuspenseBoundary>} />
        <Route path="/settings" element={<SuspenseBoundary loadingMessage="Loading settings..."><Settings /></SuspenseBoundary>} />
        <Route path="/streaming" element={<SuspenseBoundary loadingMessage="Loading streaming..."><Streaming /></SuspenseBoundary>} />
        <Route path="/streaming/:id" element={<SuspenseBoundary loadingMessage="Loading streaming..."><Streaming /></SuspenseBoundary>} />
        <Route path="/stream-setup" element={<SuspenseBoundary loadingMessage="Loading stream setup..."><StreamSetup /></SuspenseBoundary>} />
        <Route path="/streams" element={<SuspenseBoundary loadingMessage="Loading stream setup..."><StreamSetup /></SuspenseBoundary>} />
        <Route path="/admin" element={<SuspenseBoundary loadingMessage="Loading admin..."><Admin /></SuspenseBoundary>} />
        <Route path="/game-streamers/:gameId" element={<SuspenseBoundary loadingMessage="Finding game streamers..."><GameStreamers /></SuspenseBoundary>} />
        <Route path="/retro-search" element={<SuspenseBoundary loadingMessage="Loading retro search..."><RetroSearchPage /></SuspenseBoundary>} />
        <Route path="/game/:gameId" element={<SuspenseBoundary loadingMessage="Loading game details..."><GameDetailsPage /></SuspenseBoundary>} />
        <Route path="/game/:gameId/clipts" element={<SuspenseBoundary loadingMessage="Loading game clipts..."><GameClipts /></SuspenseBoundary>} />
        <Route path="/game-streamers/:gameName" element={<SuspenseBoundary loadingMessage="Finding game streamers..."><GameStreamers /></SuspenseBoundary>} />
        <Route path="/stream/:streamerId" element={<SuspenseBoundary loadingMessage="Loading stream..."><StreamViewer /></SuspenseBoundary>} />
        <Route path="/clip-editor/:id" element={<SuspenseBoundary loadingMessage="Loading clip editor..."><ClipEditor /></SuspenseBoundary>} />
        <Route path="/video-editor" element={<SuspenseBoundary loadingMessage="Loading video editor..."><ClipEditor /></SuspenseBoundary>} />
        <Route path="/post-form" element={<SuspenseBoundary loadingMessage="Loading post form..."><NewPost /></SuspenseBoundary>} />
        <Route path="/post-selection" element={<SuspenseBoundary><PostTypeSelection /></SuspenseBoundary>} />
        <Route path="/game-menu" element={<SuspenseBoundary><GameMenu /></SuspenseBoundary>} />
        <Route path="/search" element={<SuspenseBoundary loadingMessage="Preparing search..."><AdvancedSearch /></SuspenseBoundary>} />
        <Route path="*" element={<SuspenseBoundary><NotFound /></SuspenseBoundary>} />
      </Routes>
    </PageTransition>
  );
}

function App() {
  const location = useLocation();
  const [currentPostId, setCurrentPostId] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient(); 
  const navigate = useNavigate();
  
  // No longer need manual redirect - LandingPage handles transition to Discovery
  // with a smooth animation sequence
  
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
      <SuspenseBoundary 
        loadingMessage="Preparing Clipt" 
        loadingVariant="gaming" 
        fullScreen={true}
        fallbackSize="lg"
      >
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
                {/* GameBoyControls is no longer shown on /clipts or /squads-clipts to keep those pages clean */}
                {/* (Removed as per latest UI requirements) */}
                {/* Show back button on all pages except Clipts and SquadsClipts */}
                {!(location.pathname === '/clipts' || location.pathname === '/squads-clipts') && (
                  <BackButton />
                )}
                <PWAInstallPrompt />
              </CommentsProvider>
            </ReportDialogProvider>
          </MessagesProvider>
        </AuthProvider>
      </SuspenseBoundary>
    </ErrorBoundary>
  );
}

/* Global styles are imported from CSS files */

export default App;
