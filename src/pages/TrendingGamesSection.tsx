import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';

interface TrendingGame {
  id: string;
  name: string;
  cover_url?: string;
  post_count: number;
}

export const TrendingGamesSection = () => {
  const navigate = useNavigate();

  const { data: trendingGames, isLoading } = useQuery({
    queryKey: ['games', 'trending'],
    queryFn: async () => {
      try {
        // First try to get games from our database with highest post counts
        const { data, error } = await supabase
          .from('games')
          .select(`
            *,
            post_count:posts(count)
          `)
          .order('post_count', { ascending: false })
          .limit(3);
        
        if (error) throw error;
        
        // Transform data to fix the count object issue
        const transformedData = (data || []).map(game => ({
          ...game,
          post_count: typeof game.post_count === 'object' && game.post_count !== null 
            ? Number(game.post_count.count || 0) 
            : (typeof game.post_count === 'number' ? game.post_count : 0)
        }));
        
        // If we don't have enough games, fetch popular games from IGDB
        if (transformedData.length < 3) {
          try {
            const { igdbService } = await import('@/services/igdbService');
            const popularGames = await igdbService.getPopularGames(
              3 - transformedData.length
            );
            
            if (popularGames && popularGames.length > 0) {
              const formattedGames = popularGames.map((game: any) => ({
                id: `igdb-${game.id}`,
                name: game.name,
                cover_url: game.cover?.url 
                  ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` 
                  : undefined,
                post_count: 0
              }));
              
              return [...transformedData, ...formattedGames].slice(0, 3);
            }
          } catch (igdbError) {
            console.error('IGDB fallback failed:', igdbError);
          }
        }
        
        // Fallback games if none are found
        if (transformedData.length === 0) {
          return [
            { id: 'fallback-1', name: 'Halo Infinite', cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg', post_count: 0 },
            { id: 'fallback-2', name: 'Fortnite', cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3wk8.jpg', post_count: 0 },
            { id: 'fallback-3', name: 'Minecraft', cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wkb.jpg', post_count: 0 }
          ];
        }
        
        return transformedData;
      } catch (error) {
        console.error('Error fetching trending games:', error);
        
        // Return hardcoded games as a last resort
        return [
          { id: 'fallback-1', name: 'Halo Infinite', cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg', post_count: 0 },
          { id: 'fallback-2', name: 'Fortnite', cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3wk8.jpg', post_count: 0 },
          { id: 'fallback-3', name: 'Minecraft', cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wkb.jpg', post_count: 0 }
        ];
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold text-indigo-300 mb-4 flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
          Trending Games
        </h2>
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[180px] w-[180px] flex-shrink-0">
              <Skeleton className="rounded-lg aspect-[3/4] w-full bg-indigo-950/60" />
              <Skeleton className="h-4 w-3/4 mt-2 bg-indigo-950/60" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h2 className="text-lg font-semibold text-indigo-300 mb-4 flex items-center">
        <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
        Trending Games
      </h2>
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {trendingGames?.map((game: TrendingGame) => (
          <div 
            key={game.id} 
            className="min-w-[180px] w-[180px] flex-shrink-0 cursor-pointer group"
            onClick={() => navigate(`/games/${game.id}`)}
          >
            <div className="overflow-hidden rounded-lg border border-indigo-500/30 bg-indigo-950/40">
              <AspectRatio ratio={3/4}>
                {game.cover_url ? (
                  <img 
                    src={game.cover_url} 
                    alt={game.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'https://images.igdb.com/igdb/image/upload/t_cover_big/nocover.png';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-indigo-900/50 flex items-center justify-center text-indigo-400">
                    <Trophy className="w-12 h-12 opacity-50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              </AspectRatio>
            </div>
            <h3 className="mt-2 text-sm font-medium text-white truncate">{game.name}</h3>
            <p className="text-xs text-indigo-400">
              {game.post_count === 1 ? '1 clip' : `${game.post_count} clips`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingGamesSection;
