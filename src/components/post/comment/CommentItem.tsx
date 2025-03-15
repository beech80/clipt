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
      await likeComment(comment.id);
      
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

  // Delete comment
  const handleDelete = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      await deleteComment(comment.id, user.id);
      toast.success("Comment deleted");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    } finally {
      setIsDeleting(false);
    }
  };

  // Edit comment
  const handleEdit = async () => {
    if (!user || !isEditing) return;
    
    try {
      await editComment(comment.id, user.id, editedContent);
      setIsEditing(false);
      toast.success("Comment updated");
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
    }
  };

  // Format time distance (e.g. "2 hours ago")
  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return "recently";
    }
  };

  return (
    <div className="group">
      <div className="flex gap-2">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Avatar 
            className="h-8 w-8 cursor-pointer" 
            onClick={handleProfileClick}
          >
            <AvatarImage 
              src={comment.profiles?.avatar_url || ''} 
              alt={comment.profiles?.username || 'User'} 
            />
            <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500 text-white">
              {comment.profiles?.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
        
        {/* Comment content */}
        <div className="flex-grow">
          <div className={`${isEditing ? '' : 'bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-2xl'}`}>
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[60px] bg-gray-100 dark:bg-gray-800 border-none focus-visible:ring-1 focus-visible:ring-blue-500"
                />
                <div className="flex gap-2 justify-end">
                  <Button 
                    onClick={() => setIsEditing(false)} 
                    size="sm" 
                    variant="ghost"
                    className="h-8 px-2 text-gray-500"
                  >
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                  <Button 
                    onClick={handleEdit} 
                    size="sm" 
                    variant="default"
                    className="h-8 px-3 bg-blue-500 hover:bg-blue-600"
                  >
                    <Check className="h-4 w-4 mr-1" /> Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col">
                  <div className="flex items-start gap-1">
                    <span 
                      className="font-semibold text-sm hover:underline cursor-pointer"
                      onClick={handleProfileClick}
                    >
                      {comment.profiles?.username || 'Unknown User'}
                    </span>
                    {isAuthor && (
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
                        Author
                      </span>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
                </div>
              </>
            )}
          </div>
          
          {/* Comment actions */}
          {!isEditing && (
            <div className="flex items-center mt-1 gap-4 text-xs text-gray-500">
              {/* Like */}
              <button 
                className={`flex items-center gap-1 hover:text-gray-800 dark:hover:text-gray-200 ${likesCount > 0 ? 'text-red-500 hover:text-red-600' : ''}`}
                onClick={handleLike}
                disabled={isLiking}
              >
                {likesCount > 0 ? (
                  <Heart className="h-3 w-3 fill-current" />
                ) : (
                  <Heart className="h-3 w-3" />
                )}
                <span>{likesCount > 0 ? likesCount : 'Like'}</span>
              </button>
              
              {/* Reply */}
              <button 
                className="flex items-center gap-1 hover:text-gray-800 dark:hover:text-gray-200"
                onClick={handleReply}
              >
                <Reply className="h-3 w-3" />
                <span>Reply</span>
              </button>
              
              {/* Time */}
              <span className="text-gray-400">{formatTimeAgo(comment.created_at)}</span>
              
              {/* Options - Only show for author */}
              {isAuthor && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 rounded-full"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={handleDelete}
                        className="text-red-500 focus:text-red-500"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          )}
          
          {/* Render reply form if this comment is being replied to */}
          {isReplying && (
            <div id={`reply-${comment.id}`} className="mt-3 ml-3">
              <CommentForm 
                postId={comment.id.split('_')[0]} 
                parentId={comment.id}
                onReplyComplete={() => {
                  if (onReplyAdded) onReplyAdded();
                  if (onReplyCancel) onReplyCancel();
                  setShowReplies(true);
                }}
                onCancel={onReplyCancel}
                placeholder={`Reply to ${comment.profiles?.username || 'this comment'}...`}
                autoFocus
              />
            </div>
          )}
          
          {/* Render nested replies */}
          {hasReplies && (
            <div className="mt-2">
              <button 
                className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
                onClick={() => setShowReplies(!showReplies)}
              >
                <MessageSquare className="h-3 w-3" />
                {showReplies 
                  ? `Hide ${comment.children?.length} ${comment.children?.length === 1 ? 'reply' : 'replies'}`
                  : `View ${comment.children?.length} ${comment.children?.length === 1 ? 'reply' : 'replies'}`
                }
              </button>
              
              {/* Show replies when expanded */}
              {showReplies && comment.children && (
                <div className="mt-2 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
                  {comment.children.map((reply) => (
                    <div key={reply.id} className="mt-3">
                      <CommentItem
                        comment={reply}
                        depth={depth + 1}
                        onReply={onReply}
                        isReplying={isReplying && reply.id === comment.id}
                        onReplyCancel={onReplyCancel}
                        onReplyAdded={onReplyAdded}
                      />
                    </div>
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
