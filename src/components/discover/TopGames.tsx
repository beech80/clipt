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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg bg-gaming-700/50" />
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="w-full">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {topGames?.map((game) => (
          <div
            key={game.id}
            className="gaming-card group cursor-pointer bg-gaming-800/30 hover:bg-gaming-800/50 transition-all"
            onClick={() => handleGameClick(game.id)}
          >
            <div className="relative aspect-video overflow-hidden">
              <img
                src={game.cover?.url?.replace('t_thumb', 't_cover_big') || '/placeholder.svg'}
                alt={game.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            </div>
            
            <div className="p-3 space-y-2">
              <h3 className="font-medium text-sm text-white/90 group-hover:text-white transition-colors line-clamp-1">
                {game.name}
              </h3>
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-white/70">
                  <span>{Math.round(game.rating || 0)}%</span>
                  <span className="h-1 w-1 rounded-full bg-gaming-400/50" />
                  <span>{new Date(game.first_release_date * 1000).getFullYear()}</span>
                </div>
                <Gamepad2 className="w-4 h-4 text-gaming-400/70 group-hover:text-gaming-400 transition-colors" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}