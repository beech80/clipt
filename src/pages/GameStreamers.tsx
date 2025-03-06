import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Gamepad, Users, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import StreamerCard from '@/components/StreamerCard';
import { Card } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface Game {
  id: string;
  name: string;
  cover_url: string;
  description?: string;
}

interface Streamer {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  follower_count: number;
}

const GameStreamers = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);

  // Fetch game details
  const { isLoading: gameLoading } = useQuery({
    queryKey: ['game', gameId],
    queryFn: async () => {
      // Check if this is an IGDB game first
      if (gameId?.startsWith('igdb-')) {
        try {
          const igdbId = gameId.replace('igdb-', '');
          const { igdbService } = await import('@/services/igdbService');
          const gameDetails = await igdbService.getGameById(igdbId);
          
          if (gameDetails) {
            const formattedGame = {
              id: gameId,
              name: gameDetails.name,
              cover_url: gameDetails.cover?.url 
                ? `https:${gameDetails.cover.url.replace('t_thumb', 't_cover_big')}` 
                : undefined,
              description: gameDetails.summary
            };
            setGame(formattedGame);
            return formattedGame;
          }
        } catch (error) {
          console.error('Failed to fetch IGDB game:', error);
        }
      }
      
      // If not an IGDB game or IGDB fetch failed, try from our database
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();
      
      if (error) throw error;
      if (data) {
        setGame(data);
        return data;
      }
      
      return null;
    }
  });

  // Fetch streamers who play this game
  const { data: streamers, isLoading: streamersLoading } = useQuery({
    queryKey: ['streamers', 'game', gameId],
    queryFn: async () => {
      if (!gameId) return [];
      
      // First try to get streamers from our database who have clips of this game
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          display_name,
          avatar_url,
          bio,
          follower_count
        `)
        .eq('posts.game_id', gameId)
        .order('follower_count', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Error fetching streamers:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!gameId && !!game,
  });

  if (gameLoading) {
    return (
      <div className="pt-16 pb-24 max-w-5xl mx-auto">
        <div className="p-4">
          <Button 
            variant="ghost" 
            className="mb-4 p-0 h-8"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          
          <div className="flex items-center">
            <Skeleton className="h-20 w-20 rounded-lg bg-indigo-950/60" />
            <div className="ml-4">
              <Skeleton className="h-6 w-40 bg-indigo-950/60" />
              <Skeleton className="h-4 w-24 mt-2 bg-indigo-950/60" />
            </div>
          </div>
          
          <Skeleton className="h-32 w-full mt-4 bg-indigo-950/60" />
          
          <div className="mt-6">
            <Skeleton className="h-6 w-48 mb-4 bg-indigo-950/60" />
            <div className="grid grid-cols-2 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg bg-indigo-950/60" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="pt-20 pb-24 max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center h-60 p-4">
          <Gamepad className="h-16 w-16 text-indigo-500/60 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Game Not Found</h2>
          <p className="text-indigo-300 text-center mb-4">We couldn't find details for this game.</p>
          <Button onClick={() => navigate('/discovery')}>
            Return to Discovery
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 pb-24 max-w-5xl mx-auto">
      <div className="p-4">
        <Button 
          variant="ghost" 
          className="mb-4 p-0 h-8"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        
        {/* Game Header */}
        <div className="flex items-start">
          <Card className="h-24 w-24 overflow-hidden flex-shrink-0 bg-indigo-950/50 border-indigo-500/30">
            {game.cover_url ? (
              <img 
                src={game.cover_url} 
                alt={game.name}
                className="object-cover w-full h-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/img/games/default.jpg';
                }}
              />
            ) : (
              <div className="w-full h-full bg-indigo-900/70 flex items-center justify-center">
                <Gamepad className="w-12 h-12 text-indigo-400 opacity-50" />
              </div>
            )}
          </Card>
          
          <div className="ml-4">
            <h1 className="text-xl font-bold text-white">{game.name}</h1>
            <div className="mt-1 flex items-center">
              <Users className="h-4 w-4 text-indigo-400 mr-1" />
              <span className="text-sm text-indigo-300">
                {streamers?.length || 0} {streamers?.length === 1 ? 'Streamer' : 'Streamers'} 
              </span>
            </div>
          </div>
        </div>
        
        {/* Game Description */}
        {game.description && (
          <div className="mt-4 p-4 rounded-lg bg-indigo-950/30 border border-indigo-500/20">
            <p className="text-sm text-indigo-200">{game.description}</p>
          </div>
        )}
        
        {/* Streamers List */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-indigo-300 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-indigo-400" />
            Streamers Playing {game.name}
          </h2>
          
          {streamersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg bg-indigo-950/60" />
              ))}
            </div>
          ) : streamers && streamers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {streamers.map((streamer: Streamer) => (
                <StreamerCard key={streamer.id} streamer={streamer} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 p-4 rounded-lg bg-indigo-950/30 border border-indigo-500/20">
              <Users className="h-10 w-10 text-indigo-500/60 mb-2" />
              <p className="text-indigo-300 text-center">
                No streamers found for this game yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameStreamers;
