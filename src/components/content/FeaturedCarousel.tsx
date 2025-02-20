
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { IGDBGame, igdbService } from "@/services/igdbService";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export function FeaturedCarousel() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['game-search', searchTerm],
    queryFn: () => igdbService.searchGames(searchTerm),
    enabled: searchTerm.length > 2,
    retry: 1,
    gcTime: 1000 * 60 * 5, // Keep cached for 5 minutes
    meta: {
      onError: (error: Error) => {
        console.error('Search error:', error);
        toast.error("Failed to search games. Please try again.");
      }
    }
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
          placeholder="Search games across all platforms..."
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
          ) : error ? (
            <div className="text-center py-8 text-red-400">
              Unable to search games at the moment. Please try again later.
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {searchResults.map((game: IGDBGame) => (
                <Card
                  key={game.id}
                  className="p-4 cursor-pointer bg-gaming-800/50 hover:bg-gaming-700/50 transition-colors border-gaming-600"
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
                      {game.genres && game.genres.length > 0 && (
                        <div className="text-xs text-gaming-500 mt-1">
                          {game.genres[0].name}
                        </div>
                      )}
                      {game.first_release_date && (
                        <div className="text-xs text-gaming-500">
                          Released: {new Date(game.first_release_date * 1000).getFullYear()}
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
