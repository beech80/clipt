import { Post } from "@/types/post";

interface PostInteractionsProps {
  post: Post;
  commentsCount: number;
  onCommentClick: () => void;
}

export const PostInteractions = ({ post, commentsCount, onCommentClick }: PostInteractionsProps) => {
  return (
    <div className="flex items-center gap-4 p-4">
      {/* Empty container for future interactions if needed */}
    </div>
  );
};