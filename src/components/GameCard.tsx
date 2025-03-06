import React from 'react';
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

const GameCard = ({ id, name, coverUrl, postCount = 0, onClick }: GameCardProps) => {
  return (
    <Card 
      className="group overflow-hidden bg-indigo-950/40 border-indigo-500/30 hover:border-indigo-400 transition-all cursor-pointer relative" 
      onClick={onClick}
    >
      <div className="relative">
        <AspectRatio ratio={3/4}>
          {coverUrl ? (
            <img 
              src={coverUrl} 
              alt={name}
              className="object-cover w-full h-full rounded-t-md group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center">
              <Trophy className="w-12 h-12 text-indigo-300" />
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
