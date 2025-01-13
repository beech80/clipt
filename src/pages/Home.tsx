import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Share2, Bookmark, MoreVertical, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const Home = () => {
  const [newPost, setNewPost] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5000000) { // 5MB limit
        toast.error("Image size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPost.trim() || selectedImage) {
      toast.success("Post created successfully!");
      setNewPost("");
      setSelectedImage(null);
    } else {
      toast.error("Please add some content to your post");
    }
  };

  const handleVideoEnd = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % shorts.length);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Create Post Section */}
      <div className="gaming-card">
        <form onSubmit={handlePostSubmit} className="space-y-4">
          <Textarea
            placeholder="Share your gaming moments..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="min-h-[100px]"
          />
          
          {selectedImage && (
            <div className="relative">
              <img 
                src={selectedImage} 
                alt="Selected" 
                className="w-full rounded-lg max-h-[300px] object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => setSelectedImage(null)}
              >
                Remove
              </Button>
            </div>
          )}

          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              className="text-gaming-400"
            >
              <ImagePlus className="w-4 h-4 mr-2" />
              Add Image
            </Button>
            <Button type="submit" className="gaming-button">
              Post
            </Button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </form>
      </div>

      {/* Shorts Feed */}
      <ScrollArea className="h-[calc(100vh-200px)] w-full">
        <div className="space-y-2">
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
        </div>
      </ScrollArea>

      {/* Regular Posts */}
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
