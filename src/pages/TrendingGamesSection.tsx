import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Flame, Gamepad } from 'lucide-react';
import { Card } from '@/components/ui/card';

// Helper function to properly format IGDB image URLs
const formatIGDBImageUrl = (url: string): string => {
  if (!url) return '';
  
  // Ensure HTTPS and convert to large image format
  let formattedUrl = url;
  
  // Replace image size
  formattedUrl = formattedUrl.replace('t_thumb', 't_cover_big');
  
  // Add HTTPS protocol if missing
  if (!formattedUrl.startsWith('http')) {
    formattedUrl = 'https:' + formattedUrl;
  }
  
  return formattedUrl;
};

interface TrendingGame {
  id: string;
  name: string;
  cover_url?: string;
  post_count: number;
}

interface IGDBGame {
  id: number;
  name: string;
  cover?: {
    id: number;
    url: string;
  };
  rating?: number;
  popularity?: number;
  total_rating?: number;
}

export const TrendingGamesSection = () => {
  const navigate = useNavigate();

  const { data: trendingGames, isLoading } = useQuery({
    queryKey: ['games', 'trending'],
    queryFn: async () => {
      try {
        // Try to get trending games from IGDB first for most current data
        let trendingIGDBGames: TrendingGame[] = [];
        try {
          const { data: igdbResponse } = await supabase.functions.invoke('igdb', {
            body: {
              endpoint: 'games',
              query: `
                fields name, popularity, cover.url;
                sort popularity desc;
                limit 3;
              `
            }
          });

          if (igdbResponse && Array.isArray(igdbResponse)) {
            console.log('IGDB API Response:', igdbResponse);
            trendingIGDBGames = igdbResponse
              .map((game: IGDBGame) => ({
                id: `igdb-${game.id}`,
                name: game.name,
                cover_url: game.cover?.url 
                  ? formatIGDBImageUrl(game.cover.url) 
                  : undefined,
                post_count: Math.round((game.popularity || 0) / 10), // Convert popularity to a reasonable number
              }));
            console.log('Formatted trending games from IGDB:', trendingIGDBGames);
          }
        } catch (igdbError) {
          console.error('IGDB API error:', igdbError);
        }

        // Also get games from our database based on post count
        const { data: supabaseGames, error } = await supabase
          .from('games')
          .select(`
            id,
            name,
            cover_url,
            post_count:posts(count)
          `)
          .order('post_count', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        
        // Transform our database game data
        const transformedData = (supabaseGames || []).map(game => ({
          ...game,
          post_count: typeof game.post_count === 'object' && game.post_count !== null 
            ? Number(game.post_count.count || 0) 
            : (typeof game.post_count === 'number' ? game.post_count : 0)
        }));
        
        console.log('Trending games from Supabase:', transformedData);
        console.log('Trending games from IGDB:', trendingIGDBGames);
        
        // Combine and prioritize both sets of games
        // For each IGDB game, check if we have a matching game in our database
        const combinedGames: TrendingGame[] = [];
        
        // Add IGDB games first as they're more current
        trendingIGDBGames.forEach(igdbGame => {
          // Check if we have this game in our database (by name match)
          const matchingDbGame = transformedData.find(
            dbGame => dbGame.name.toLowerCase() === igdbGame.name.toLowerCase()
          );
          
          if (matchingDbGame) {
            // If we have a match, use our database ID but IGDB's cover image (better quality)
            combinedGames.push({
              id: matchingDbGame.id, // Use our database ID for routing
              name: igdbGame.name,
              cover_url: igdbGame.cover_url || matchingDbGame.cover_url,
              post_count: Math.max(matchingDbGame.post_count, igdbGame.post_count)
            });
          } else {
            // If no match, just add the IGDB game
            combinedGames.push(igdbGame);
          }
        });
        
        // Add remaining high-post-count games from our database that aren't already in the list
        transformedData.forEach(dbGame => {
          const alreadyAdded = combinedGames.some(
            game => game.name.toLowerCase() === dbGame.name.toLowerCase()
          );
          
          if (!alreadyAdded && dbGame.post_count > 0) {
            combinedGames.push(dbGame);
          }
        });
        
        // Only ensure high-quality images for top games
        const finalTrendingGames = combinedGames
          .sort((a, b) => b.post_count - a.post_count)
          .slice(0, 3)
          .map(game => {
            // If no cover URL or it's a poor quality URL, replace with a fixed high-quality image
            // based on game name pattern matching
            if (!game.cover_url || game.cover_url.includes('nocover')) {
              const gameName = game.name.toLowerCase();
              
              if (gameName.includes('fortnite')) {
                game.cover_url = 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4ixjb.jpg';
              } else if (gameName.includes('call of duty') || gameName.includes('cod')) {
                game.cover_url = 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5hno.jpg';
              } else if (gameName.includes('halo')) {
                game.cover_url = 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2nkk.jpg';
              } else if (gameName.includes('minecraft')) {
                game.cover_url = 'https://images.igdb.com/igdb/image/upload/t_cover_big/co49x5.jpg';
              } else if (gameName.includes('league of legends') || gameName.includes('lol')) {
                game.cover_url = 'https://images.igdb.com/igdb/image/upload/t_cover_big/co76yw.jpg';
              } else if (gameName.includes('valorant')) {
                game.cover_url = 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2mvt.jpg';
              } else if (gameName.includes('elden ring')) {
                game.cover_url = 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg';
              }
            }
            
            return game;
          });
        
        if (finalTrendingGames.length < 3) {
          // Hardcoded fallback games with guaranteed correct images
          const fallbackGames = [
            { 
              id: 'fallback-fortnite', 
              name: 'Fortnite', 
              cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4ixjb.jpg', 
              post_count: 5000 
            },
            { 
              id: 'fallback-cod', 
              name: 'Call of Duty', 
              cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5hno.jpg', 
              post_count: 4000 
            },
            { 
              id: 'fallback-halo', 
              name: 'Halo Infinite', 
              cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2nkk.jpg', 
              post_count: 3000 
            }
          ];
          
          // Add fallback games not already in the list
          for (const fallback of fallbackGames) {
            if (finalTrendingGames.length >= 3) break;
            
            const exists = finalTrendingGames.some(
              game => game.name.toLowerCase() === fallback.name.toLowerCase()
            );
            
            if (!exists) {
              finalTrendingGames.push(fallback);
            }
          }
        }
        
        return finalTrendingGames.slice(0, 3);
      } catch (error) {
        console.error('Error fetching trending games:', error);
        
        // Return hardcoded games with guaranteed correct images as a last resort
        return [
          { 
            id: 'fallback-fortnite', 
            name: 'Fortnite', 
            cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4ixjb.jpg', 
            post_count: 5000 
          },
          { 
            id: 'fallback-cod', 
            name: 'Call of Duty', 
            cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5hno.jpg', 
            post_count: 4000 
          },
          { 
            id: 'fallback-halo', 
            name: 'Halo Infinite', 
            cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2nkk.jpg', 
            post_count: 3000 
          }
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
                    
                    // Fallback based on game name
                    const gameName = game.name.toLowerCase();
                    if (gameName.includes('fortnite')) {
                      target.src = 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4ixjb.jpg';
                    } else if (gameName.includes('call of duty') || gameName.includes('cod')) {
                      target.src = 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5hno.jpg';
                    } else if (gameName.includes('halo')) {
                      target.src = 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2nkk.jpg';
                    } else {
                      target.src = '/img/games/default.jpg';
                    }
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
