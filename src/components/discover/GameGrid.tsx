import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Gamepad2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface GameGridProps {
  searchTerm?: string;
  sortBy?: string;
  filters?: {
    platform?: string;
    ageRating?: string;
    releaseYear?: string;
    hasClips?: boolean;
  };
}

export function GameGrid({ searchTerm = "", sortBy = "name", filters = {} }: GameGridProps) {
  const navigate = useNavigate();
  
  const { data: games, isLoading } = useQuery({
    queryKey: ['game-categories', searchTerm, sortBy, filters],
    queryFn: async () => {
      let query = supabase
        .from('game_categories')
        .select('*, share_settings(*)');

      // Apply text search if searchTerm exists
      if (searchTerm) {
        query = query.textSearch('name', searchTerm, {
          type: 'websearch',
          config: 'english'
        });
      }

      // Apply filters
      if (filters.platform && filters.platform !== 'all') {
        query = query.contains('platform_support', [filters.platform]);
      }

      if (filters.ageRating && filters.ageRating !== 'all') {
        query = query.eq('age_rating', filters.ageRating);
      }

      if (filters.releaseYear && filters.releaseYear !== 'all') {
        if (filters.releaseYear === 'older') {
          query = query.lt('release_date', '2022-01-01');
        } else {
          query = query.gte('release_date', `${filters.releaseYear}-01-01`)
            .lt('release_date', `${parseInt(filters.releaseYear) + 1}-01-01`);
        }
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
          query = query.order('popularity_score', { ascending: false });
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

  const handleShare = async (game: any) => {
    try {
      const shareUrl = `${window.location.origin}/game/${game.slug}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy share link");
    }
  };

  const getEmbedCode = (game: any) => {
    return `<iframe 
      src="${window.location.origin}/embed/game/${game.slug}" 
      width="100%" 
      height="600" 
      frameborder="0" 
      allowfullscreen>
    </iframe>`;
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!games?.length) {
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
        >
          <img 
            src={game.thumbnail_url || '/placeholder.svg'} 
            alt={game.name}
            className="w-full h-32 object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
            <h3 className="font-semibold text-white">{game.name}</h3>
            <p className="text-sm text-gray-300 line-clamp-1">{game.description}</p>
            <div className="flex gap-2 mt-2">
              <Button 
                size="sm" 
                className="flex-1 gaming-button"
                onClick={() => navigate(`/game/${game.slug}`)}
              >
                <Gamepad2 className="w-4 h-4 mr-2" />
                View Clips
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share {game.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Share Link
                      </label>
                      <div className="flex gap-2">
                        <Input 
                          readOnly 
                          value={`${window.location.origin}/game/${game.slug}`}
                        />
                        <Button 
                          onClick={() => handleShare(game)}
                          variant="secondary"
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Embed Code
                      </label>
                      <div className="relative">
                        <Input 
                          readOnly 
                          value={getEmbedCode(game)}
                          className="h-24"
                        />
                        <Button
                          className="absolute top-2 right-2"
                          variant="secondary"
                          onClick={() => {
                            navigator.clipboard.writeText(getEmbedCode(game));
                            toast.success("Embed code copied!");
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}