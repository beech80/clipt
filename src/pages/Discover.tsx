import { useState } from "react";
import { GameGrid } from "@/components/discover/GameGrid";
import { GameSearch } from "@/components/discover/GameSearch";
import GameBoyControls from "@/components/GameBoyControls";
import { MainNav } from "@/components/MainNav";

const Discover = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <div className="mx-auto max-w-4xl space-y-8 pb-40 px-4">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Discover Games</h1>
          <p className="text-muted-foreground">
            Browse and search through our collection of games and watch the best clips
          </p>
        </div>

        <GameSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        <GameGrid />
        
        <GameBoyControls />
      </div>
    </div>
  );
};

export default Discover;