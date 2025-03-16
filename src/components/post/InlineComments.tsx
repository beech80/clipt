import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { getComments } from "@/services/commentService";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageSquare } from "lucide-react";

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

  // Always render the container, even if no comments
  return (
    <div className="px-4 py-2 bg-gaming-800">
      {/* Only show comments if they exist */}
      {totalComments > 0 && (
        <>
          {/* Comment previews */}
          <div className="space-y-4">
            {displayComments.map((comment) => (
              <div key={comment.id} className="mt-2">
                <div className="flex items-start gap-2 bg-gaming-800 rounded-md p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={comment.profiles?.avatar_url || ""}
                      alt={comment.profiles?.username || "User"}
                    />
                    <AvatarFallback>
                      {(comment.profiles?.username?.[0] || "?").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex flex-col">
                      <div>
                        <span className="font-semibold text-sm text-gaming-100 mr-2">
                          {comment.profiles?.username || "Anonymous"}
                        </span>
                        <span className="text-sm text-gaming-200 break-words">
                          {comment.content}
                        </span>
                      </div>

                      <div className="flex items-center mt-2">
                        <span className="text-xs text-gaming-400">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default InlineComments;
