import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Share2, Bookmark, MoreVertical } from "lucide-react";
import { toast } from "sonner";

const Home = () => {
  const [newPost, setNewPost] = useState("");

  const posts = [
    {
      id: 1,
      author: "ProGamer123",
      avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop",
      content: "Just achieved a new personal best in Fortnite! 🎮 #Gaming #Victory",
      image: "https://images.unsplash.com/photo-1589241062272-c0a000072dfa?w=300&h=200&fit=crop",
      likes: 42,
      comments: 12,
      shares: 5,
      timeAgo: "2h ago"
    },
    {
      id: 2,
      author: "GameMaster",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop",
      content: "Who's up for some Minecraft building challenges? Drop your gamertag below! 🏗️",
      likes: 28,
      comments: 15,
      shares: 3,
      timeAgo: "4h ago"
    }
  ];

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPost.trim()) {
      toast.success("Post created successfully!");
      setNewPost("");
    }
  };

  const handleLike = (postId: number) => {
    toast.success("Post liked!");
  };

  const handleComment = (postId: number) => {
    toast.info("Comments coming soon!");
  };

  const handleShare = (postId: number) => {
    toast.success("Post shared!");
  };

  const handleSave = (postId: number) => {
    toast.success("Post saved!");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="gaming-card">
        <form onSubmit={handlePostSubmit} className="space-y-4">
          <Textarea
            placeholder="Share your gaming moments..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button type="submit" className="gaming-button">
              Post
            </Button>
          </div>
        </form>
      </div>

      {posts.map((post) => (
        <div key={post.id} className="gaming-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={post.avatar}
                alt={post.author}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <h3 className="font-semibold">{post.author}</h3>
                <p className="text-sm text-muted-foreground">{post.timeAgo}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>

          <p>{post.content}</p>

          {post.image && (
            <img
              src={post.image}
              alt="Post content"
              className="rounded-lg w-full object-cover max-h-[300px]"
            />
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gaming-700/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLike(post.id)}
              className="flex items-center gap-2"
            >
              <Heart className="w-4 h-4" /> {post.likes}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleComment(post.id)}
              className="flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" /> {post.comments}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShare(post.id)}
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" /> {post.shares}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSave(post.id)}
            >
              <Bookmark className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Home;