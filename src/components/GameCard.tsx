import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

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
};

// Default fallback URL if specific game fallback isn't found
const DEFAULT_IMAGE = 'https://placehold.co/600x900/1E293B/FFFFFF?text=Game';

export interface GameCardProps {
  id: string;
  name: string;
  cover_url?: string;  // Changed from coverUrl to cover_url to match API
  post_count: number;  // Changed from postCount to post_count to match API
  className?: string;
}

export const GameCard = ({ id, name, cover_url, post_count, className }: GameCardProps) => {
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/games/${id}`);
  };

  // Get the appropriate image URL with fallbacks
  const getImageUrl = (): string => {
    // If we already tried the original and got an error, go straight to fallbacks
    if (imageError || !cover_url) {
      // Check for fallback by converting name to lowercase
      const lowercaseName = name.toLowerCase();
      const fallbackUrl = Object.entries(IMAGE_FALLBACKS).find(
        ([key]) => lowercaseName.includes(key)
      )?.[1];
      
      // Use specific fallback or default with cache buster
      return fallbackUrl ? 
        `${fallbackUrl}?t=${Date.now()}` : 
        `${DEFAULT_IMAGE}&t=${Date.now()}`;
    }

    // Ensure URL has https protocol
    let url = cover_url;
    if (url.startsWith('//')) {
      url = 'https:' + url;
    } else if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    // Add cache buster
    return `${url}?t=${Date.now()}`;
  };

  // Get image URL
  const imageUrl = getImageUrl();
  
  // Log image URL for debugging
  console.log(`GameCard ${name} using image: ${imageUrl}`);

  return (
    <Card 
      className={cn(
        "cursor-pointer overflow-hidden shadow-md transition-all hover:shadow-lg bg-indigo-950/40 border-indigo-500/30 hover:border-indigo-400",
        className
      )}
      onClick={handleClick}
    >
      <div className="relative pb-[150%] overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => {
            console.log(`Error loading image for ${name}: ${imageUrl}`);
            setImageError(true);
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <h3 className="text-white font-bold truncate">{name}</h3>
          <Badge variant="outline" className="mt-1 bg-primary/20 text-primary-foreground">
            {post_count} clips
          </Badge>
        </div>
      </div>
    </Card>
  );
};
