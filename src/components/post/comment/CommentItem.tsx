
import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Reply } from "lucide-react";
import { CommentForm } from "./CommentForm";

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
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, postId }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleReplyClick = () => {
    setIsReplying(!isReplying);
  };

  const handleReplyComplete = () => {
    setIsReplying(false);
    setShowReplies(true);
  };

  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };

  const username = comment.profiles?.username || "Unknown";
  const avatarUrl = comment.profiles?.avatar_url;
  const formattedDate = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

  return (
    <div className="w-full bg-[#1e2230] rounded-lg p-3 mb-2">
      <div className="flex items-start space-x-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarUrl || ''} alt={username} />
          <AvatarFallback>{username[0]?.toUpperCase() || '?'}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-sm text-white">{username}</span>
              <span className="text-xs text-gray-400 ml-2">{formattedDate}</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-200 mt-1">{comment.content}</p>
          
          <div className="flex items-center space-x-3 mt-2">
            <button 
              className="flex items-center text-xs text-gray-400 hover:text-[#9b87f5]"
            >
              <Heart className="h-3.5 w-3.5 mr-1" />
              <span>{comment.likes_count || 0}</span>
            </button>
            
            <button 
              className="flex items-center text-xs text-gray-400 hover:text-[#9b87f5]"
              onClick={handleReplyClick}
            >
              <Reply className="h-3.5 w-3.5 mr-1" />
              <span>Reply</span>
            </button>
            
            {hasReplies && (
              <button 
                className="text-xs text-[#9b87f5] hover:underline"
                onClick={toggleReplies}
              >
                {showReplies ? 'Hide replies' : `View ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
              </button>
            )}
          </div>
          
          {isReplying && (
            <div className="mt-3">
              <CommentForm 
                postId={postId} 
                parentId={comment.id} 
                onCancel={() => setIsReplying(false)}
                onReplyComplete={handleReplyComplete}
              />
            </div>
          )}
          
          {showReplies && hasReplies && (
            <div className="mt-2 pl-2 border-l-2 border-[#9b87f5]/20">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} postId={postId} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
