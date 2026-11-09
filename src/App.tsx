import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isDirectEntry, needsAppWelcome, readAppEntry, rememberAppEntry } from '@/lib/app-entry';
import {installNativeBroadcastAccountGuard} from '@/native/broadcast/accountGuard';
import { isAppStoreBuild } from '@/native/app/runtime';
import './pages/clipt-console.css';
import './pages/clipt-auth-layout.css';
import {useAuthViewport} from './hooks/useAuthViewport';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Import all page components directly
const LiveDiscovery = React.lazy(() => import('./pages/LiveDiscovery'));
const Achievements = React.lazy(() => import('./pages/Achievements'));
const Start = React.lazy(() => import('./pages/Start'));
const ResendVerification = React.lazy(() => import('./pages/ResendVerification'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const Menu = React.lazy(() => import('./pages/Menu'));
const Discovery = React.lazy(() => import('./pages/Discovery'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Messages = React.lazy(() => import('./pages/Messages'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const Admin = React.lazy(() => import('./pages/Admin'));
const TokenStore = React.lazy(() => import('./pages/TokenStore'));
const CreatorDashboard = React.lazy(() => import('./pages/CreatorDashboard'));
const Settings = React.lazy(() => import('./pages/Settings'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const PostPage = React.lazy(() => import('./pages/PostPage'));
const EditProfile = React.lazy(() => import('./pages/EditProfile'));
const TopGames = React.lazy(() => import('./pages/TopGames'));
const Game = React.lazy(() => import('./pages/Game'));
const Hashtag = React.lazy(() => import('./pages/Hashtag'));
const Clipts = React.lazy(() => import('./pages/Clipts'));
const TopClipts = React.lazy(() => import('./pages/TopClipts'));
const Boosts = React.lazy(() => import('./pages/Boosts'));
const UserProfile = React.lazy(() => import('./pages/UserProfile'));
const NewPost = React.lazy(() => import('./pages/NewPost'));
const Drafts = React.lazy(() => import('./pages/Drafts'));
const CommentsPage = React.lazy(() => import('./pages/CommentsPage'));
const GameStreamers = React.lazy(() => import('./pages/GameStreamers'));
const RetroSearchPage = React.lazy(() => import('./pages/RetroSearchPage'));
const Streaming = React.lazy(() => import('./pages/Streaming'));
const StreamSetup = React.lazy(() => import('./pages/StreamSetup'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const UpdatePassword = React.lazy(() => import('./pages/UpdatePassword'));
const UserGuide = React.lazy(() => import('./pages/docs/UserGuide'));
const PrivacyPolicy = React.lazy(() => import('./pages/docs/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('./pages/docs/TermsOfService'));
const DeleteAccount = React.lazy(() => import('./pages/DeleteAccount'));
const Subscription = React.lazy(() => import('./pages/Subscription'));
const DevelopmentStorageCheck = import.meta.env.DEV ? React.lazy(() => import('./pages/DevelopmentStorageCheck')) : null;
const DevelopmentAzureCheck = ['development','staging'].includes(import.meta.env.VITE_APP_ENV)
  && import.meta.env.VITE_SUPABASE_URL === 'https://akiksrlzdqvipqbbjxpw.supabase.co'
  ? React.lazy(() => import('./pages/DevelopmentAzureCheck')) : null;
const DevelopmentBillingCheck = import.meta.env.DEV ? React.lazy(() => import('./pages/DevelopmentBillingCheck')) : null;
const AutomaticPhotoCheck = ['development','staging'].includes(import.meta.env.VITE_APP_ENV)
  && import.meta.env.VITE_SUPABASE_URL === 'https://akiksrlzdqvipqbbjxpw.supabase.co'
  ? React.lazy(() => import('./pages/AutomaticPhotoCheck')) : null;
const PaymentSuccess = React.lazy(() => import('./pages/payment-success'));
const NativeUnavailable = ({ broadcasting = false }: { broadcasting?: boolean }) => <main className="mx-auto max-w-lg p-6 space-y-4">
  <h1 className="text-2xl font-bold">{broadcasting ? 'Broadcasting is coming later' : 'Memberships are unavailable in this release'}</h1>
  <p>{broadcasting ? 'You can watch available streams. Camera and screen broadcasting are not enabled in this iPhone release.' : 'CLIPT is free to use. Paid memberships and purchases are not enabled in this iPhone release.'}</p>
</main>;
import { AuthGuard } from './components/AuthGuard';
import { MfaGate } from './components/MfaGate';
import { BetaAccessGate } from './components/BetaAccessGate';
import { MessagesProvider } from './contexts/MessagesContext';
import { CommentsProvider } from './contexts/CommentContext';
import { ReportDialogProvider } from './components/report/ReportDialogProvider';
import { useApplyAccessibilityPreferences } from './hooks/useAccessibilityPreferences';

// Import the GameBoy controller
import GameBoyControls from './components/GameBoyControls';
import ConsoleMasthead from './components/ConsoleMasthead';

// Main App component
const App = () => {
  React.useEffect(installNativeBroadcastAccountGuard, []);
  useApplyAccessibilityPreferences();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [welcomeOpen, setWelcomeOpen] = React.useState(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    return needsAppWelcome(window.location, navigation?.type ?? 'navigate', readAppEntry());
  });
  const directEntry = isDirectEntry(location);
  React.useEffect(() => {
    // Legal and account-recovery links remain direct, including links from Welcome.
    if (directEntry) setWelcomeOpen(false);
    rememberAppEntry(!welcomeOpen || directEntry);
  }, [welcomeOpen, directEntry]);
  const authPage=['/login','/signup','/reset-password','/forgot-password','/update-password','/resend-verification'].includes(location.pathname);
  const authViewport=useAuthViewport(authPage);
  const [currentPostId, setCurrentPostId] = React.useState<string | null>(null);
  
  // Extract post ID from URL if viewing a post
  React.useEffect(() => {
    if (location.pathname.includes('/post/')) {
      const postId = location.pathname.split('/post/')[1].split('/')[0];
      setCurrentPostId(postId);
    } else {
      setCurrentPostId(null);
    }
  }, [location.pathname]);

  // Scroll to top when route changes
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // New app opens show the same welcome for guests and returning accounts.
  // Enter mounts the existing shell and all of its authorization gates.
  if (welcomeOpen && !directEntry) {
    return <><Toaster position="top-center" richColors />
      <React.Suspense fallback={<main className="fixed inset-0 grid place-items-center bg-black text-white"><p role="status">Loading CLIPT…</p></main>}>
        <Start onEnter={() => {
          rememberAppEntry(true);
          setWelcomeOpen(false);
          if (['/', '/start', '/home'].includes(location.pathname)) {
            navigate(user ? '/clipts' : '/login', { replace: true });
          }
        }} />
      </React.Suspense>
    </>;
  }

  return (
    <><Toaster position="top-center" richColors />
    <BetaAccessGate><MfaGate><MessagesProvider><CommentsProvider><ReportDialogProvider><div ref={authViewport} className={`app-container min-h-screen bg-black text-white${authPage ? ' clipt-auth-shell' : ''}`}>
      <div className="page-content pb-32"> {/* Add padding to bottom for GameBoy controller */}
        <ConsoleMasthead />
        <React.Suspense fallback={<p role="status" className="p-6">Loading page…</p>}>
        <Routes>
          <Route path="/" element={<Clipts />} />
          <Route path="/start" element={<Start />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forgot-password" element={<ResetPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/resend-verification" element={<ResendVerification />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/discovery" element={<Discovery />} />
          <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
          <Route path="/messages" element={<AuthGuard><Messages /></AuthGuard>} />
          <Route path="/notifications" element={<AuthGuard><Notifications /></AuthGuard>} />
          <Route path="/admin" element={<AuthGuard><Admin /></AuthGuard>} />
          <Route path="/moderation" element={<AuthGuard><Admin /></AuthGuard>} />
          <Route path="/tokens" element={<AuthGuard><TokenStore /></AuthGuard>} />
          <Route path="/subscription" element={isAppStoreBuild() ? <NativeUnavailable /> : <Subscription />} />
          {DevelopmentStorageCheck && <Route path="/development-storage-check" element={<AuthGuard><DevelopmentStorageCheck /></AuthGuard>} />}
          {DevelopmentAzureCheck && <Route path="/development-azure-check" element={<AuthGuard><DevelopmentAzureCheck /></AuthGuard>} />}
          {DevelopmentBillingCheck && <Route path="/development-billing-check" element={<AuthGuard><DevelopmentBillingCheck /></AuthGuard>} />}
          {AutomaticPhotoCheck && <Route path="/development-photo-check" element={<AuthGuard><AutomaticPhotoCheck /></AuthGuard>} />}
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/membership" element={<Navigate to="/subscription" replace />} />
          <Route path="/creator-dashboard" element={<AuthGuard><CreatorDashboard /></AuthGuard>} />
          <Route path="/boosts" element={<AuthGuard><Boosts /></AuthGuard>} />
          <Route path="/messages/:userId" element={<AuthGuard><Messages /></AuthGuard>} />
          <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
          <Route path="/docs/user-guide" element={<UserGuide />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/docs/privacy-policy" element={<Navigate to="/privacy" replace />} />
          <Route path="/docs/terms-of-service" element={<Navigate to="/terms" replace />} />
          <Route path="/delete-account" element={<DeleteAccount />} />
          <Route path="/achievements" element={<AuthGuard><Achievements /></AuthGuard>} />
          <Route path="/post/:id" element={<PostPage />} />
          <Route path="/edit-profile" element={<AuthGuard><EditProfile /></AuthGuard>} />
          <Route path="/profile/edit" element={<Navigate to="/edit-profile" replace />} />
          <Route path="/top-games" element={<TopGames />} />
          <Route path="/game/:id" element={<Game />} />
          <Route path="/game/:id/clips" element={<Game />} />
          <Route path="/hashtag/:tag" element={<Hashtag />} />
          <Route path="/clipts" element={<Clipts />} />
          <Route path="/top-clipts" element={<TopClipts />} />
          <Route path="/user/:id" element={<UserProfile />} />
          <Route path="/profile/:id" element={<UserProfile />} />
          <Route path="/new-post" element={<AuthGuard><NewPost /></AuthGuard>} />
          <Route path="/drafts" element={<AuthGuard><Drafts /></AuthGuard>} />
          <Route path="/post/:id/comments" element={<CommentsPage />} />
          <Route path="/comments/:id" element={<CommentsPage />} />
          <Route path="/game-streamers/:id" element={<GameStreamers />} />
          <Route path="/retro-search" element={<RetroSearchPage />} />
          <Route path="/streaming/:id" element={<Streaming />} />
          <Route path="/live" element={<LiveDiscovery />} />
          <Route path="/stream-setup" element={<AuthGuard>{isAppStoreBuild() ? <NativeUnavailable broadcasting /> : <StreamSetup />}</AuthGuard>} />
          <Route path="/streaming" element={<Navigate to="/live" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </React.Suspense>
      </div>

      {/* GameBoy Controller UI fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <GameBoyControls currentPostId={currentPostId} />
      </div>
    </div></ReportDialogProvider></CommentsProvider></MessagesProvider></MfaGate></BetaAccessGate></>
  );
};

export default App;
