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
// NavigationBar removed
import SuspenseBoundary from '@/components/common/SuspenseBoundary';
import { LoadingFallback } from '@/components/ui/LoadingStates';
import { createGlobalStyle } from 'styled-components';
import '@/index.css';
import '@/styles/animations.css';
import '@/styles/retro-game.css';
import '@/styles/clipt-video.css';
import '@/components/enhanced-joystick.css';
import './styles/orange-theme-override.css'; // Import the orange theme for all pages
import './styles/global-orange-theme.css'; // More comprehensive orange theme

// Enhanced global style to prevent scrolling past content
const GlobalStyle = createGlobalStyle`
  html, body, #root {
    background-color: #0C0C0C !important;
    margin: 0;
    padding: 0;
    min-height: 100vh;
    height: 100%;
    overflow: hidden !important;
    overscroll-behavior: none;
    position: fixed;
    width: 100%;
  }
  
  body {
    overscroll-behavior: none;
    background-color: #0C0C0C !important;
    touch-action: none;
  }
  
  /* Prevent any element from causing scrolling issues */
  * {
    overscroll-behavior: none;
  }
`;
import TabsNavigation from '@/components/TabsNavigation';

const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const SpaceLanding = React.lazy(() => import('./pages/SpaceLanding'));
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
// Using the fixed clean discovery page implementation
const DiscoveryFixedClean = React.lazy(() => import('./pages/DiscoveryFixedClean'));
const DiscoveryNew = React.lazy(() => import('./pages/DiscoveryNew'));
const Explore = React.lazy(() => import('./pages/Explore'));
const AllStreamers = React.lazy(() => import('./pages/AllStreamers'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const Menu = React.lazy(() => import('./pages/Menu'));
const Profile = React.lazy(() => import('./pages/Profile'));
const BoostStore = React.lazy(() => import('./pages/BoostStore'));
const GameMenu = React.lazy(() => import('./pages/GameMenu'));
const GameMainMenu = React.lazy(() => import('./pages/GameMainMenu'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
// Using the original Streaming page implementation
const Streaming = React.lazy(() => import('./pages/Streaming')); // Stream setup page
const StreamingPageModern = React.lazy(() => import('./pages/StreamingPageModern')); // Modern streaming page with all streamers
const StreamingPage = React.lazy(() => import('./pages/StreamingPage'));
const Streams = React.lazy(() => import('./pages/Streams'));
const Messages = React.lazy(() => import('./pages/Messages'));
const Settings = React.lazy(() => import('./pages/Settings'));
const EditProfilePage = React.lazy(() => import('./pages/EditProfilePage'));
const EditProfile = React.lazy(() => import('./pages/EditProfile'));
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
const SearchPage = React.lazy(() => import('./pages/SearchPage'));
const Posts = React.lazy(() => import('./pages/Posts'));

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
  const location = useLocation();
  const { user } = useAuth();

  return (
    <PageTransition>
      <Routes>
        <Route path="/" element={<SuspenseBoundary><SpaceLanding /></SuspenseBoundary>} />
        <Route path="/boost-store" element={<SuspenseBoundary><BoostStore /></SuspenseBoundary>} />
        <Route path="/edit-profile" element={<SuspenseBoundary><EditProfile /></SuspenseBoundary>} />
        <Route path="/home" element={
          <SuspenseBoundary>
            <Home />
          </SuspenseBoundary>
        } />
        <Route path="/auth" element={<SuspenseBoundary><Auth /></SuspenseBoundary>} />
        <Route path="/discovery" element={<SuspenseBoundary><DiscoveryNew /></SuspenseBoundary>} />
        <Route path="/login" element={<SuspenseBoundary><Login /></SuspenseBoundary>} />
        <Route path="/signup" element={<SuspenseBoundary><Signup /></SuspenseBoundary>} />
        <Route path="/streams" element={<SuspenseBoundary><Streaming /></SuspenseBoundary>} />
        <Route path="/menu" element={<SuspenseBoundary><GameMainMenu /></SuspenseBoundary>} />
        <Route path="/streaming" element={<SuspenseBoundary><Streaming /></SuspenseBoundary>} />
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
        <Route path="/profile/:id?" element={<SuspenseBoundary loadingMessage="Loading profile..."><Profile /></SuspenseBoundary>} />
        <Route path="/explore" element={<SuspenseBoundary loadingMessage="Loading Explore page..."><Explore /></SuspenseBoundary>} />
        <Route path="/all-streamers" element={<SuspenseBoundary loadingMessage="Loading streamers..."><AllStreamers /></SuspenseBoundary>} />
        <Route path="/menu" element={<SuspenseBoundary loadingMessage="Loading menu..."><Menu /></SuspenseBoundary>} />
        <Route path="/profile" element={<SuspenseBoundary loadingMessage="Loading profile..."><Profile /></SuspenseBoundary>} />
        <Route path="/settings/profile" element={<SuspenseBoundary loadingMessage="Loading profile editor..."><EditProfilePage /></SuspenseBoundary>} />
        <Route path="/game-menu" element={<SuspenseBoundary><GameMenu /></SuspenseBoundary>} />
        <Route path="/notifications" element={<SuspenseBoundary loadingMessage="Loading notifications..."><Notifications /></SuspenseBoundary>} />
        <Route path="/streams-setup" element={<SuspenseBoundary loadingMessage="Loading stream setup..."><Streaming /></SuspenseBoundary>} />
        <Route path="/streaming" element={<SuspenseBoundary loadingMessage="Loading streamers..."><StreamingPageModern /></SuspenseBoundary>} />
        <Route path="/streaming-setup" element={<SuspenseBoundary loadingMessage="Loading stream setup..."><Streaming /></SuspenseBoundary>} />
        <Route path="/streaming/dashboard" element={<SuspenseBoundary loadingMessage="Loading stream dashboard..."><Streaming /></SuspenseBoundary>} />
        <Route path="/streaming/schedule" element={<SuspenseBoundary loadingMessage="Loading stream schedule..."><Streaming /></SuspenseBoundary>} />
        <Route path="/streams" element={<SuspenseBoundary loadingMessage="Loading stream setup..."><Streams /></SuspenseBoundary>} />
        <Route path="/stream/:id" element={<SuspenseBoundary loadingMessage="Loading stream view..."><StreamView /></SuspenseBoundary>} />
        <Route path="/messages" element={<SuspenseBoundary loadingMessage="Loading messages..."><Messages /></SuspenseBoundary>} />
        <Route path="/settings" element={<SuspenseBoundary loadingMessage="Loading settings..."><Settings /></SuspenseBoundary>} />
        <Route path="/edit-profile" element={<SuspenseBoundary loadingMessage="Loading profile editor..."><EditProfile /></SuspenseBoundary>} />
        <Route path="/admin" element={<SuspenseBoundary loadingMessage="Loading admin panel..."><Admin /></SuspenseBoundary>} />
        <Route path="/game/:id/streamers" element={<SuspenseBoundary loadingMessage="Loading game streamers..."><GameStreamers /></SuspenseBoundary>} />
        <Route path="/clip-editor" element={<SuspenseBoundary loadingMessage="Loading clip editor..."><ClipEditor /></SuspenseBoundary>} />
        <Route path="/post-type" element={<SuspenseBoundary loadingMessage="Loading post type selection..."><PostTypeSelection /></SuspenseBoundary>} />
        <Route path="/search" element={<SuspenseBoundary loadingMessage="Loading search..."><SearchPage /></SuspenseBoundary>} />
        <Route path="/posts" element={<SuspenseBoundary loadingMessage="Loading posts..."><Posts /></SuspenseBoundary>} />
        <Route path="*" element={<SuspenseBoundary><NotFound /></SuspenseBoundary>} />
      </Routes>
    </PageTransition>
  );
};

function App() {
  const location = useLocation();
  const [currentPostId, setCurrentPostId] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient(); 
  
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
    // Initialize database tables on app startup
    ensureTablesExist().catch(error => {
      console.error("Error ensuring tables exist:", error);
    });
    
    // Apply enhanced overflow control to prevent scrolling past content
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100%';
    document.body.style.width = '100%';
    document.body.style.position = 'fixed';
    document.body.style.backgroundColor = '#0C0C0C';
    document.body.style.touchAction = 'none';
    
    // Disable scroll events
    const preventScroll = (e) => {
      // Allow scrolling only within content areas that need it
      if (e.target.closest('.scrollable-content')) {
        return true;
      }
      e.preventDefault();
      return false;
    };
    
    // Add preventScroll to various scroll events
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    
    // Use a more forceful approach with direct style injection
    const style = document.createElement('style');
    style.innerHTML = `
      html, body, #root {
        background-color: #0C0C0C !important;
        min-height: 100vh !important;
        height: 100% !important;
        width: 100% !important;
        overflow: hidden !important;
        position: fixed !important;
        overscroll-behavior: none !important;
        touch-action: none !important;
      }
      
      /* Force dark background on all pages */
      .app-content-wrapper, .page-container, main {
        background-color: #0C0C0C !important;
      }
      
      /* Allow scrolling only in content containers */
      .scrollable-content {
        overflow-y: auto;
        overflow-x: hidden;
        overscroll-behavior: contain;
        height: 100%;
        -webkit-overflow-scrolling: touch;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  // Routes that should display the tabs navigation
  const tabNavigationRoutes = ['/trophies', '/saved'];
  const shouldShowTabNavigation = tabNavigationRoutes.some(route => 
    location.pathname === route
  );

  return (
    <ErrorBoundary>
      <GlobalStyle />
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
                <div className="app-content-wrapper scrollable-content" style={{ 
                  paddingTop: shouldShowTabNavigation ? '60px' : '0',
                  minHeight: '100vh',
                  maxHeight: '100vh',
                  paddingBottom: '60px', /* Add padding to account for navigation bar */
                  overflow: 'auto',
                  overscrollBehavior: 'contain',
                  backgroundColor: '#0C0C0C',
                  position: 'relative',
                  touchAction: 'pan-y',
                  WebkitOverflowScrolling: 'touch'
                }}>
                  <AppContent />
                </div>
                {/* Only show GameBoyControls on Clipts and SquadsClipts pages */}
                {(location.pathname === '/clipts' || location.pathname === '/squads-clipts') && (
                  <GameBoyControls />
                )}
                {/* Show back button on all pages except Clipts and SquadsClipts */}
                {!(location.pathname === '/clipts' || location.pathname === '/squads-clipts') && (
                  <BackButton />
                )}
                {/* NavigationBar removed as requested */}
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
