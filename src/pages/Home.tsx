import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const MOCK_POSTS = [
  {
    id: 1,
    username: "ProGamer123",
    game: "Fortnite",
    content: "Just got my first Victory Royale of the season! 🏆",
    likes: 234,
    comments: 18,
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&h=500&fit=crop",
    saved: false,
    userImage: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop",
  },
  {
    id: 2,
    username: "GameMaster",
    game: "Minecraft",
    content: "Built this castle in survival mode! What do you think? 🏰",
    likes: 567,
    comments: 42,
    image: "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=500&h=500&fit=crop",
    saved: true,
    userImage: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop",
  },
];

const Home = () => {
  const handleLike = (postId: number) => {
    toast.success("Post liked!");
  };

  const handleComment = (postId: number) => {
    toast.info("Comments coming soon!");
  };

  const handleShare = (postId: number) => {
    toast.success("Link copied to clipboard!");
  };

  const handleSave = (postId: number) => {
    toast.success("Post saved to your collection!");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 rounded-full bg-gaming-700/50 ring-2 ring-gaming-500/50 p-0.5">
          <img 
            src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop" 
            alt="Your profile"
            className="w-full h-full rounded-full object-cover"
          />
        </div>
        <Input 
          placeholder="Share your gaming moment..."
          className="flex-1"
          onClick={() => toast.info("Post creation coming soon!")}
        />
        <Button className="gaming-button">Post</Button>
      </div>
      
      {MOCK_POSTS.map((post) => (
        <article key={post.id} className="gaming-card animate-glow group">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gaming-700/50 ring-2 ring-gaming-500/50 p-0.5 overflow-hidden">
                <img 
                  src={post.userImage} 
                  alt={post.username}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold text-gaming-100 group-hover:text-gaming-400 transition-colors">
                  {post.username}
                </h3>
                <p className="text-sm text-muted-foreground">Playing {post.game}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleSave(post.id)}
              className={post.saved ? "text-gaming-400" : ""}
            >
              <Bookmark className="h-5 w-5" />
            </Button>
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
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 text-sm hover:text-gaming-400"
              onClick={() => handleLike(post.id)}
            >
              <Heart className="h-5 w-5" />
              {post.likes}
            </Button>
            <Button 
              variant="ghost"
              className="flex items-center gap-2 text-sm hover:text-gaming-400"
              onClick={() => handleComment(post.id)}
            >
              <MessageCircle className="h-5 w-5" />
              {post.comments}
            </Button>
            <Button 
              variant="ghost"
              className="flex items-center gap-2 text-sm hover:text-gaming-400"
              onClick={() => handleShare(post.id)}
            >
              <Share2 className="h-5 w-5" />
              Share
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
};

export default Home;