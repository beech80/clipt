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

// Game-specific fallback images
const GAME_FALLBACKS: Record<string, string> = {
  'call of duty': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wkb.jpg',
  'call of duty 2': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1y3s.jpg',
  'call of duty 3': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1y3t.jpg',
  'counter-strike': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1ycw.jpg',
  'forza horizon 5': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3wk8.jpg',
  'halo infinite': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg',
  'fifa': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co52l6.jpg',
  'elden ring': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4hk8.jpg',
};

// Generic fallback covers for other games
const GENERIC_FALLBACKS = [
  'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg', // Halo
  'https://images.igdb.com/igdb/image/upload/t_cover_big/co3wk8.jpg', // Forza
  'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wkb.jpg', // COD
  'https://images.igdb.com/igdb/image/upload/t_cover_big/co52l6.jpg', // FIFA
  'https://images.igdb.com/igdb/image/upload/t_cover_big/co4hk8.jpg', // Elden Ring
];

const GameCard = ({ id, name, coverUrl, postCount = 0, onClick }: GameCardProps) => {
  const [showFallback, setShowFallback] = useState(!coverUrl);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    if (!coverUrl || showFallback) {
      const lowerName = name.toLowerCase();
      
      // First try exact matches for specific games
      for (const [gameName, fallbackUrl] of Object.entries(GAME_FALLBACKS)) {
        if (lowerName.includes(gameName)) {
          setImageUrl(fallbackUrl);
          return;
        }
      }
      
      // If no match, use a generic fallback based on first letter
      const firstChar = name.charAt(0).toLowerCase();
      const charCode = firstChar.charCodeAt(0);
      const fallbackIndex = charCode % GENERIC_FALLBACKS.length;
      setImageUrl(GENERIC_FALLBACKS[fallbackIndex]);
    } else {
      // Handle provided coverUrl
      let url = coverUrl;
      
      // Fix protocol-relative URLs
      if (url.startsWith('//')) {
        url = `https:${url}`;
      } 
      // Add protocol if missing
      else if (!url.includes('://') && !url.startsWith('/')) {
        url = `https://${url}`;
      }
      
      // Force https for igdb images
      if (url.includes('igdb.com')) {
        url = url.replace('http://', 'https://');
      }
      
      // Add a cache-busting timestamp
      const timestamp = new Date().getTime();
      url = url.includes('?') ? `${url}&t=${timestamp}` : `${url}?t=${timestamp}`;
      
      setImageUrl(url);
    }
  }, [coverUrl, name, showFallback]);

  return (
    <Card 
      className="group overflow-hidden bg-indigo-950/40 border-indigo-500/30 hover:border-indigo-400 transition-all cursor-pointer relative" 
      onClick={onClick}
    >
      <div className="relative">
        <AspectRatio ratio={3/4}>
          <img 
            src={imageUrl} 
            alt={name}
            className="object-cover w-full h-full rounded-t-md group-hover:scale-105 transition-transform duration-300"
            onError={() => {
              console.log(`Image failed to load for game "${name}", URL: ${imageUrl}`);
              setShowFallback(true);
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </AspectRatio>
        
        <div className="absolute bottom-0 left-0 p-3">
          <h3 className="text-md font-bold text-white truncate max-w-full">{name}</h3>
          <p className="text-xs text-indigo-300">
            {postCount === 1 ? '1 clipt' : `${postCount} clipts`}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default GameCard;
