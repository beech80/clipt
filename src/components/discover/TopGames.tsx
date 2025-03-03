import React from 'react';
import { IGDBGame } from '@/services/igdbService';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Gamepad2 } from 'lucide-react';

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
            {/* Removing rating display
            {game.rating && (
              <p className="text-sm text-white/80">Rating: {Math.round(game.rating)}%</p>
            )}
            */}
          </div>
        </Card>
      ))}
    </div>
  );
};
