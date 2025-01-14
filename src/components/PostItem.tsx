import { useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

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
  const handleLike = () => {
    toast.success("Post liked!");
  };

  const handleComment = () => {
    toast.info("Comments feature coming soon!");
  };

  const handleShare = () => {
    toast.success("Post shared!");
  };

  const handleSave = () => {
    toast.success("Post saved!");
  };

  return (
    <Card className="mb-4 p-4">
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
          onClick={handleLike}
          className="flex items-center gap-2"
        >
          <Heart className="w-4 h-4" />
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
        >
          <Bookmark className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

export default PostItem;