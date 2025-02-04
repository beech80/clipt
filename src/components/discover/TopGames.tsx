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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="w-full pb-4">
      <div className="flex space-x-4 pb-4">
        {topGames?.map((game) => (
          <div
            key={game.id}
            className="relative flex-none w-[250px] cursor-pointer rounded-lg overflow-hidden group"
            onClick={() => handleGameClick(game.id)}
          >
            <img
              src={game.cover?.url?.replace('t_thumb', 't_cover_big') || '/placeholder.svg'}
              alt={game.name}
              className="w-full h-32 object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
              <h3 className="font-semibold text-white group-hover:text-gaming-200 transition-colors">
                {game.name}
              </h3>
              <p className="text-sm text-gray-300 line-clamp-1">
                Rating: {Math.round(game.rating || 0)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}