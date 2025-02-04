import React from 'react';
import { FeaturedCarousel } from "@/components/content/FeaturedCarousel";
import { TopGames } from "@/components/discover/TopGames";
import GameBoyControls from '@/components/GameBoyControls';
import { Card } from '@/components/ui/card';

const Discover = () => {
  return (
    <div className="container mx-auto px-4 py-8 pb-[200px]">
      <h1 className="text-4xl font-bold mb-8 text-primary">Featured Games</h1>
      
      {/* Featured Games Carousel */}
      <Card className="p-6 mb-8 bg-gaming-800/50 backdrop-blur-sm border-gaming-400/20">
        <h2 className="text-2xl font-semibold mb-4 text-gaming-100">Trending Now</h2>
        <FeaturedCarousel />
      </Card>
      
      {/* Top Games */}
      <Card className="p-6 bg-gaming-800/50 backdrop-blur-sm border-gaming-400/20">
        <h2 className="text-2xl font-semibold mb-4 text-gaming-100">Popular Games</h2>
        <TopGames />
      </Card>

      <GameBoyControls />
    </div>
  );
};

export default Discover;