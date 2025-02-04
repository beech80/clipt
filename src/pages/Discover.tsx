import React from 'react';
import { FeaturedCarousel } from "@/components/content/FeaturedCarousel";
import { TopGames } from "@/components/discover/TopGames";

const Discover = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <FeaturedCarousel />
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Featured Games</h2>
        <TopGames />
      </div>
    </div>
  );
};

export default Discover;