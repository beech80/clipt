
import React from 'react';
import { useNavigate } from "react-router-dom";
import GameBoyControls from "@/components/GameBoyControls";
import { BackButton } from "@/components/ui/back-button";
import { Camera } from "lucide-react";

const Clipts = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#1a237e]">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <BackButton />
          <h1 className="text-3xl font-bold text-white">
            Clipts
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-24">
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <p className="text-2xl font-semibold text-white/60">Ready to share a gaming moment?</p>
            <p className="text-purple-400">Click the button below to create your first clip!</p>
          </div>
        </div>
      </div>

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
}

export default Clipts;
