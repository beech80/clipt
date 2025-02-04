import React, { useState } from 'react';
import { GameGrid } from "@/components/discover/GameGrid";
import { GameSearch } from "@/components/discover/GameSearch";
import { TopGames } from "@/components/discover/TopGames";
import GameBoyControls from '@/components/GameBoyControls';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      <h1 className="text-4xl font-bold mb-8 text-primary">Discover</h1>
      
      <Tabs defaultValue="games" className="mb-8">
        <TabsList className="w-full">
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="clips">Clips</TabsTrigger>
        </TabsList>
        
        <TabsContent value="games">
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Top Games</h2>
            <TopGames />
          </Card>
          
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
        </TabsContent>

        <TabsContent value="people">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Find Creators</h2>
            {/* People search and results will be implemented here */}
            <p className="text-muted-foreground">Coming soon...</p>
          </Card>
        </TabsContent>

        <TabsContent value="clips">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Popular Clips</h2>
            {/* Clips search and results will be implemented here */}
            <p className="text-muted-foreground">Coming soon...</p>
          </Card>
        </TabsContent>
      </Tabs>

      <GameBoyControls />
    </div>
  );
};

export default Discover;