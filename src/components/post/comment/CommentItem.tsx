import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Reply, Trash2, Edit, X, Check, MessageSquare } from "lucide-react";
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

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    updated_at?: string;
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const hasReplies = comment.replies && comment.replies.length > 0;
  
  // Check if the current user is the author of the comment
  const isAuthor = user && user.id === comment.user_id;

  // Handle clicking on a username to navigate to their profile
  const handleUsernameClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    navigate(`/profile/${comment.user_id}`);
  };

  // Handle like functionality
  const handleLike = async () => {
    if (!user) {
      toast.error("Please login to like comments");
      return;
    }

    if (isLiking) return;
    setIsLiking(true);

    try {
      // Optimistic UI update
      setLikesCount(prev => prev + 1);
      
      // API call
      await likeComment(comment.id);
    } catch (error) {
      // Revert on error
      setLikesCount(prev => prev - 1);
      console.error("Error liking comment:", error);
      toast.error("Failed to like comment");
    } finally {
      setIsLiking(false);
    }
  };

  // Toggle reply form visibility
  const handleReplyClick = () => {
    setIsReplying(!isReplying);
  };

  // Toggle replies visibility
  const handleToggleReplies = () => {
    setShowReplies(!showReplies);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(comment.content);
  };

  // Submit edited comment
  const handleSubmitEdit = async () => {
    if (!editedContent.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      await editComment(comment.id, editedContent);
      setIsEditing(false);
      toast.success("Comment updated");
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
    }
  };

  // Delete comment
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteComment(comment.id);
      toast.success("Comment deleted");
      // We'll rely on the parent component to refresh the comments list
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
      setIsDeleting(false);
    }
  };

  // Handle after reply is submitted
  const handleReplySubmitted = () => {
    setIsReplying(false);
    if (onReplyAdded) {
      onReplyAdded();
    }
  };

  return (
    <div className="space-y-2 px-4 py-2">
      {/* Main comment content */}
      <div className="flex items-start gap-3">
        {/* User avatar */}
        <div 
          className="w-8 h-8 rounded-full overflow-hidden cursor-pointer"
          onClick={handleUsernameClick}
        >
          <Avatar className="w-full h-full">
            <AvatarImage 
              src={comment.profiles.avatar_url || undefined} 
              alt={comment.profiles.username} 
            />
            <AvatarFallback>
              {comment.profiles.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Comment content area */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[80px] bg-gray-100 dark:bg-gaming-800 border-0 rounded-md focus-visible:ring-0 text-sm"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs"
                  onClick={handleCancelEdit}
                  disabled={isDeleting}
                >
                  <X className="mr-1 w-3 h-3" /> Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs bg-blue-500 hover:bg-blue-600"
                  onClick={handleSubmitEdit}
                  disabled={isDeleting}
                >
                  <Check className="mr-1 w-3 h-3" /> Save
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {/* Username and comment content */}
              <div className="pb-1">
                <span 
                  className="font-medium text-sm mr-2 cursor-pointer hover:underline"
                  onClick={handleUsernameClick}
                >
                  {comment.profiles.username}
                </span>
                <span className="text-sm">{comment.content}</span>
              </div>
              
              {/* Comment metadata and actions */}
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                {likesCount > 0 && <span>{likesCount} likes</span>}
                <button 
                  className="hover:text-gray-900 dark:hover:text-gray-200 font-medium" 
                  onClick={handleReplyClick}
                >
                  Reply
                </button>
                
                {/* Author-only edit/delete dropdown */}
                {isAuthor && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="hover:text-gray-900 dark:hover:text-gray-200 font-medium">
                        • • •
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white dark:bg-gaming-800 border-gray-200 dark:border-gaming-700">
                      <DropdownMenuItem 
                        className="text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gaming-700"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-sm text-red-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-gaming-700"
                        onClick={handleDelete}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Like button */}
        <button
          className="flex items-center text-gray-500 hover:text-red-500 dark:text-gray-400"
          onClick={handleLike}
          disabled={isLiking}
        >
          <Heart className={`h-4 w-4 ${likesCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>
      
      {/* Reply form */}
      {isReplying && (
        <div className="ml-10 mt-2">
          <CommentForm
            postId={postId}
            placeholder="Write a reply..."
            parentId={comment.id}
            onCommentAdded={handleReplySubmitted}
            buttonText="Reply"
          />
        </div>
      )}
      
      {/* Show/hide replies */}
      {hasReplies && (
        <div className="ml-10 mt-1">
          <button 
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center"
            onClick={handleToggleReplies}
          >
            <div className="w-6 h-[1px] bg-gray-300 dark:bg-gray-700 mr-2"></div>
            {showReplies ? 'Hide' : 'View'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
          </button>
        </div>
      )}
      
      {/* Replies list */}
      {showReplies && hasReplies && (
        <div className="ml-10 mt-2 space-y-4">
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
  );
};
