
import React from 'react';
import { MainContent } from '@/components/home/MainContent';
import { WelcomeSection } from '@/components/home/WelcomeSection';
import { SidebarContent } from '@/components/home/SidebarContent';
import GameBoyControls from '@/components/GameBoyControls';

const Home = () => {
  return (
    <div className="min-h-screen bg-[#1A1F2C]">
      {/* Welcome Section */}
      <WelcomeSection />

      {/* Main Grid Layout */}
      <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content Area */}
        <MainContent />
        
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <SidebarContent />
        </div>
      </div>

      {/* Game Boy Style Controls */}
      <GameBoyControls />
    </div>
  );
};

export default Home;
