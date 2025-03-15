import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';

// Import all page components directly
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Menu from './pages/Menu';
import Discovery from './pages/Discovery';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import PostPage from './pages/PostPage';
import EditProfile from './pages/EditProfile';
import TopGames from './pages/TopGames';
import Game from './pages/Game';
import Clipts from './pages/Clipts';
import TopClipts from './pages/TopClipts';
import UserProfile from './pages/UserProfile';
import NewPost from './pages/NewPost';
import CommentsPage from './pages/CommentsPage';
import GameStreamers from './pages/GameStreamers';
import RetroSearchPage from './pages/RetroSearchPage';
import Streaming from './pages/Streaming';

// Import the GameBoy controller
import GameBoyControls from './components/GameBoyControls';

// Main App component
const App = () => {
  const location = useLocation();
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

  return (
    <div className="app-container min-h-screen bg-black text-white">
      <div className="page-content pb-32"> {/* Add padding to bottom for GameBoy controller */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/discovery" element={<Discovery />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/post/:id" element={<PostPage />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/top-games" element={<TopGames />} />
          <Route path="/game/:id" element={<Game />} />
          <Route path="/clipts" element={<Clipts />} />
          <Route path="/top-clipts" element={<TopClipts />} />
          <Route path="/user/:id" element={<UserProfile />} />
          <Route path="/new-post" element={<NewPost />} />
          <Route path="/comments/:id" element={<CommentsPage />} />
          <Route path="/game-streamers/:id" element={<GameStreamers />} />
          <Route path="/retro-search" element={<RetroSearchPage />} />
          <Route path="/streaming/:id" element={<Streaming />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {/* Toaster for notifications */}
      <Toaster position="top-center" richColors />
      
      {/* GameBoy Controller UI fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <GameBoyControls currentPostId={currentPostId} />
      </div>
    </div>
  );
};

export default App;
