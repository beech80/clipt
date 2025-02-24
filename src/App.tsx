
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ReportDialogProvider } from '@/components/report/ReportDialogProvider';
import './App.css';

// Import your routes
import Home from '@/pages/Home';
import Broadcasting from '@/pages/Broadcasting';
import Discover from '@/pages/Discover';
import Messages from '@/pages/Messages';
import Profile from '@/pages/Profile';
import Streaming from '@/pages/Streaming';
import TopClips from '@/pages/TopClips';
import Clipts from '@/pages/Clipts';
import AiAssistant from '@/pages/AiAssistant';
import Settings from '@/pages/Settings';
import Esports from '@/pages/Esports';
import Post from '@/pages/Post';
import NewPost from '@/pages/NewPost';
import GamePage from '@/pages/GamePage';
import Moderation from '@/pages/Moderation';

function App() {
  return (
    <AuthProvider>
      <ReportDialogProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/broadcasting" element={<Broadcasting />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/streaming" element={<Streaming />} />
          <Route path="/top-clips" element={<TopClips />} />
          <Route path="/clipts" element={<Clipts />} />
          <Route path="/ai-assistant" element={<AiAssistant />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/esports" element={<Esports />} />
          <Route path="/post/:postId" element={<Post />} />
          <Route path="/post/new" element={<NewPost />} />
          <Route path="/game/:gameId" element={<GamePage />} />
          <Route path="/moderation" element={<Moderation />} />
        </Routes>
      </ReportDialogProvider>
    </AuthProvider>
  );
}

export default App;
