import React from 'react';
import { BackButton } from '@/components/ui/back-button';
import { Gamepad2 } from 'lucide-react';

const TopGames = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c]">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <BackButton />
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Gamepad2 className="text-orange-400" size={24} />
            Top Games
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-20 max-w-2xl">
        <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-white/10 shadow-xl overflow-hidden p-8">
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <Gamepad2 size={64} className="text-orange-400 mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4 pixel-font">Coming Soon!</h2>
            <p className="text-gray-300 mb-6">
              We're working on bringing you the best game discovery experience.
              This feature will be available when the app launches.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopGames;
