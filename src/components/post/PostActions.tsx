import { MessageCircle, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostActionsProps } from "@/types/post";
import LikeButton from "./actions/LikeButton";

export const PostActions = ({ post, commentsCount, onCommentClick }: PostActionsProps) => {
  return (
    <div className="p-4 bg-[#1A1F2C] border-t border-[#2A2E3B]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <LikeButton postId={post.id} />
          <Button
            variant="ghost"
            size="sm"
            onClick={onCommentClick}
            className="flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Share className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};