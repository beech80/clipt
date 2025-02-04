import React from 'react';
import { FeaturedCarousel } from "@/components/content/FeaturedCarousel";
import { SearchBar } from "@/components/SearchBar";

const Discover = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <SearchBar />
        <FeaturedCarousel />
      </div>
    </div>
  );
};

export default Discover;