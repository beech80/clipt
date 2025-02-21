
import React from 'react';
import { IGDBGame } from '@/services/igdbService';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface TopGamesProps {
  games?: IGDBGame[];
}

export const TopGames = ({ games }: TopGamesProps) => {
  const navigate = useNavigate();

  if (!games) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="h-48 animate-pulse bg-gaming-800/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {games.map((game) => (
        <Card
          key={game.id}
          className="relative overflow-hidden cursor-pointer group"
          onClick={() => navigate(`/game/${game.id}`)}
        >
          <img
            src={game.cover?.url.replace('thumb', 'cover_big') || '/placeholder.svg'}
            alt={game.name}
            className="w-full h-48 object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
            <h3 className="text-lg font-semibold text-white">{game.name}</h3>
            {game.rating && (
              <p className="text-sm text-white/80">Rating: {Math.round(game.rating)}%</p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};
