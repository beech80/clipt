import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { MessagesProvider } from '@/contexts/MessagesContext';
import { CommentsProvider } from '@/contexts/CommentContext';
import '@/index.css';

// Import GameBoyControls directly
import GameBoyControls from '@/components/GameBoyControls';

// Import pages directly without lazy loading to ensure they render
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Menu from '@/pages/Menu';
import Discovery from '@/pages/Discovery';
import Profile from '@/pages/Profile';
import Messages from '@/pages/Messages';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';
import PostPage from '@/pages/PostPage';
import EditProfile from '@/pages/EditProfile';
import TopGames from '@/pages/TopGames';
import Game from '@/pages/Game';
import Clipts from '@/pages/Clipts';
import TopClipts from '@/pages/TopClipts';
import UserProfile from '@/pages/UserProfile';
import NewPost from '@/pages/NewPost';
import CommentsPage from '@/pages/CommentsPage';
import GameStreamers from '@/pages/GameStreamers';
import RetroSearchPage from '@/pages/RetroSearchPage';
import Streaming from '@/pages/Streaming';

function AppContent() {
  const location = useLocation();
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

  return (
    <div className="app-container min-h-screen bg-black text-white">
      <div className="page-content pb-24"> {/* Add padding to bottom for GameBoy controller */}
        <Routes>
          <Route path="/" element={<Home />} />
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
          <Route path="/retro-search" element={<RetroSearchPage />} />
          <Route path="/streaming" element={<Streaming />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      
      {/* GameBoy Controller - fixed at the bottom of the screen */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <GameBoyControls currentPostId={currentPostId} />
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MessagesProvider>
        <CommentsProvider>
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
        </CommentsProvider>
      </MessagesProvider>
    </AuthProvider>
  );
}

export default App;
