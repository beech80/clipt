import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IGDBGame } from "@/services/igdbService";
import { useNavigate } from "react-router-dom";
import { Gamepad2 } from "lucide-react";

export function TopGames() {
  const navigate = useNavigate();
  const { data: topGames, isLoading } = useQuery({
    queryKey: ['top-games'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('igdb', {
        body: {
          endpoint: 'games',
          query: `
            fields name,cover.url,rating,first_release_date;
            where rating != null & version_parent = null;
            sort rating desc;
            limit 10;
          `
        }
      });
      
      if (error) throw error;
      return data as IGDBGame[];
    }
  });

  const handleGameClick = (gameId: number) => {
    console.log("Navigating to game clips:", gameId);
    navigate(`/game/${gameId}/clips`);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg bg-gaming-700/50" />
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="w-full pb-4">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {topGames?.map((game) => (
          <div
            key={game.id}
            className="gaming-card group cursor-pointer"
            onClick={() => handleGameClick(game.id)}
          >
            <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg">
              <img
                src={game.cover?.url?.replace('t_thumb', 't_cover_big') || '/placeholder.svg'}
                alt={game.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
            </div>
            
            <div className="p-4 space-y-3">
              <h3 className="font-semibold text-white group-hover:text-gaming-200 transition-colors line-clamp-1">
                {game.name}
              </h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gaming-300">
                    Rating: {Math.round(game.rating || 0)}%
                  </div>
                  <div className="h-1.5 w-1.5 rounded-full bg-gaming-400" />
                  <div className="text-sm text-gaming-300">
                    {new Date(game.first_release_date * 1000).getFullYear()}
                  </div>
                </div>
                <Gamepad2 className="w-5 h-5 text-gaming-400 group-hover:text-gaming-200 transition-colors" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}