
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { IGDBGame, igdbService } from "@/services/igdbService";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDebounce } from "@/hooks/use-debounce";

export function FeaturedCarousel() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['game-search', debouncedSearch],
    queryFn: () => igdbService.searchGames(debouncedSearch),
    enabled: debouncedSearch.length > 2,
  });

  const handleGameClick = (gameId: number) => {
    navigate(`/game/${gameId}`);
  };

  return (
    <div className="space-y-6">
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gaming-400 transition-colors group-focus-within:text-gaming-200" />
        <Input
          type="search"
          placeholder="Search any game..."
          className="w-full pl-10 py-6 text-lg bg-gaming-800/50 border-gaming-600 rounded-xl 
                     placeholder:text-gaming-500 focus:ring-2 focus:ring-gaming-400 
                     transition-all duration-300 hover:bg-gaming-800/70"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {searchTerm.length > 2 && (
        <div className="relative">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {searchResults.map((game: IGDBGame) => (
                <Card
                  key={game.id}
                  className="p-4 cursor-pointer hover:bg-gaming-800/50 transition-colors"
                  onClick={() => handleGameClick(game.id)}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Avatar className="w-24 h-24 rounded-lg">
                      <AvatarImage 
                        src={game.cover ? game.cover.url.replace('thumb', 'cover_big') : ''} 
                        alt={game.name} 
                      />
                      <AvatarFallback className="text-2xl bg-gaming-800">
                        {game.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <h3 className="font-semibold text-gaming-100">{game.name}</h3>
                      {game.rating && (
                        <div className="text-sm text-gaming-400">
                          Rating: {Math.round(game.rating)}%
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : searchTerm.length > 2 && (
            <div className="text-center py-8 text-gaming-400">
              No games found matching "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

<lov-write file_path="src/hooks/use-debounce.ts">
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
