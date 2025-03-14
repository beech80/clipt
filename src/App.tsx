import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ReportDialogProvider } from '@/components/report/ReportDialogProvider';
import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt';
import ScrollToTop from '@/components/common/ScrollToTop';
import { AuthProvider } from '@/contexts/AuthContext';
import { MessagesProvider } from '@/contexts/MessagesContext';
import { CommentsProvider } from '@/contexts/CommentContext';
import { usePerformanceMonitoring } from '@/lib/performance';
import { useQueryClient } from '@tanstack/react-query';
import '@/index.css';
import '@/styles/animations.css';

// Import directly without lazy loading
import GameBoyControls from '@/components/GameBoyControls';

// Lazy load all page components
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
const Messages = React.lazy(() => import('./pages/Messages'));
const Settings = React.lazy(() => import('./pages/Settings'));
const EditProfile = React.lazy(() => import('./pages/EditProfile'));
const Admin = React.lazy(() => import('./pages/Admin'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const RetroSearchPage = React.lazy(() => import('./pages/RetroSearchPage'));
const Streaming = React.lazy(() => import('./pages/Streaming'));
const GameStreamers = React.lazy(() => import('./pages/GameStreamers'));
const CommentsPage = React.lazy(() => import('./pages/CommentsPage'));

// Create a fallback component to show while pages are loading
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen w-full bg-black">
    <div className="text-white text-2xl">Loading Clipt...</div>
  </div>
);

function AppContent() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);

  // Extract post ID from URL if viewing a post
  useEffect(() => {
    if (location.pathname.includes('/post/')) {
      const postId = location.pathname.split('/post/')[1].split('/')[0];
      setCurrentPostId(postId);
    } else {
      setCurrentPostId(null);
    }
  }, [location.pathname]);

  // Performance monitoring
  usePerformanceMonitoring('App');

  return (
    <div className="app-container min-h-screen bg-black text-white">
      <ScrollToTop />
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/post/:postId" element={<PostPage />} />
            <Route path="/new-post" element={<NewPost />} />
            <Route path="/top-games" element={<TopGames />} />
            <Route path="/game/:gameId" element={<Game />} />
            <Route path="/game/:gameId/streamers" element={<GameStreamers />} />
            <Route path="/clipts" element={<Clipts />} />
            <Route path="/top-clipts" element={<TopClipts />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            <Route path="/discovery" element={<Discovery />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:conversationId" element={<Messages />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/post/:postId/comments" element={<CommentsPage />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/retro-search" element={<RetroSearchPage />} />
            <Route path="/streaming" element={<Streaming />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        
        {/* GameBoy Controller - directly imported instead of lazy loaded */}
        <GameBoyControls currentPostId={currentPostId} />
      </ErrorBoundary>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MessagesProvider>
        <CommentsProvider>
          <ReportDialogProvider>
            <PWAInstallPrompt />
            <Toaster 
              position="top-center" 
              richColors 
              toastOptions={{
                style: {
                  background: '#111',
                  color: '#fff',
                  border: '1px solid #222',
                },
                className: 'retro-toast',
              }} 
            />
            <AppContent />
          </ReportDialogProvider>
        </CommentsProvider>
      </MessagesProvider>
    </AuthProvider>
  );
}

export default App;
