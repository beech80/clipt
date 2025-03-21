import React, { useState, useEffect } from 'react';
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
  'https://images.igdb.com/igdb/image/upload/t_cover_big/co4hk8.jpg', // Elden Ring
  'https://images.igdb.com/igdb/image/upload/t_cover_big/co5vmg.jpg', // Legend of Zelda
];

const GameCard = ({ id, name, coverUrl, postCount = 0, onClick }: GameCardProps) => {
  const [showFallback, setShowFallback] = useState(false);
  const [finalCoverUrl, setFinalCoverUrl] = useState<string | undefined>(coverUrl);
  
  useEffect(() => {
    // If coverUrl starts with // (protocol-relative URL), add https:
    if (coverUrl && coverUrl.startsWith('//')) {
      setFinalCoverUrl(`https:${coverUrl}`);
    } 
    // If coverUrl doesn't have protocol but doesn't start with //, add https://
    else if (coverUrl && !coverUrl.includes('://') && !coverUrl.startsWith('//')) {
      setFinalCoverUrl(`https://${coverUrl}`);
    }
    // Reset showFallback when coverUrl changes
    setShowFallback(false);
  }, [coverUrl]);

  // Generate a consistent fallback image based on the game name
  const getFallbackImage = () => {
    if (!name) return fallbackCovers[0];
    const firstChar = name.charAt(0).toLowerCase();
    const index = firstChar.charCodeAt(0) % fallbackCovers.length;
    return fallbackCovers[index];
  };

  // Ensure we format post count correctly
  const formatPostCount = (count: number) => {
    if (count === 1) return '1 clipt';
    return `${count} clipts`;
  };

  return (
    <Card 
      className="group overflow-hidden bg-indigo-950/40 border-indigo-500/30 hover:border-indigo-400 transition-all cursor-pointer relative" 
      onClick={onClick}
    >
      <div className="relative">
        <AspectRatio ratio={3/4}>
          {finalCoverUrl && !showFallback ? (
            <img 
              src={finalCoverUrl} 
              alt={name}
              className="object-cover w-full h-full rounded-t-md group-hover:scale-105 transition-transform duration-300"
              onError={() => {
                console.log('Game cover image failed to load:', finalCoverUrl);
                setShowFallback(true);
              }}
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
          <p className="text-xs text-indigo-300">{formatPostCount(postCount || 0)}</p>
        </div>
      </div>
    </Card>
  );
};

export default GameCard;
