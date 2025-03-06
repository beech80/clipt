import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Trophy } from 'lucide-react';
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface GameCardProps {
  id: string;
  name: string;
  coverUrl?: string;
  postCount?: number;
  onClick?: () => void;
}

// Fallback game covers based on first letter of game name
const fallbackCovers = [
  'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg', // Halo Infinite
  'https://images.igdb.com/igdb/image/upload/t_cover_big/co3wk8.jpg', // Forza
  'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wkb.jpg', // COD
  'https://images.igdb.com/igdb/image/upload/t_cover_big/co52l6.jpg', // FIFA
  'https://images.igdb.com/igdb/image/upload/t_cover_big/co4hk8.jpg', // Cyberpunk
];

const GameCard = ({ id, name, coverUrl, postCount = 0, onClick }: GameCardProps) => {
  const [showFallback, setShowFallback] = useState(false);
  
  // Generate a consistent fallback image based on the game name
  const getFallbackImage = () => {
    if (!name) return fallbackCovers[0];
    const firstChar = name.charAt(0).toLowerCase();
    const index = firstChar.charCodeAt(0) % fallbackCovers.length;
    return fallbackCovers[index];
  };

  return (
    <Card 
      className="group overflow-hidden bg-indigo-950/40 border-indigo-500/30 hover:border-indigo-400 transition-all cursor-pointer relative" 
      onClick={onClick}
    >
      <div className="relative">
        <AspectRatio ratio={3/4}>
          {coverUrl && !showFallback ? (
            <img 
              src={coverUrl} 
              alt={name}
              className="object-cover w-full h-full rounded-t-md group-hover:scale-105 transition-transform duration-300"
              onError={() => setShowFallback(true)}
            />
          ) : (
            <div className="w-full h-full">
              <img 
                src={getFallbackImage()}
                alt={name}
                className="object-cover w-full h-full rounded-t-md group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </AspectRatio>
        
        <div className="absolute bottom-0 left-0 p-3">
          <h3 className="text-md font-bold text-white truncate max-w-full">{name}</h3>
          <p className="text-xs text-indigo-300">{postCount} clipts</p>
        </div>
      </div>
    </Card>
  );
};

export default GameCard;
