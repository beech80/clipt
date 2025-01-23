import { useState } from "react";
import { GameGrid } from "@/components/discover/GameGrid";
import { GameSearch } from "@/components/discover/GameSearch";
import GameBoyControls from "@/components/GameBoyControls";

const Discover = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");

  return (
    <div className="min-h-screen bg-gaming-800 text-white">
      <div className="mx-auto max-w-4xl space-y-8 pb-40 px-4">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold gaming-gradient-text">Discover Games</h1>
          <p className="text-gaming-300">
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