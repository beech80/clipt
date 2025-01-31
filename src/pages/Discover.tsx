import React, { useState } from 'react';
import { GameGrid } from "@/components/discover/GameGrid";
import { GameSearch } from "@/components/discover/GameSearch";

const Discover = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-gaming-100">Discover Games</h1>
      
      <GameSearch 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
      
      <GameGrid 
        searchTerm={searchTerm}
        sortBy={sortBy}
      />
    </div>
  );
};

export default Discover;