import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sword, Shield, Trophy, Timer } from 'lucide-react';

interface GamingOverlayProps {
  streamId: string;
  transparent?: boolean;
}

export function GamingOverlay({ streamId, transparent = false }: GamingOverlayProps) {
  const [stats, setStats] = useState({
    kills: 0,
    deaths: 0,
    assists: 0,
    duration: '00:00:00'
  });

  useEffect(() => {
    const channel = supabase
      .channel('gaming-stats')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stream_game_stats',
          filter: `stream_id=eq.${streamId}`
        },
        (payload) => {
          if (payload.new) {
            setStats({
              kills: payload.new.kills,
              deaths: payload.new.deaths,
              assists: payload.new.assists,
              duration: payload.new.game_duration || '00:00:00'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  const baseClasses = transparent 
    ? 'bg-opacity-50 backdrop-blur-sm' 
    : 'bg-background/95';

  return (
    <div className={`fixed top-4 right-4 space-y-2 ${baseClasses} p-4 rounded-lg shadow-lg`}>
      <div className="flex items-center space-x-2">
        <Sword className="h-4 w-4 text-red-500" />
        <Badge variant="secondary">{stats.kills}</Badge>
        <span className="text-sm text-muted-foreground">/</span>
        <Badge variant="destructive">{stats.deaths}</Badge>
        <span className="text-sm text-muted-foreground">/</span>
        <Badge variant="outline">{stats.assists}</Badge>
      </div>

      <div className="flex items-center space-x-2">
        <Timer className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium">{stats.duration}</span>
      </div>
    </div>
  );
}