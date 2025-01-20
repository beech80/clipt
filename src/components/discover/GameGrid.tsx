import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

export function GameGrid() {
  const navigate = useNavigate();
  
  const { data: games, isLoading } = useQuery({
    queryKey: ['game-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {games?.map((game) => (
        <div
          key={game.id}
          className="gaming-card group relative overflow-hidden cursor-pointer"
          onClick={() => navigate(`/game/${game.slug}`)}
        >
          <img 
            src={game.thumbnail_url} 
            alt={game.name}
            className="w-full h-32 object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
            <h3 className="font-semibold text-white">{game.name}</h3>
            <p className="text-sm text-gray-300 line-clamp-1">{game.description}</p>
            <Button 
              size="sm" 
              className="mt-2 w-full gaming-button"
            >
              <Gamepad2 className="w-4 h-4 mr-2" />
              View Clips
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}