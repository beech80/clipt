import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Trophy, Gamepad } from 'lucide-react';
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
  const [showFallback, setShowFallback] = useState(!coverUrl);
  const [finalCoverUrl, setFinalCoverUrl] = useState<string | undefined>(coverUrl);
  
  useEffect(() => {
    try {
      // If coverUrl is undefined or null, use fallback
      if (!coverUrl) {
        setShowFallback(true);
        return;
      }

      // If coverUrl starts with // (protocol-relative URL), add https:
      if (coverUrl.startsWith('//')) {
        setFinalCoverUrl(`https:${coverUrl}`);
      } 
      // If coverUrl doesn't have protocol but doesn't start with //, add https://
      else if (!coverUrl.includes('://') && !coverUrl.startsWith('//')) {
        setFinalCoverUrl(`https://${coverUrl}`);
      } else {
        setFinalCoverUrl(coverUrl);
      }
      
      // Reset showFallback when coverUrl changes
      setShowFallback(false);
    } catch (error) {
      console.error('Error processing game cover URL:', error);
      setShowFallback(true);
    }
  }, [coverUrl]);

  // Get fallback cover based on name
  const getFallbackCover = () => {
    if (!name) return fallbackCovers[0];
    const index = name.charCodeAt(0) % fallbackCovers.length;
    return fallbackCovers[index];
  };

  return (
    <Card
      className="group border-0 shadow-lg overflow-hidden bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-0"
      onClick={onClick}
    >
      <div className="relative">
        <AspectRatio ratio={3/4} className="bg-indigo-950">
          {showFallback ? (
            <div className="absolute inset-0 flex items-center justify-center bg-indigo-950">
              <img 
                src={getFallbackCover()} 
                alt={name}
                className="w-full h-full object-cover opacity-80" 
              />
              <Gamepad className="absolute text-white/50" size={48} />
            </div>
          ) : (
            <img
              src={finalCoverUrl}
              alt={name}
              className="object-cover w-full h-full transition-transform group-hover:scale-105"
              onError={() => setShowFallback(true)}
            />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-all"></div>
          
          <div className="absolute bottom-0 w-full p-4">
            <h3 className="text-white font-bold pixel-font">{name}</h3>
            <div className="mt-2 flex justify-between items-center">
              <div className="bg-indigo-600/80 px-3 py-1 rounded-full text-xs text-white font-medium">
                View Game
              </div>
            </div>
          </div>
        </AspectRatio>
      </div>
    </Card>
  );
};

export default GameCard;
