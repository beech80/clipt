import React from 'react';
import { Card } from "@/components/ui/card";
import { Tv, Radio } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface StreamerCardProps {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  streamingUrl?: string;
  game?: string;
  isLive?: boolean;
  onClick?: () => void;
}

const StreamerCard = ({ 
  id, 
  username, 
  displayName, 
  avatarUrl, 
  streamingUrl, 
  game, 
  isLive = false,
  onClick 
}: StreamerCardProps) => {
  const name = displayName || username || 'Anonymous';
  const initials = name.substring(0, 2).toUpperCase();

  return (
    <Card 
      className="flex gap-4 p-4 bg-indigo-950/40 border-indigo-500/30 hover:border-indigo-400 transition-all cursor-pointer" 
      onClick={onClick}
    >
      <Avatar className="w-14 h-14 border-2 border-indigo-500">
        <AvatarImage src={avatarUrl || ''} alt={name} />
        <AvatarFallback className="bg-gradient-to-br from-indigo-700 to-purple-700 text-white">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-white truncate">{name}</h3>
          {isLive && (
            <Badge variant="destructive" className="px-2 py-0 text-xs h-5 bg-red-600 hover:bg-red-700">
              LIVE
            </Badge>
          )}
        </div>
        
        <p className="text-sm text-indigo-300 truncate">@{username}</p>
        
        {game && (
          <div className="flex items-center gap-1 mt-2">
            <Radio className="w-3 h-3 text-indigo-400" />
            <span className="text-xs text-indigo-400">Playing {game}</span>
          </div>
        )}
        
        {streamingUrl && (
          <div className="flex items-center gap-1 mt-1">
            <Tv className="w-3 h-3 text-indigo-400" />
            <span className="text-xs text-indigo-400 truncate">{streamingUrl.replace(/https?:\/\//i, '')}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StreamerCard;
