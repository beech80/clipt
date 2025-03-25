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
          {/* LIVE badge removed as requested */}
        </div>
        
        <div className="text-indigo-300 text-sm truncate">
          @{username}
        </div>
        
        {game && (
          <div className="mt-1 text-xs text-gray-400 truncate">
            <span className="inline-flex items-center gap-1">
              <Radio size={12} /> {game}
            </span>
          </div>
        )}
        
        {/* Follower count removed as requested */}
      </div>
    </Card>
  );
};

export default StreamerCard;
