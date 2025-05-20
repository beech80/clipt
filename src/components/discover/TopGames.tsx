import React, { useState, useEffect, useCallback, useRef } from 'react';
import { IGDBGame } from '@/services/igdbService';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Loader2 } from 'lucide-react';
import { igdbService } from '@/services/igdbService';
import { useInView } from 'react-intersection-observer';

interface TopGamesProps {
  filter: 'top_rated' | 'most_played' | 'most_watched';
}

export const TopGames = ({ filter }: TopGamesProps) => {
  const navigate = useNavigate();
  const [games, setGames] = useState<IGDBGame[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { ref: loadMoreRef, inView } = useInView();

  const loadGames = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    try {
      const newGames = await igdbService.getTopGames(filter, page, 12);
      if (newGames.length === 0) {
        setHasMore(false);
      } else {
        setGames(prev => [...prev, ...newGames]);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter, page, isLoading, hasMore]);

  // Reset games when filter changes
  useEffect(() => {
    setGames([]);
    setPage(1);
    setHasMore(true);
  }, [filter]);

  // Initial load
  useEffect(() => {
    if (page === 1) {
      loadGames();
    }
  }, [page, loadGames]);

  // Load more when scrolled to the bottom
  useEffect(() => {
    if (inView) {
      loadGames();
    }
  }, [inView, loadGames]);

  if (games.length === 0 && isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="h-48 animate-pulse bg-gaming-800/50" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game) => (
          <Card
            key={game.id}
            className="relative overflow-hidden cursor-pointer group h-48"
            onClick={() => navigate(`/game/${game.id}`)}
          >
            {game.cover?.url ? (
              <img
                src={game.cover.url}
                alt={game.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gaming-800">
                <Gamepad2 className="w-12 h-12 text-gaming-500" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
              <h3 className="text-lg font-semibold text-white">{game.name}</h3>
              <p className="text-xs text-white/90 mt-1">CLIPTS</p>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Loading indicator */}
      {hasMore && (
        <div 
          ref={loadMoreRef} 
          className="flex justify-center items-center p-8"
        >
          {isLoading && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
              <p className="text-sm text-muted-foreground">Loading more games...</p>
            </div>
          )}
        </div>
      )}
      
      {!hasMore && games.length > 0 && (
        <p className="text-center text-sm text-muted-foreground p-4">
          No more games to load
        </p>
      )}
    </>
  );
};
