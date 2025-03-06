import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// Define image fallbacks for specific games by name
const IMAGE_FALLBACKS: Record<string, string> = {
  'Call of Duty': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wkb.jpg',
  'Call of Duty 2': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1y3s.jpg',
  'Call of Duty 3': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1y3t.jpg',
  'Counter-Strike': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1ycw.jpg',
  'Forza Horizon 5': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3wk8.jpg',
  'Halo Infinite': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg',
  'Fallout 3': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2uoh.jpg',
  'Fortnite': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2326.jpg',
  'Minecraft': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2dnx.jpg',
  'The Legend of Zelda': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3wkh.jpg',
  'Red Dead Redemption 2': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1q1f.jpg',
  'Grand Theft Auto V': 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2ldp.jpg',
};

// Default fallback URL if specific game fallback isn't found
const DEFAULT_IMAGE = 'https://placehold.co/600x900/1E293B/FFFFFF?text=Game';

interface GameCardProps {
  id: string;
  name: string;
  coverUrl?: string;
  postCount: number;
  className?: string;
}

const GameCard = ({ id, name, coverUrl, postCount, className }: GameCardProps) => {
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/games/${id}`);
  };

  // Get the appropriate image URL with fallbacks
  const getImageUrl = (): string => {
    // If we already tried the original and got an error, go straight to fallbacks
    if (imageError || !coverUrl) {
      // Use specific fallback for this game if available
      return IMAGE_FALLBACKS[name] ? 
        `${IMAGE_FALLBACKS[name]}?t=${Date.now()}` : 
        `${DEFAULT_IMAGE}&t=${Date.now()}`;
    }

    // Ensure URL has https protocol
    let url = coverUrl;
    if (url.startsWith('//')) {
      url = 'https:' + url;
    } else if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    // Add cache buster
    return `${url}?t=${Date.now()}`;
  };

  // Log all image attempts for debugging
  const imageUrl = getImageUrl();
  console.log(`GameCard ${name} using image: ${imageUrl}`);

  return (
    <Card 
      className={cn(
        "cursor-pointer overflow-hidden shadow-md transition-all hover:shadow-lg",
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
            console.log(`Error loading image for ${name}`);
            setImageError(true);
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <h3 className="text-white font-bold truncate">{name}</h3>
          <Badge variant="outline" className="mt-1 bg-primary/20 text-primary-foreground">
            {postCount} clips
          </Badge>
        </div>
      </div>
    </Card>
  );
};

export default GameCard;
