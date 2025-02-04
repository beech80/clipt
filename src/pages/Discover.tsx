import React from 'react';
import { FeaturedCarousel } from "@/components/content/FeaturedCarousel";
import { TopGames } from "@/components/discover/TopGames";

const Discover = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gaming-900 to-gaming-800">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Search Section */}
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-gaming-100 to-gaming-300 bg-clip-text text-transparent">
            Discover Games
          </h1>
          <FeaturedCarousel />
        </div>

        {/* Featured Games Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gaming-100">Featured Games</h2>
            <button className="text-sm text-gaming-300 hover:text-gaming-200 transition-colors">
              View All
            </button>
          </div>
          <div className="bg-gaming-800/50 p-6 rounded-lg border border-gaming-700 backdrop-blur-sm">
            <TopGames />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discover;