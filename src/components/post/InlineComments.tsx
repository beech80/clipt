import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { getComments } from "@/services/commentService";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface InlineCommentsProps {
  postId: string;
  maxComments?: number;
  onViewAllClick?: (e?: React.MouseEvent) => void;
}

const InlineComments: React.FC<InlineCommentsProps> = ({
  postId,
  maxComments = 3,
  onViewAllClick,
}) => {
  // Normalized post ID (always string)
  const normalizedPostId = typeof postId === "string" ? postId : String(postId);

  // Query comments for the post
  const { data: commentsData, isLoading } = useQuery({
    queryKey: ["comments-preview", normalizedPostId],
    queryFn: async () => {
      const result = await getComments(normalizedPostId);
      return result.data || [];
    },
    enabled: !!normalizedPostId,
    staleTime: 10000, // 10 seconds
  });

  // Comments and count
  const comments = commentsData || [];
  const totalComments = comments.length;
  const displayComments = comments.slice(0, maxComments);

  if (isLoading) {
    return (
      <div className="py-2 px-4 text-center">
        <Loader2 className="w-4 h-4 mx-auto animate-spin text-blue-500" />
      </div>
    );
  }

  if (totalComments === 0) {
    return null;
  }

  return (
    <div className="comments-container py-2">
      {displayComments.map((comment) => (
        <div key={comment.id} className="comment-item flex py-2">
          <div className="comment-avatar mr-2 ml-4">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={comment.profiles?.avatar_url || ""}
                alt={comment.profiles?.username || "User"}
              />
              <AvatarFallback>
                {(comment.profiles?.username?.[0] || "?").toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="comment-content flex-1 mr-4">
            <div className="comment-text">
              <span className="username font-semibold text-sm text-gaming-100 mr-2">
                {comment.profiles?.username || "Anonymous"}
              </span>
              <span className="text-sm text-gaming-200">
                {comment.content}
              </span>
            </div>
            <div className="comment-actions flex mt-1">
              <span className="text-xs text-gaming-400">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InlineComments;
