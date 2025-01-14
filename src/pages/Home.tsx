import { useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import PostForm from "@/components/PostForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const Home = () => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const { data: posts, refetch: refetchPosts } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const shorts = [
    {
      id: 1,
      author: "GamingPro",
      avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop",
      video: "https://assets.mixkit.co/videos/preview/mixkit-gaming-logo-3d-animation-12981-large.mp4",
      description: "Check out this epic gaming moment! 🎮",
      likes: 1234,
      comments: 88,
      shares: 45
    },
    {
      id: 2,
      author: "StreamQueen",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop",
      video: "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-gaming-console-42537-large.mp4",
      description: "New game review coming up! 🎯",
      likes: 892,
      comments: 56,
      shares: 23
    }
  ];

  const handleVideoEnd = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % shorts.length);
  };

  const handleLike = (postId: number) => {
    toast.success("Post liked!");
  };

  const handleComment = (postId: number) => {
    toast.info("Comments feature coming soon!");
  };

  const handleShare = (postId: number) => {
    toast.success("Post shared!");
  };

  const handleSave = (postId: number) => {
    toast.success("Post saved!");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PostForm onPostCreated={() => refetchPosts()} />

      {/* Shorts Feed */}
      <ScrollArea className="h-[calc(100vh-200px)] w-full">
        {/* Posts Feed */}
        {posts?.map((post) => (
          <div key={post.id} className="bg-card rounded-lg p-4 shadow-sm mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={post.profiles?.avatar_url || "/placeholder.svg"}
                  alt={post.profiles?.username || "User"}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h3 className="font-semibold">{post.profiles?.username || "Anonymous"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>

            <p className="mt-4">{post.content}</p>

            {post.image_url && (
              <img
                src={post.image_url}
                alt="Post content"
                className="rounded-lg w-full object-cover max-h-[300px] mt-4"
              />
            )}

            <div className="flex items-center justify-between pt-4 mt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLike(post.id)}
                className="flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleComment(post.id)}
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleShare(post.id)}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
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

        {/* Shorts Section */}
        {shorts.map((short, index) => (
          <div 
            key={short.id} 
            className={cn(
              "relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-black",
              "transition-all duration-300"
            )}
          >
            <video
              className="w-full h-full object-cover"
              src={short.video}
              autoPlay={index === currentVideoIndex}
              loop
              playsInline
              muted
              onEnded={handleVideoEnd}
            />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={short.avatar}
                  alt={short.author}
                  className="w-10 h-10 rounded-full border-2 border-white"
                />
                <span className="text-white font-semibold">{short.author}</span>
              </div>
              <p className="text-white mb-4">{short.description}</p>
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-gaming-400"
                  onClick={() => toast.success("Liked!")}
                >
                  <Heart className="w-4 h-4 mr-2" /> {short.likes}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-gaming-400"
                  onClick={() => toast.info("Comments coming soon!")}
                >
                  <MessageCircle className="w-4 h-4 mr-2" /> {short.comments}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-gaming-400"
                  onClick={() => toast.success("Shared!")}
                >
                  <Share2 className="w-4 h-4 mr-2" /> {short.shares}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

export default Home;
