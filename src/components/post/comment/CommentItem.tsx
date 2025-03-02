import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Reply } from "lucide-react";
import { CommentForm } from "./CommentForm";
import { useAuth } from "@/contexts/AuthContext";
import { likeComment } from "@/services/commentService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    likes_count: number;
    user_id: string;
    replies: any[];
    profiles: {
      username: string;
      avatar_url: string | null;
    };
  };
  postId: string;
  onReplyAdded?: () => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, postId, onReplyAdded }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
  const { user } = useAuth();
  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleReplyClick = () => {
    setIsReplying(!isReplying);
  };

  const handleReplyComplete = () => {
    setIsReplying(false);
    setShowReplies(true);
    if (onReplyAdded) onReplyAdded();
  };

  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };

  const handleLike = async () => {
    if (!user) {
      toast.error("Please login to like comments");
      return;
    }

    try {
      setIsLiking(true);
      const { data, error } = await likeComment(comment.id, user.id);
      
      if (error) {
        throw error;
      }
      
      if (data.liked) {
        setLikesCount(prev => prev + 1);
        toast.success("Comment liked");
      } else {
        setLikesCount(prev => Math.max(0, prev - 1));
        toast.success("Comment unliked");
      }
    } catch (error) {
      console.error("Error liking comment:", error);
      toast.error("Failed to like comment");
    } finally {
      setIsLiking(false);
    }
  };

  const username = comment.profiles?.username || "Unknown";
  const avatarUrl = comment.profiles?.avatar_url;
  const formattedDate = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

  // Exit early if no valid postId
  if (!postId || typeof postId !== 'string' || postId.trim() === '') {
    console.error("Invalid postId in CommentItem for comment:", comment.id);
    return null;
  }

  return (
    <div className="rounded-lg bg-[#252A39] p-3 mb-3">
      <div className="flex">
        <Avatar className="h-8 w-8 mr-3 rounded-full">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={username} />
          ) : (
            <AvatarFallback className="bg-[#9b87f5]/30 text-[#9b87f5]">
              {username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm">{username}</span>
            <span className="text-xs text-gray-400">{formattedDate}</span>
          </div>
          <p className="text-sm mb-2 whitespace-pre-wrap break-words text-gray-200">
            {comment.content}
          </p>
          <div className="flex items-center space-x-4 mt-2">
            <button 
              className={`text-xs flex items-center ${isLiking ? 'opacity-50' : 'hover:text-[#9b87f5]'} transition-colors`}
              onClick={handleLike}
              disabled={isLiking}
            >
              <Heart className={`h-3.5 w-3.5 mr-1 ${likesCount > 0 ? 'text-red-500 fill-red-500' : ''}`} />
              <span>{likesCount}</span>
            </button>
            <button 
              className="text-xs flex items-center hover:text-[#9b87f5] transition-colors"
              onClick={handleReplyClick}
            >
              <Reply className="h-3.5 w-3.5 mr-1" />
              <span>Reply</span>
            </button>
          </div>
          
          {isReplying && (
            <div className="mt-3 ml-4 border-l-2 border-[#9b87f5]/20 pl-3">
              <CommentForm 
                postId={postId} 
                parentId={comment.id} 
                onCancel={() => setIsReplying(false)}
                onCommentAdded={handleReplyComplete}
              />
            </div>
          )}
          
          {hasReplies && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleReplies}
                className="text-xs text-[#9b87f5] hover:text-[#8a78d9] px-3 py-1"
              >
                {showReplies 
                  ? `Hide ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`
                  : `Show ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`
                }
              </Button>
              
              {showReplies && (
                <div className="ml-4 mt-2 border-l-2 border-[#9b87f5]/20 pl-3 space-y-3">
                  {comment.replies.map((reply) => (
                    <CommentItem 
                      key={reply.id} 
                      comment={reply}
                      postId={postId}
                      onReplyAdded={onReplyAdded}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
