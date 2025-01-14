import { useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PostItemProps {
  post: {
    id: string;
    content: string;
    image_url: string | null;
    created_at: string;
    profiles: {
      username: string;
      avatar_url: string;
    };
  };
}

const PostItem = ({ post }: PostItemProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? "Post unliked!" : "Post liked!");
  };

  const handleComment = () => {
    toast.info("Comments feature coming soon!");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast.success(isSaved ? "Post unsaved!" : "Post saved!");
  };

  return (
    <Card className="mb-4 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={post.profiles?.avatar_url || "/placeholder.svg"}
              alt={post.profiles?.username || "User"}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h3 className="font-semibold">{post.profiles?.username || "Anonymous"}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(post.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>

        <p className="mt-4 whitespace-pre-wrap">{post.content}</p>

        {post.image_url && (
          <div className="mt-4 -mx-4">
            <img
              src={post.image_url}
              alt="Post content"
              className="w-full object-cover max-h-[500px]"
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-4 mt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn("flex items-center gap-2", isLiked && "text-red-500")}
          >
            <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleComment}
            className="flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className={cn("flex items-center gap-2", isSaved && "text-gaming-600")}
          >
            <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PostItem;