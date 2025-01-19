import { Search, TrendingUp, Gamepad2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import GameBoyControls from "@/components/GameBoyControls";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

const TRENDING_GAMES = [
  { id: 1, name: "Fortnite", posts: 1234, image: "https://images.unsplash.com/photo-1589241062272-c0a000072dfa?w=300&h=200&fit=crop", slug: "fortnite" },
  { id: 2, name: "Minecraft", posts: 987, image: "https://images.unsplash.com/photo-1587573089734-09cb69c0f2b4?w=300&h=200&fit=crop", slug: "minecraft" },
  { id: 3, name: "Call of Duty", posts: 856, image: "https://images.unsplash.com/photo-1616565441778-e8c263973f68?w=300&h=200&fit=crop", slug: "call-of-duty" },
  { id: 4, name: "League of Legends", posts: 743, image: "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=300&h=200&fit=crop", slug: "league-of-legends" },
];

const TRENDING_CREATORS = [
  { id: 1, name: "ProGamer123", followers: "12.3K", image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop" },
  { id: 2, name: "GameMaster", followers: "8.7K", image: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop" },
];

const Discover = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: gameClips, isLoading } = useQuery({
    queryKey: ['game-clips', selectedGame],
    queryFn: async () => {
      const query = supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          ),
          likes (
            count
          ),
          clip_votes (
            count
          ),
          post_game_categories!inner (
            game_categories (
              name
            )
          )
        `)
        .not('video_url', 'is', null)
        .order('created_at', { ascending: false });

      if (selectedGame) {
        query.eq('post_game_categories.game_categories.name', selectedGame);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: true
  });

  const handleFollow = () => {
    toast.success("Creator followed successfully!");
  };

  const handleGameClick = (slug: string) => {
    navigate(`/game/${slug}`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-40">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input 
          className="pl-9" 
          placeholder="Search games, players, or posts..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <Tabs defaultValue="games" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="creators">Creators</TabsTrigger>
        </TabsList>

        <TabsContent value="games" className="space-y-4">
          <div className="gaming-card">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-gaming-400" />
              <h2 className="text-lg font-semibold">Trending Games</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {TRENDING_GAMES.map((game) => (
                <div
                  key={game.id}
                  className="group relative overflow-hidden rounded-lg border border-gaming-700/50 hover:border-gaming-400 cursor-pointer"
                  onClick={() => handleGameClick(game.slug)}
                >
                  <img 
                    src={game.image} 
                    alt={game.name}
                    className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
                    <h3 className="font-semibold text-white">{game.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">{game.posts} posts</span>
                      <Button 
                        size="sm" 
                        className="gaming-button"
                      >
                        Watch Clips
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedGame && (
            <ScrollArea className="h-[500px] w-full rounded-md border p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{selectedGame} Clips</h3>
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedGame(null)}
                >
                  Show All Games
                </Button>
              </div>
              {isLoading ? (
                <div className="text-center py-4">Loading clips...</div>
              ) : gameClips && gameClips.length > 0 ? (
                <div className="space-y-4">
                  {gameClips.map((post) => (
                    <PostItem key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No clips found for {selectedGame}
                </div>
              )}
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="creators">
          <div className="gaming-card">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-gaming-400" />
              <h2 className="text-lg font-semibold">Popular Creators</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {TRENDING_CREATORS.map((creator) => (
                <div
                  key={creator.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gaming-700/50 hover:border-gaming-400"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={creator.image} 
                      alt={creator.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-medium">{creator.name}</h3>
                      <p className="text-sm text-muted-foreground">{creator.followers} followers</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleFollow}
                  >
                    Follow
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <GameBoyControls />
    </div>
  );
};

export default Discover;