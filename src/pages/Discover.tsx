import React from 'react';
import { FeaturedCarousel } from "@/components/content/FeaturedCarousel";
import { TopGames } from "@/components/discover/TopGames";
import GameBoyControls from '@/components/GameBoyControls';

const Discover = () => {
  return (
    <div className="container mx-auto px-4 py-8 pb-[200px]">
      <h1 className="text-4xl font-bold mb-8 text-primary">Discovery Page</h1>
      
      <FeaturedCarousel />
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4 text-gaming-100">Popular Games</h2>
        <TopGames />
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Discover;