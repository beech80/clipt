import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const TRENDING_GAMES = [
  { id: 1, name: "Fortnite", posts: 1234 },
  { id: 2, name: "Minecraft", posts: 987 },
  { id: 3, name: "Call of Duty", posts: 856 },
  { id: 4, name: "League of Legends", posts: 743 },
];

const Discover = () => {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="gaming-gradient text-2xl font-bold">Discover</h1>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search games, players, or posts..." />
      </div>
      
      <div className="gaming-card">
        <h2 className="mb-4 text-lg font-semibold">Trending Games</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {TRENDING_GAMES.map((game) => (
            <div
              key={game.id}
              className="flex items-center justify-between rounded-lg border border-gaming-700/50 p-3 hover:border-gaming-500"
            >
              <span className="font-medium">{game.name}</span>
              <span className="text-sm text-muted-foreground">{game.posts} posts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Discover;