import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import LikeButton from "./actions/LikeButton";
import BookmarkButton from "./actions/BookmarkButton";
import VoteButton from "./actions/VoteButton";
import ShareButton from "./actions/ShareButton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import CommentList from "./CommentList";

interface PostActionsProps {
  postId: string;
  voteCount: number;
  onCommentClick: () => void;
  showComments: boolean;
}

const PostActions = ({ postId, voteCount, onCommentClick, showComments }: PostActionsProps) => {
  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t">
      <LikeButton postId={postId} />
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCommentClick}
            className={cn("flex items-center gap-2", showComments && "text-primary")}
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full p-0 sm:max-w-full">
          <CommentList postId={postId} />
        </SheetContent>
      </Sheet>
      <ShareButton />
      <BookmarkButton postId={postId} />
      <VoteButton postId={postId} voteCount={voteCount} />
    </div>
  );
};

export default PostActions;