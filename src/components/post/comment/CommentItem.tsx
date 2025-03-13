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

  // Handle after reply is submitted
  const handleReplySubmitted = () => {
    setIsReplying(false);
    if (onReplyAdded) {
      onReplyAdded();
    }
  };

  return (
    <div className="px-4 py-2">
      <div className="flex items-start gap-3">
        {/* User avatar */}
        <div 
          className="cursor-pointer"
          onClick={() => navigate(`/profile/${comment.user_id}`)}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={comment.profiles.avatar_url || undefined}
              alt={comment.profiles.username || "User"}
            />
            <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500 text-white">
              {comment.profiles.username?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
        
        {/* Comment content */}
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="resize-none min-h-[60px] bg-gaming-800 border-gaming-700 focus:border-purple-500 text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedContent(comment.content);
                  }}
                  className="h-8 text-xs text-gray-400 hover:text-gray-300"
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleEdit}
                  disabled={editedContent.trim() === comment.content || editedContent.trim() === ""}
                  className="h-8 text-xs bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-sm bg-gaming-800/60 rounded-2xl px-3 py-2">
                <span 
                  className="font-semibold text-gray-200 mr-2 cursor-pointer hover:underline"
                  onClick={() => navigate(`/profile/${comment.user_id}`)}
                >
                  {comment.profiles.username}
                </span>
                <span className="text-sm text-gray-300">{comment.content}</span>
              </div>
              
              {/* Comment metadata and actions */}
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-1 ml-1">
                <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                {likesCount > 0 && <span>{likesCount} likes</span>}
                <button 
                  className="hover:text-gray-300 font-medium" 
                  onClick={handleReplyClick}
                >
                  Reply
                </button>
                
                {/* Author-only edit/delete dropdown */}
                {isAuthor && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="hover:text-gray-300 font-medium">
                        • • •
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-gaming-800 border-gaming-700">
                      <DropdownMenuItem 
                        className="text-sm cursor-pointer hover:bg-gaming-700 text-gray-300"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-sm text-red-500 cursor-pointer hover:bg-gaming-700"
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
          className="flex items-center text-gray-500 hover:text-red-500 mt-3"
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
            className="text-xs text-gray-500 hover:text-gray-300 flex items-center"
            onClick={handleToggleReplies}
          >
            <div className="w-6 h-[1px] bg-gray-700 mr-2"></div>
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
