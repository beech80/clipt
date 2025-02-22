
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import GameBoyControls from '@/components/GameBoyControls';
import { useNavigate } from 'react-router-dom';
import { Camera } from "lucide-react";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-gaming-900">
      {/* Header Section with Squads/Clipts */}
      <div className="w-full bg-gaming-800/80 backdrop-blur-sm border-b border-gaming-700/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">Squads & Clipts</h1>
              <p className="text-gaming-300">Join squads or share your gaming moments</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/squads')}
                className="px-6 py-2 rounded-lg bg-gaming-700 hover:bg-gaming-600 text-white transition-colors"
              >
                Find Squads
              </button>
              <button
                onClick={() => navigate('/clipts')}
                className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors"
              >
                View Clipts
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-gray-400">Select a squad to join or create your own gaming moment!</p>
        </div>
      </div>

      <div className="fixed left-1/2 -translate-x-1/2 bottom-24 sm:bottom-28">
        <button 
          onClick={() => navigate('/post/new')}
          className="post-button active:scale-95 transition-transform"
          aria-label="Create Post"
          style={{ width: '80px', height: '60px' }}
        >
          <Camera className="post-button-icon" />
          <span className="post-button-text">Post</span>
        </button>
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Home;
