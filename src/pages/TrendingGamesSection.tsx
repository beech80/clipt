import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Flame, Gamepad } from 'lucide-react';
import { Card } from '@/components/ui/card';

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
        // First try to get games with highest post counts directly from our database
        const { data: supabaseGames, error } = await supabase
          .from('games')
          .select(`
            id,
            name,
            cover_url,
            post_count:posts(count)
          `)
          .order('post_count', { ascending: false })
          .limit(3);
        
        if (error) throw error;
        
        // Transform data to fix the count object issue
        const transformedData = (supabaseGames || []).map(game => ({
          ...game,
          post_count: typeof game.post_count === 'object' && game.post_count !== null 
            ? Number(game.post_count.count || 0) 
            : (typeof game.post_count === 'number' ? game.post_count : 0)
        }));
        
        console.log('Trending games from Supabase:', transformedData);
        
        // Always also fetch from IGDB to ensure we have the latest trending games
        try {
          const { igdbService } = await import('@/services/igdbService');
          const popularGames = await igdbService.getPopularGames(3);
          
          if (popularGames && popularGames.length > 0) {
            const formattedGames = popularGames.map((game: any) => ({
              id: `igdb-${game.id}`,
              name: game.name,
              cover_url: game.cover?.url 
                ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` 
                : undefined,
              post_count: game.rating ? Math.round(game.rating) : 0
            }));
            
            console.log('Trending games from IGDB:', formattedGames);
            
            // Merge both sources prioritizing games with higher post counts,
            // but ensure we're showing at least one game from IGDB for freshness
            const combinedGames = [...transformedData];
            
            // Add IGDB games that aren't already in our list
            formattedGames.forEach(igdbGame => {
              const exists = combinedGames.some(g => 
                g.name.toLowerCase() === igdbGame.name.toLowerCase()
              );
              
              if (!exists) {
                combinedGames.push(igdbGame);
              }
            });
            
            // Sort by post count and ensure we have at least one IGDB game
            const sortedGames = combinedGames.sort((a, b) => b.post_count - a.post_count);
            const hasIgdbGame = sortedGames.slice(0, 3).some(g => g.id.startsWith('igdb-'));
            
            if (!hasIgdbGame && formattedGames.length > 0) {
              sortedGames.pop(); // Remove the lowest popularity game
              sortedGames.push(formattedGames[0]); // Add the highest rated IGDB game
              return sortedGames.sort((a, b) => b.post_count - a.post_count).slice(0, 3);
            }
            
            return sortedGames.slice(0, 3);
          }
        } catch (igdbError) {
          console.error('IGDB fetch failed:', igdbError);
        }
        
        // Fallback games if no results from anywhere
        if (transformedData.length === 0) {
          return [
            { id: 'fallback-1', name: 'Halo Infinite', cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg', post_count: 0 },
            { id: 'fallback-2', name: 'Fortnite', cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3wk8.jpg', post_count: 0 },
            { id: 'fallback-3', name: 'Call of Duty', cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wkb.jpg', post_count: 0 }
          ];
        }
        
        return transformedData;
      } catch (error) {
        console.error('Error fetching trending games:', error);
        
        // Return hardcoded games as a last resort
        return [
          { id: 'fallback-1', name: 'Halo Infinite', cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg', post_count: 0 },
          { id: 'fallback-2', name: 'Fortnite', cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3wk8.jpg', post_count: 0 },
          { id: 'fallback-3', name: 'Call of Duty', cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wkb.jpg', post_count: 0 }
        ];
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (isLoading) {
    return (
      <div className="px-4 py-5">
        <h2 className="text-lg font-semibold text-indigo-300 mb-4 flex items-center">
          <Flame className="w-5 h-5 mr-2 text-orange-500" />
          Trending Games
        </h2>
        <div className="flex justify-between px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-[120px] h-[120px]">
              <Skeleton className="h-full w-full rounded-xl bg-indigo-950/60" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5">
      <h2 className="text-lg font-semibold text-indigo-300 mb-4 flex items-center">
        <Flame className="w-5 h-5 mr-2 text-orange-500" />
        Trending Games
      </h2>
      <div className="flex justify-between px-4">
        {trendingGames?.map((game: TrendingGame) => (
          <Card 
            key={game.id} 
            className="w-[120px] h-[120px] cursor-pointer group overflow-hidden bg-indigo-950/50 border-indigo-500/30 hover:border-indigo-400"
            onClick={() => navigate(`/game-streamers/${game.id}`)}
          >
            <div className="relative w-full h-full">
              {game.cover_url ? (
                <img 
                  src={game.cover_url} 
                  alt={game.name}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/img/games/default.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-indigo-900/70 flex items-center justify-center text-indigo-400">
                  <Gamepad className="w-10 h-10 opacity-50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <h3 className="text-xs font-medium text-white truncate">{game.name}</h3>
                <div className="flex items-center">
                  <Trophy className="w-3 h-3 text-yellow-500 mr-1" />
                  <p className="text-xs text-indigo-300">{game.post_count}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TrendingGamesSection;
