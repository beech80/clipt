import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Gamepad2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { IGDBGame } from "@/services/igdbService";
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
    queryKey: ['games', searchTerm, sortBy, filters],
    queryFn: async () => {
      let query = `fields name,cover.url,summary,rating,first_release_date,genres.name,id;
                   where version_parent = null`;
      
      if (searchTerm) {
        query += ` & name ~ "*${searchTerm}*"`;
      }

      if (filters.releaseYear && filters.releaseYear !== 'all') {
        const year = parseInt(filters.releaseYear);
        query += ` & first_release_date >= ${new Date(year, 0).getTime() / 1000}
                  & first_release_date < ${new Date(year + 1, 0).getTime() / 1000}`;
      }

      query += ` sort ${sortBy === 'popular' ? 'rating desc' : 'name asc'};
                 limit 50;`;

      const { data, error } = await supabase.functions.invoke('igdb', {
        body: {
          endpoint: 'games',
          query
        }
      });
      
      if (error) throw error;
      return data as IGDBGame[];
    },
  });

  const handleGameClick = (gameId: number) => {
    navigate(`/game/${gameId}/clips`);
  };

  const handleShare = async (e: React.MouseEvent, game: IGDBGame) => {
    e.stopPropagation();
    try {
      const shareUrl = `${window.location.origin}/game/${game.id}/clips`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy share link");
    }
  };

  const getEmbedCode = (game: IGDBGame) => {
    return `<iframe 
      src="${window.location.origin}/embed/game/${game.id}" 
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
        <Card
          key={game.id}
          className="group relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
          onClick={() => handleGameClick(game.id)}
        >
          <img 
            src={game.cover?.url?.replace('t_thumb', 't_cover_big') || '/placeholder.svg'} 
            alt={game.name}
            className="w-full h-48 object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
            <h3 className="font-semibold text-white">{game.name}</h3>
            <p className="text-sm text-gray-300 line-clamp-1">{game.summary}</p>
            <div className="flex gap-2 mt-2">
              <Button 
                size="sm" 
                variant="default"
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGameClick(game.id);
                }}
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
                <DialogContent onClick={(e) => e.stopPropagation()}>
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
                          value={`${window.location.origin}/game/${game.id}/clips`}
                        />
                        <Button 
                          onClick={(e) => handleShare(e, game)}
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
                          onClick={(e) => {
                            e.stopPropagation();
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
        </Card>
      ))}
    </div>
  );
}