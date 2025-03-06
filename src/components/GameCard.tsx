import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { AspectRatio } from "@/components/ui/aspect-ratio";

// Define image fallbacks for specific games by name (in lowercase for easy matching)
const IMAGE_FALLBACKS: Record<string, string> = {
  'call of duty': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wkb.jpg',
  'call of duty 2': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1y3s.jpg',
  'call of duty 3': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1y3t.jpg',
  'counter-strike': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1ycw.jpg',
  'forza horizon 5': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3wk8.jpg',
  'halo infinite': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg',
  'fallout 3': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2uoh.jpg',
  'fortnite': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2326.jpg',
  'minecraft': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2dnx.jpg',
  'the legend of zelda': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3wkh.jpg',
  'red dead redemption 2': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1q1f.jpg',
  'grand theft auto v': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2ldp.jpg',
  'elden ring': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg',
  'fifa 23': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co52l6.jpg',
  'cyberpunk 2077': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4hk8.jpg',
};

// Default fallback URL if specific game fallback isn't found
const DEFAULT_IMAGE = 'https://placehold.co/600x900/1E293B/FFFFFF?text=Game';

export interface GameCardProps {
  id: string;
  name: string;
  cover_url?: string;
  post_count: number;
  className?: string;
}

export const GameCard = ({ id, name, cover_url, post_count, className }: GameCardProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  // Format and validate the image URL on mount and when cover_url changes
  useEffect(() => {
    let url = cover_url || '';
    console.log(`GameCard initial URL for ${name}:`, url);
    
    // If no URL or previous error, use fallbacks
    if (!url || imageError) {
      const lowercaseName = name.toLowerCase();
      
      // Find a matching fallback by checking if the game name contains any fallback key
      const fallbackEntry = Object.entries(IMAGE_FALLBACKS).find(
        ([key]) => lowercaseName.includes(key)
      );
      
      if (fallbackEntry) {
        url = fallbackEntry[1];
        console.log(`Using fallback for ${name}:`, url);
      } else {
        url = DEFAULT_IMAGE;
        console.log(`Using default image for ${name}`);
      }
    }
    
    // Fix URL protocol and formatting
    if (url.startsWith('//')) {
      url = 'https:' + url;
    } else if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    
    // Ensure IGDB images use t_cover_big format
    if (url.includes('igdb.com')) {
      url = url.replace('t_thumb', 't_cover_big').replace('t_micro', 't_cover_big');
    }
    
    // Add cache buster
    const timestamp = Date.now();
    url = url.includes('?') ? `${url}&t=${timestamp}` : `${url}?t=${timestamp}`;
    
    console.log(`Final image URL for ${name}:`, url);
    setImageUrl(url);
  }, [cover_url, name, imageError]);

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
        {imageUrl && (
          <img
            src={imageUrl}
            alt={name}
            className="object-cover w-full h-full rounded-t-md group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              console.error(`Image error for ${name}:`, e);
              // Only reset if we haven't already tried a fallback
              if (!imageError) {
                setImageError(true);
              }
            }}
          />
        )}
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
