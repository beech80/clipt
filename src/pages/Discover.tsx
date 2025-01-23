import { GameGrid } from "@/components/discover/GameGrid";
import { GameSearch } from "@/components/discover/GameSearch";
import { useState } from "react";

export default function Discover() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("popular");

  return (
    <div className="min-h-screen bg-gaming-800 text-white">
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold gaming-gradient-text">
            Discover Games
          </h1>
        </div>

        <GameSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        <GameGrid />
      </div>
    </div>
  );
}