import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostActionsProps } from "@/types/post";
import LikeButton from "./actions/LikeButton";
import ShareToSocial from "./actions/ShareToSocial";

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
          <ShareToSocial postId={post.id} content={post.content || ''} />
        </div>
      </div>
    </div>
  );
};