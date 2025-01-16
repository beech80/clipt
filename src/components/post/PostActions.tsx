import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import LikeButton from "./actions/LikeButton";
import BookmarkButton from "./actions/BookmarkButton";
import VoteButton from "./actions/VoteButton";
import ShareButton from "./actions/ShareButton";
import CommentList from "./CommentList";
import { useState } from "react";

interface PostActionsProps {
  postId: string;
  voteCount: number;
}

const PostActions = ({ postId, voteCount }: PostActionsProps) => {
  const [showComments, setShowComments] = useState(false);

  if (showComments) {
    return <CommentList postId={postId} onBack={() => setShowComments(false)} />;
  }

  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t">
      <LikeButton postId={postId} />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(true)}
        className={cn("flex items-center gap-2")}
      >
        <MessageCircle className="w-4 h-4" />
      </Button>
      <ShareButton />
      <BookmarkButton postId={postId} />
      <VoteButton postId={postId} voteCount={voteCount} />
    </div>
  );
};

export default PostActions;