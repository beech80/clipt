import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from 'lucide-react';
import { igdbService } from '@/services/igdbService';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface FeaturedCarouselProps {
  searchTerm?: string | null;
  onResultClick?: (game: any) => void;
}

export function FeaturedCarousel({ searchTerm: initialSearchTerm = '', onResultClick }: FeaturedCarouselProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm || '');

  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['game-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.trim() === '') {
        console.log('Search term is empty, returning empty results');
        return [];
      }
      try {
        console.log('Searching games with term:', searchTerm);
        return await igdbService.searchGames(searchTerm);
      } catch (error) {
        console.error('Error searching games:', error);
        return [];
      }
    },
    enabled: searchTerm.length > 2,
    retry: 1
  });

  useEffect(() => {
    if (error) {
      console.error('Search error:', error);
      toast.error("Failed to search games. Please try again.");
    }
  }, [error]);

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleResultClick = (game: any) => {
    if (onResultClick) {
      onResultClick(game);
    } else {
      navigate(`/game/${game.id}`);
      toast.success(`Opening ${game.name}`);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value || '';
    setSearchTerm(newValue);
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
          onChange={handleSearchChange}
        />
      </div>

      {effectiveSearchTerm.length > 2 && (
        <div className="relative">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
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
                          Rating: {Math.round(Number(game.rating))}%
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
          ) : effectiveSearchTerm.length > 2 && (
            <div className="text-center py-8 text-orange-400">
              {searchResults && searchResults.length === 0 ? `No games found matching "${effectiveSearchTerm}"` : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
