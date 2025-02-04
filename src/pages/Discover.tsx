import React, { useState } from 'react';
import { GameGrid } from "@/components/discover/GameGrid";
import { GameSearch } from "@/components/discover/GameSearch";
import GameBoyControls from '@/components/GameBoyControls';

const Discover = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filters, setFilters] = useState({
    platform: 'all',
    ageRating: 'all',
    releaseYear: 'all',
    hasClips: false
  });

  return (
    <div className="container mx-auto px-4 py-8 pb-[200px]">
      <h1 className="text-4xl font-bold mb-8 text-gaming-100">Discover Games</h1>
      
      <GameSearch 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortBy={sortBy}
        onSortChange={setSortBy}
        filters={filters}
        onFiltersChange={setFilters}
      />
      
      <GameGrid 
        searchTerm={searchTerm}
        sortBy={sortBy}
        filters={filters}
      />

      <GameBoyControls />
    </div>
  );
};

export default Discover;