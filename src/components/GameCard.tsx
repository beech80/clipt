import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Gamepad2 } from 'lucide-react';

// Default game image - using a local placeholder that's guaranteed to exist
const DEFAULT_GAME_IMAGE = '/placeholder.svg';

// Map game names to their respective image assets in public
const getGameImageUrl = (gameName: string): string => {
  // Normalize the game name to lowercase for case-insensitive matching
  const name = gameName.toLowerCase();
  
  // Specific popular game image matches (add more as needed)
  if (name.includes('call of duty')) return '/img/games/cod.jpg';
  if (name.includes('halo')) return '/img/games/halo.jpg';
  if (name.includes('fortnite')) return '/img/games/fortnite.jpg';
  if (name.includes('minecraft')) return '/img/games/minecraft.jpg';
  if (name.includes('gta') || name.includes('grand theft auto') || name.includes('san andreas')) 
    return '/img/games/gta.jpg';
  if (name.includes('fifa')) return '/img/games/fifa.jpg';
  if (name.includes('fallout')) return '/img/games/fallout.jpg';
  if (name.includes('assassin')) return '/img/games/assassins-creed.jpg';
  if (name.includes('zelda')) return '/img/games/zelda.jpg';
  if (name.includes('elder scrolls') || name.includes('skyrim')) return '/img/games/skyrim.jpg';
  if (name.includes('witcher')) return '/img/games/witcher.jpg';
  if (name.includes('overwatch')) return '/img/games/overwatch.jpg';
  if (name.includes('league of legends')) return '/img/games/lol.jpg';
  if (name.includes('dota')) return '/img/games/dota.jpg';
  if (name.includes('cyberpunk')) return '/img/games/cyberpunk.jpg';
  if (name.includes('elden ring')) return '/img/games/elden-ring.jpg';
  
  // Add game-specific matches for games shown in the screenshots
  if (name.includes('domino')) return '/img/games/domino.jpg';
  if (name.includes('pixadom')) return '/img/games/pixadom.jpg';
  if (name.includes('lizard')) return '/img/games/lizards.jpg';
  if (name.includes('chrono')) return '/img/games/chrono.jpg';
  if (name.includes('imperium') || name.includes('galactica')) return '/img/games/imperium.jpg';
  
  // Generic fallbacks by game genre/theme
  if (name.includes('war') || name.includes('combat') || name.includes('battlefield')) 
    return '/img/games/shooter.jpg';
  if (name.includes('rpg') || name.includes('role')) return '/img/games/rpg.jpg';
  if (name.includes('strategy')) return '/img/games/strategy.jpg';
  if (name.includes('sports')) return '/img/games/sports.jpg';
  if (name.includes('racing')) return '/img/games/racing.jpg';
  
  // Default placeholder for games with no match
  return DEFAULT_GAME_IMAGE;
};

export interface GameCardProps {
  id: string;
  name: string;
  cover_url?: string;
  post_count: number;
  className?: string;
}

export const GameCard = ({ id, name, cover_url, post_count, className }: GameCardProps) => {
  // True by default to show consistent styling without flickering
  const [imageError, setImageError] = useState(true);
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/games/${id}`);
  };

  return (
    <Card 
      className={cn(
        "group overflow-hidden bg-indigo-950/40 border-indigo-500/30 hover:border-indigo-400 transition-all cursor-pointer",
        className
      )}
      onClick={handleClick}
    >
      <AspectRatio ratio={3/4}>
        {!imageError && cover_url ? (
          <img
            src={cover_url}
            alt={name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          // Xbox-style game card fallback design
          <div className="w-full h-full bg-gradient-to-b from-indigo-900/60 to-indigo-950/90 flex flex-col items-center justify-center p-4">
            <Gamepad2 size={48} className="text-indigo-400 mb-4" />
            <div className="text-center">
              <div className="bg-indigo-500/20 rounded-sm w-12 h-2 mx-auto mb-3"></div>
              <div className="bg-indigo-500/20 rounded-sm w-20 h-2 mx-auto mb-3"></div>
              <div className="bg-indigo-500/20 rounded-sm w-16 h-2 mx-auto"></div>
            </div>
          </div>
        )}
        
        {/* Game info overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 p-3">
          <h3 className="text-md font-bold text-white truncate max-w-full">{name}</h3>
          <p className="text-xs text-indigo-300">
            {post_count === 1 ? '1 clip' : `${post_count} clips`}
          </p>
        </div>
      </AspectRatio>
    </Card>
  );
};
