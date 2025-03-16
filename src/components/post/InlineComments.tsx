import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { getComments } from "@/services/commentService";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface InlineCommentsProps {
  postId: string;
  maxComments?: number;
  onViewAllClick?: () => void;
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
    <div className="px-4 py-2 border-t border-gaming-400/20">
      {/* View all comments link */}
      {totalComments > 0 && (
        <button
          onClick={onViewAllClick}
          className="text-blue-500 hover:text-blue-400 text-sm font-medium mb-2 flex items-center"
        >
          View all {totalComments} comments
        </button>
      )}

      {/* Comment previews */}
      <div className="space-y-2">
        {displayComments.map((comment) => (
          <div key={comment.id} className="flex items-start gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={comment.profiles?.avatar_url || ""}
                alt={comment.profiles?.username || "User"}
              />
              <AvatarFallback>
                {(comment.profiles?.username?.[0] || "?").toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="inline-flex items-baseline">
                <span className="font-semibold text-sm text-gaming-100 mr-2">
                  {comment.profiles?.username || "Anonymous"}
                </span>
                <span className="text-sm text-gaming-200 break-words">
                  {comment.content}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gaming-400">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                  })}
                </span>
                {/* Could add reply button here in the future */}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InlineComments;
