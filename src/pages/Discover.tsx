import { Search, TrendingUp, Gamepad2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const TRENDING_GAMES = [
  { id: 1, name: "Fortnite", posts: 1234, image: "https://images.unsplash.com/photo-1589241062272-c0a000072dfa?w=300&h=200&fit=crop" },
  { id: 2, name: "Minecraft", posts: 987, image: "https://images.unsplash.com/photo-1587573089734-09cb69c0f2b4?w=300&h=200&fit=crop" },
  { id: 3, name: "Call of Duty", posts: 856, image: "https://images.unsplash.com/photo-1616565441778-e8c263973f68?w=300&h=200&fit=crop" },
  { id: 4, name: "League of Legends", posts: 743, image: "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=300&h=200&fit=crop" },
];

const TRENDING_CREATORS = [
  { id: 1, name: "ProGamer123", followers: "12.3K", image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop" },
  { id: 2, name: "GameMaster", followers: "8.7K", image: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop" },
];

const Discover = () => {
  const handleFollow = () => {
    toast.success("Creator followed successfully!");
  };

  const handleExplore = (game: string) => {
    toast.info(`Exploring ${game} content...`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search games, players, or posts..." />
      </div>
      
      <div className="gaming-card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-gaming-400" />
          <h2 className="text-lg font-semibold">Trending Games</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {TRENDING_GAMES.map((game) => (
            <div
              key={game.id}
              className="group relative overflow-hidden rounded-lg border border-gaming-700/50 hover:border-gaming-500"
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
                    onClick={() => handleExplore(game.name)}
                  >
                    Explore
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="gaming-card">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-gaming-400" />
          <h2 className="text-lg font-semibold">Popular Creators</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {TRENDING_CREATORS.map((creator) => (
            <div
              key={creator.id}
              className="flex items-center justify-between p-4 rounded-lg border border-gaming-700/50 hover:border-gaming-500"
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
    </div>
  );
};

export default Discover;