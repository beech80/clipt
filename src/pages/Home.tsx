import { Heart, MessageCircle, Share2 } from "lucide-react";

const MOCK_POSTS = [
  {
    id: 1,
    username: "ProGamer123",
    game: "Fortnite",
    content: "Just got my first Victory Royale of the season! 🏆",
    likes: 234,
    comments: 18,
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&h=500&fit=crop",
  },
  {
    id: 2,
    username: "GameMaster",
    game: "Minecraft",
    content: "Built this castle in survival mode! What do you think? 🏰",
    likes: 567,
    comments: 42,
    image: "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=500&h=500&fit=crop",
  },
];

const Home = () => {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="gaming-gradient text-3xl font-bold tracking-tight">GameShare Feed</h1>
      
      {MOCK_POSTS.map((post) => (
        <article key={post.id} className="gaming-card animate-glow group">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-full bg-gaming-700/50 ring-2 ring-gaming-500/50 p-0.5">
              <div className="w-full h-full rounded-full bg-gaming-800" />
            </div>
            <div>
              <h3 className="font-semibold text-gaming-100 group-hover:text-gaming-400 transition-colors">
                {post.username}
              </h3>
              <p className="text-sm text-muted-foreground">Playing {post.game}</p>
            </div>
          </div>
          
          <div className="relative rounded-lg overflow-hidden mb-6">
            <img
              src={post.image}
              alt="Game screenshot"
              className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
          
          <p className="mb-6 text-sm text-gray-300">{post.content}</p>
          
          <div className="flex gap-6">
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gaming-400 transition-colors">
              <Heart className="h-5 w-5" />
              {post.likes}
            </button>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gaming-400 transition-colors">
              <MessageCircle className="h-5 w-5" />
              {post.comments}
            </button>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gaming-400 transition-colors">
              <Share2 className="h-5 w-5" />
              Share
            </button>
          </div>
        </article>
      ))}
    </div>
  );
};

export default Home;