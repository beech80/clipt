import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PostList from '@/components/PostList';
import GameBoyControls from '@/components/GameBoyControls';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen bg-[#1A1F2C] overflow-hidden">
      {/* Game Boy Frame */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="gaming-cartridge mb-4 p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold gaming-gradient">Gaming Feed</h1>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-sm text-gaming-400">LIVE</span>
            </div>
          </div>
          {!user && (
            <div className="text-sm text-gaming-400 mt-2">
              Sign in to like, comment, and share posts!
            </div>
          )}
        </div>

        {/* Instagram-style Feed */}
        <div className="post-container relative">
          <PostList />
        </div>
      </div>

      {/* Game Boy Controls */}
      <GameBoyControls />
    </div>
  );
};

export default Home;