import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { AspectRatio } from "@/components/ui/aspect-ratio";

// Define a set of reliable fallback images for games
const GAME_IMAGES: Record<string, string> = {
  // Popular games with reliable image URLs
  'halo': 'https://i.imgur.com/7FkYnBH.jpg',
  'call of duty': 'https://i.imgur.com/s9BU4jj.jpg',
  'minecraft': 'https://i.imgur.com/l5uxOhk.jpg',
  'fortnite': 'https://i.imgur.com/KjiOy5G.jpg',
  'league of legends': 'https://i.imgur.com/lttQS5f.jpg',
  'grand theft auto': 'https://i.imgur.com/i0Qldng.jpg',
  'fifa': 'https://i.imgur.com/JLxULpV.jpg',
  'overwatch': 'https://i.imgur.com/zd0Qdwg.jpg',
  'fallout': 'https://i.imgur.com/6TLNWB8.jpg',
  'zelda': 'https://i.imgur.com/gIeqbwj.jpg',
  'cyberpunk': 'https://i.imgur.com/ixoZFmH.jpg',
  'elden ring': 'https://i.imgur.com/UcApkXd.jpg',
  
  // Specific games from the screenshot
  'domino earning world': 'https://i.imgur.com/Z3bPhDC.jpg',
  'san andreas multiplayer': 'https://i.imgur.com/byeONkq.jpg',
  'imperium galactica': 'https://i.imgur.com/4rKpkJA.jpg',
  'pixadom': 'https://i.imgur.com/OD5zEcn.jpg',
  'lizards must die': 'https://i.imgur.com/H2wVLsD.jpg',
  'chrono trigger': 'https://i.imgur.com/ZE3MuaV.jpg'
};

// Default fallback image if no match is found
const DEFAULT_IMAGE = 'https://i.imgur.com/Y3VEZII.jpg';

export interface GameCardProps {
  id: string;
  name: string;
  cover_url?: string;
  post_count: number;
  className?: string;
}

export const GameCard = ({ id, name, cover_url, post_count, className }: GameCardProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Function to find the best matching image for this game
    const findBestMatchImage = (gameName: string): string => {
      const lowerName = gameName.toLowerCase();
      
      // First try exact match
      if (GAME_IMAGES[lowerName]) {
        return GAME_IMAGES[lowerName];
      }
      
      // Then try partial match
      const partialMatch = Object.keys(GAME_IMAGES).find(key => 
        lowerName.includes(key) || key.includes(lowerName)
      );
      
      if (partialMatch) {
        return GAME_IMAGES[partialMatch];
      }
      
      // If all else fails, use default
      return DEFAULT_IMAGE;
    };
    
    // First try the cover_url from API if available
    if (cover_url && cover_url.startsWith('http')) {
      console.log(`Using API image URL for ${name}:`, cover_url);
      setImageUrl(cover_url);
    } else {
      // Otherwise use our reliable local images
      const matchedImage = findBestMatchImage(name);
      console.log(`Using fallback image for ${name}:`, matchedImage);
      setImageUrl(matchedImage);
    }
  }, [name, cover_url]);

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
            onError={() => {
              console.error(`Error loading image for ${name}, falling back to default`);
              setImageUrl(DEFAULT_IMAGE);
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
