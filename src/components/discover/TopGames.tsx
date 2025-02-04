import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IGDBGame } from "@/services/igdbService";
import { useNavigate } from "react-router-dom";

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
      <div className="flex space-x-6 pb-4">
        {topGames?.map((game) => (
          <div
            key={game.id}
            className="relative flex-none w-[250px] cursor-pointer rounded-lg overflow-hidden 
                       group hover:transform hover:scale-105 transition-all duration-300"
            onClick={() => handleGameClick(game.id)}
          >
            <img
              src={game.cover?.url?.replace('t_thumb', 't_cover_big') || '/placeholder.svg'}
              alt={game.name}
              className="w-full h-48 object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent 
                          opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 
                          group-hover:translate-y-0 transition-transform">
              <h3 className="font-semibold text-white group-hover:text-gaming-200 transition-colors">
                {game.name}
              </h3>
              <div className="flex items-center mt-2 space-x-2">
                <div className="text-sm text-gaming-300">
                  Rating: {Math.round(game.rating || 0)}%
                </div>
                <div className="h-1.5 w-1.5 rounded-full bg-gaming-400" />
                <div className="text-sm text-gaming-300">
                  {new Date(game.first_release_date * 1000).getFullYear()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}