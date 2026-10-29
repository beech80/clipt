import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Gamepad2 } from 'lucide-react';
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface GameCardProps {
  id: string;
  name: string;
  coverUrl?: string;
  postCount?: number;
  onClick?: () => void;
}

const GameCard = ({ id, name, coverUrl, postCount, onClick }: GameCardProps) => {
  const [showFallback, setShowFallback] = useState(false);
  const [finalCoverUrl, setFinalCoverUrl] = useState<string | undefined>(coverUrl);
  
  useEffect(() => {
    const candidate=coverUrl?.startsWith('//')?'https:'+coverUrl:coverUrl;
    setFinalCoverUrl(candidate&&(/^https:\/\//i.test(candidate)||candidate.startsWith('/')&&!candidate.startsWith('//'))?candidate:undefined);
    setShowFallback(false);
  }, [coverUrl]);
  
  // Ensure we format post count correctly
  const formatPostCount = (count: number) => {
    if (count === 1) return '1 clipt';
    return `${count} clipts`;
  };

  return (
    <Card 
      className="group overflow-hidden bg-indigo-950/40 border-indigo-500/30 hover:border-indigo-400 transition-all cursor-pointer relative" 
      onClick={onClick} role={onClick?"button":undefined} tabIndex={onClick?0:undefined} aria-label={onClick?`View game ${name}`:undefined}
      onKeyDown={event=>{if(onClick&&(event.key==='Enter'||event.key===' ')){event.preventDefault();onClick();}}}
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
            <div className="w-full h-full flex items-center justify-center bg-indigo-950"><Gamepad2 className="h-12 w-12 text-purple-300" aria-hidden="true"/><span className="sr-only">No cover available for {name}</span>            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </AspectRatio>
        
        <div className="absolute bottom-0 left-0 p-3">
          <h3 className="text-md font-bold text-white truncate max-w-full">{name}</h3>
          {postCount!==undefined&&<p className="text-xs text-indigo-300">{formatPostCount(postCount)}</p>}
        </div>
      </div>
    </Card>
  );
};

export default GameCard;
