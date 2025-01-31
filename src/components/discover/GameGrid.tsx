import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

interface GameGridProps {
  searchTerm?: string;
  sortBy?: string;
}

export function GameGrid({ searchTerm = "", sortBy = "name" }: GameGridProps) {
  const navigate = useNavigate();
  
  const { data: games, isLoading } = useQuery({
    queryKey: ['game-categories', searchTerm, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('game_categories')
        .select('*');

      // Apply search filter
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      // Apply sorting
      switch (sortBy) {
        case 'name':
          query = query.order('name');
          break;
        case 'name-desc':
          query = query.order('name', { ascending: false });
          break;
        case 'popular':
          query = query.order('recommendation_weight', { ascending: false });
          break;
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
      }
      
      const { data, error } = await query;
      
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

  if (games?.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No games found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {games?.map((game) => (
        <div
          key={game.id}
          className="gaming-card group relative overflow-hidden cursor-pointer rounded-lg"
          onClick={() => navigate(`/game/${game.slug}`)}
        >
          <img 
            src={game.thumbnail_url || '/placeholder.svg'} 
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