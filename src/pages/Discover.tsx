import React, { useState } from 'react';
import { GameGrid } from "@/components/discover/GameGrid";
import { GameSearch } from "@/components/discover/GameSearch";
import { TopGames } from "@/components/discover/TopGames";
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
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Top Games</h2>
        <TopGames />
      </div>
      
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