import React from 'react';
import { FeaturedCarousel } from "@/components/content/FeaturedCarousel";
import { TopGames } from "@/components/discover/TopGames";

const Discover = () => {
  return (
    <div className="min-h-screen bg-[#1A1F2C] bg-gradient-to-b from-gaming-900/50 to-gaming-800/30">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Search Section */}
        <div className="max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl font-bold text-center gaming-gradient">
            Discover Games
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Find your next favorite game to stream
          </p>
          <FeaturedCarousel />
        </div>

        {/* Featured Games Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold gaming-gradient">
              Featured Games
            </h2>
            <button className="gaming-button hover:border-gaming-500">
              View All
            </button>
          </div>
          <div className="glass-card p-6 backdrop-blur-sm">
            <TopGames />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discover;