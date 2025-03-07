import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ReportDialogProvider } from '@/components/report/ReportDialogProvider';
import GameBoyControls from '@/components/GameBoyControls';
import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt';
import ScrollToTop from '@/components/common/ScrollToTop';
import { AuthProvider } from '@/contexts/AuthContext';
import { MessagesProvider } from '@/contexts/MessagesContext';
import { CommentsProvider } from '@/contexts/CommentContext';
import { usePerformanceMonitoring } from '@/lib/performance';
import { useQueryClient } from '@tanstack/react-query';
import '@/index.css';
import '@/styles/animations.css';

const Home = React.lazy(() => import('./pages/Home'));
const Auth = React.lazy(() => import('./pages/Auth'));
const NewPost = React.lazy(() => import('./pages/NewPost'));
const PostPage = React.lazy(() => import('./pages/PostPage'));
const Game = React.lazy(() => import('./pages/Game'));
const TopGames = React.lazy(() => import('./pages/TopGames'));
const Clipts = React.lazy(() => import('./pages/Clipts'));
const TopClipts = React.lazy(() => import('./pages/TopClipts'));
const UserProfile = React.lazy(() => import('./pages/UserProfile'));
const Discovery = React.lazy(() => import('./pages/Discovery'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const Menu = React.lazy(() => import('./pages/Menu'));
const Profile = React.lazy(() => import('./pages/Profile'));
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

function AppContent() {
  usePerformanceMonitoring('App');
  
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/post/new" element={<NewPost />} />
      <Route path="/post/:id" element={<PostPage />} />
      <Route path="/game/:id" element={<Game />} />
      <Route path="/games" element={<TopGames />} />
      <Route path="/clipts" element={<Clipts />} />
      <Route path="/top-clipts" element={<TopClipts />} />
      <Route path="/profile/:id?" element={<UserProfile />} />
      <Route path="/discovery" element={<Discovery />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/edit" element={
        <ErrorBoundary fallback={<div className="p-4 text-center">Error loading profile editor. Try refreshing the page.</div>}>
          <EditProfile />
        </ErrorBoundary>
      } />
      <Route path="/streaming" element={
        <ErrorBoundary fallback={<div className="p-4 text-center">Error loading streaming page. Try refreshing the page.</div>}>
          <Streaming />
        </ErrorBoundary>
      } />
      <Route path="/messages" element={<Messages />} />
      <Route path="/messages/:userId" element={<Messages />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/game-streamers/:gameId" element={<GameStreamers />} />
      <Route path="/retro-search" element={<RetroSearchPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  const location = useLocation();
  const [currentPostId, setCurrentPostId] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient(); 
  
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

  // Routes that should not display the GameBoy controls
  const noControlsRoutes = ['/auth'];
  const shouldShowControls = !noControlsRoutes.some(route => 
    location.pathname.startsWith(route)
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
                <div className="app-content-wrapper" style={{ 
                  paddingBottom: shouldShowControls ? '180px' : '0',
                  minHeight: '100vh',
                  maxHeight: '100vh',
                  overflow: 'auto',
                  overscrollBehavior: 'none'
                }}>
                  <AppContent />
                </div>
                <PWAInstallPrompt />
                {shouldShowControls && <GameBoyControls currentPostId={currentPostId} />}
              </CommentsProvider>
            </ReportDialogProvider>
          </MessagesProvider>
        </AuthProvider>
      </React.Suspense>
    </ErrorBoundary>
  );
}

export default App;
