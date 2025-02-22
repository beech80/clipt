
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
      {/* Modern Header with Gradient and Blur */}
      <div className="w-full py-6 px-4 bg-gradient-to-b from-gaming-800/80 to-transparent backdrop-blur-sm">
        <h1 className="text-center text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Squads Clipts
        </h1>
      </div>

      {/* Center Camera Button */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-24 sm:bottom-28">
        <button 
          onClick={() => navigate('/post/new')}
          className="clip-button active:scale-95 transition-transform"
          aria-label="Create Clipt"
          style={{ width: '80px', height: '60px' }}
        >
          <Camera className="clip-button-icon" />
          <span className="clip-button-text">Clipt</span>
        </button>
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Home;
