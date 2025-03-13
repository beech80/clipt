import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Reply, Trash2, Edit, X, Check, MessageSquare, MoreVertical } from "lucide-react";
import { CommentForm } from "./CommentForm";
import { useAuth } from "@/contexts/AuthContext";
import { likeComment, deleteComment, editComment } from "@/services/commentService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  likes_count?: number;
  user_id: string;
  children?: Comment[];
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

interface CommentItemProps {
  comment: Comment;
  depth?: number;
  onReply?: (commentId: string) => void;
  isReplying?: boolean;
  onReplyCancel?: () => void;
  onReplyAdded?: () => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  depth = 0,
  onReply,
  isReplying = false,
  onReplyCancel,
  onReplyAdded 
}) => {
  const [showReplies, setShowReplies] = useState(depth === 0);
  const [isLiking, setIsLiking] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const hasReplies = comment.children && comment.children.length > 0;
  
  // Check if the current user is the author of the comment
  const isAuthor = user && user.id === comment.user_id;
  
  // Handle profile click
  const handleProfileClick = () => {
    if (!comment.user_id) return;
    navigate(`/profile/${comment.user_id}`);
  };

  // Like / Unlike comment
  const handleLike = async () => {
    if (!user) {
      toast.error("Please login to like comments");
      return;
    }

    setIsLiking(true);
    try {
      // Toggle comment like
      await likeComment(comment.id, user.id);
      
      // Update UI immediately
      setLikesCount(prev => prev > 0 ? prev - 1 : prev + 1);
    } catch (error) {
      console.error("Error liking comment:", error);
      toast.error("Failed to like comment");
    } finally {
      setIsLiking(false);
    }
  };

  // Reply to this comment
  const handleReply = () => {
    if (!user) {
      toast.error("Please login to reply");
      return;
    }
    
    if (onReply) {
      onReply(comment.id);
    }
  };

  // Edit functions
  const handleEdit = async () => {
    if (editedContent.trim() === comment.content || editedContent.trim() === "") {
      return;
    }

    try {
      await editComment(comment.id, user?.id || '', editedContent.trim());
      toast.success("Comment updated successfully");
      setIsEditing(false);
      // Trigger any needed refreshes
      if (onReplyAdded) {
        onReplyAdded();
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      setIsDeleting(true);
      try {
        await deleteComment(comment.id, user?.id || '');
        toast.success("Comment deleted successfully");
        // Trigger any needed refreshes
        if (onReplyAdded) {
          onReplyAdded();
        }
      } catch (error) {
        console.error("Error deleting comment:", error);
        toast.error("Failed to delete comment");
        setIsDeleting(false);
      }
    }
  };

  // Calculate days ago for display
  const daysAgo = () => {
    const today = new Date();
    const commentDate = new Date(comment.created_at);
    const diffTime = Math.abs(today.getTime() - commentDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 'd';
  };

  // Render the comment item
  return (
    <div className={`py-2 ${isDeleting ? 'opacity-50' : ''}`}>
      {/* Main comment content */}
      <div className="flex">
        {/* Avatar */}
        <div className="flex-shrink-0 mr-3">
          <Avatar 
            className="h-8 w-8 cursor-pointer" 
            onClick={handleProfileClick}
          >
            <AvatarImage 
              src={comment.profiles?.avatar_url || ''} 
              alt={comment.profiles?.username || 'User'} 
            />
            <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500 text-white">
              {(comment.profiles?.username?.charAt(0) || 'U').toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        
        {/* Comment content - Instagram style */}
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[80px] bg-gaming-800 border-gaming-700 text-sm resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditedContent(comment.content);
                  }}
                  className="h-8 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleEdit}
                  className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {/* Username and comment text */}
              <div className="flex flex-wrap">
                <span 
                  className="font-semibold mr-2 cursor-pointer hover:underline text-gaming-100"
                  onClick={handleProfileClick}
                >
                  {comment.profiles?.username || 'User'}
                </span>
                <span className="text-gaming-200">{comment.content}</span>
              </div>
              
              {/* Comment metadata row - Instagram style */}
              <div className="flex items-center mt-1 text-xs text-gaming-400 space-x-3">
                <span>{daysAgo()}</span>
                {likesCount > 0 && (
                  <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
                )}
                <button 
                  className="font-medium hover:text-gaming-300"
                  onClick={handleReply}
                >
                  Reply
                </button>
                {isAuthor && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-gaming-400 hover:text-gaming-300">
                        <MoreVertical className="h-3 w-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="start" 
                      className="bg-gaming-800 border-gaming-700 text-gaming-100"
                    >
                      <DropdownMenuItem 
                        onClick={() => setIsEditing(true)}
                        className="hover:bg-gaming-700 cursor-pointer"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={handleDelete}
                        className="text-red-500 hover:bg-gaming-700 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          )}
          
          {/* Like button - Instagram style */}
          <button 
            className="absolute right-3"
            onClick={handleLike}
            disabled={isLiking}
          >
            <Heart 
              className={`h-4 w-4 ${likesCount > 0 ? 'fill-red-500 text-red-500' : 'text-gaming-400'}`} 
            />
          </button>
        </div>
      </div>
      
      {/* Reply form if replying to this comment */}
      {isReplying && (
        <div className="ml-11 mt-3">
          <CommentForm 
            postId=""  // We don't need post ID for replies
            parentId={comment.id}
            onCancel={onReplyCancel}
            onReplyComplete={onReplyAdded}
            placeholder={`Reply to ${comment.profiles?.username || 'User'}...`}
            buttonText="Reply"
          />
        </div>
      )}
      
      {/* Nested replies - Instagram style */}
      {hasReplies && (
        <div className="mt-1">
          {/* Toggle replies button - Instagram style */}
          {comment.children && comment.children.length > 0 && depth === 0 && (
            <button
              className="ml-11 text-xs text-gaming-400 hover:text-gaming-300 flex items-center"
              onClick={() => setShowReplies(!showReplies)}
            >
              <div className="w-5 h-[1px] bg-gaming-700 mr-2"></div>
              {showReplies ? 'Hide replies' : `View ${comment.children.length} ${comment.children.length === 1 ? 'reply' : 'replies'}`}
            </button>
          )}
          
          {/* Replies */}
          {showReplies && comment.children && comment.children.length > 0 && (
            <div className="pl-11 mt-1 space-y-2">
              {comment.children.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  depth={depth + 1}
                  onReply={onReply}
                  isReplying={false} // Only one reply form can be open at a time
                  onReplyCancel={onReplyCancel}
                  onReplyAdded={onReplyAdded}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
