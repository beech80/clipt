import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Reply, Trash2, Edit, X, Check, MessageSquare, MoreVertical } from "lucide-react";
import { CommentForm } from "./CommentForm";
import { useAuth } from "@/contexts/AuthContext";
import { likeComment, deleteComment, editComment } from "@/services/commentService";
import { toast } from "sonner";
import { communityErrorMessage, communityTextWarning } from '@/lib/community-text';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  likes_count?: number;
  liked_by_me?: boolean;
  user_id: string;
  children?: Comment[];
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  replyingId?: string | null;
  depth?: number;
  onReply?: (commentId: string) => void;
  isReplying?: boolean;
  onReplyCancel?: () => void;
  onReplyAdded?: () => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  postId,
  replyingId,
  depth = 0,
  onReply,
  isReplying = false,
  onReplyCancel,
  onReplyAdded 
}) => {
  const [showReplies, setShowReplies] = useState(depth === 0);
  const [isLiking, setIsLiking] = useState(false);
  const likesCount = comment.likes_count || 0;
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const hasReplies = comment.children && comment.children.length > 0;
  
  // Check if the current user is the author of the comment
  const isAuthor = user && user.id === comment.user_id;
  
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
      
      // Refresh server-maintained count and this viewer's own like state.
      await onReplyAdded?.();
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
      await onReplyAdded?.();
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
    const warning = communityTextWarning(editedContent);
    if (warning) { toast.error(warning); return; }
    
    try {
      await editComment(comment.id, user.id, editedContent);
      await onReplyAdded?.();
      setIsEditing(false);
      toast.success("Comment updated");
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error(communityErrorMessage(error, 'Comment was not updated. Your draft has been kept; please try again.'));
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
    <div className="group" data-comment-id={comment.id}>
      <div className="flex gap-2">
        {/* Avatar */}
        {depth<2 && <Link to={`/user/${comment.user_id}`} aria-label={`View ${comment.profiles?.username || 'user'} profile`} className="flex-shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300">
          <Avatar 
            className="h-8 w-8"
          >
            <AvatarImage 
              src={comment.profiles?.avatar_url || ''} 
              alt={comment.profiles?.username || 'User'} 
            />
            <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500 text-white">
              {comment.profiles?.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </Link>}
        
        {/* Comment content */}
        <div className="flex-grow min-w-0">
          <div className={`${isEditing ? '' : 'bg-[#19152b] text-violet-50 border border-violet-400/20 px-3 py-2 rounded-2xl'}`}>
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  aria-label="Edit comment"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[60px] bg-[#19152b] text-violet-50 border-violet-400/30 focus-visible:ring-1 focus-visible:ring-violet-400"
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
                  <div className="flex flex-wrap items-start gap-1">
                    <Link
                      to={`/user/${comment.user_id}`}
                      className="font-semibold text-sm break-all hover:underline rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300"
                    >
                      {comment.profiles?.username || 'Unknown User'}
                    </Link>
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
            <div className="flex flex-wrap items-center mt-1 gap-3 text-xs text-violet-200">
              {/* Like */}
              <button 
                aria-label={comment.liked_by_me ? 'Unlike comment' : 'Like comment'}
                aria-pressed={Boolean(comment.liked_by_me)}
                className={`flex items-center gap-1 hover:text-white ${comment.liked_by_me ? 'text-pink-400' : ''}`}
                onClick={handleLike}
                disabled={isLiking}
              >
                {comment.liked_by_me ? (
                  <Heart className="h-3 w-3 fill-current" />
                ) : (
                  <Heart className="h-3 w-3" />
                )}
                <span>{likesCount > 0 ? likesCount : 'Like'}</span>
              </button>
              
              {/* Reply */}
              <button 
                className="flex items-center gap-1 hover:text-white"
                onClick={handleReply}
              >
                <Reply className="h-3 w-3" />
                <span>Reply</span>
              </button>
              
              {/* Time */}
              <span className="text-gray-400">{formatTimeAgo(comment.created_at)}</span>
              
              {/* Options - Only show for author */}
              {isAuthor && (
                <div className="ml-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        aria-label="Comment options"
                        disabled={isDeleting}
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
                postId={postId}
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
                aria-expanded={Boolean(showReplies)}
              >
                <MessageSquare className="h-3 w-3" />
                {showReplies 
                  ? `Hide ${comment.children?.length} ${comment.children?.length === 1 ? 'reply' : 'replies'}`
                  : `View ${comment.children?.length} ${comment.children?.length === 1 ? 'reply' : 'replies'}`
                }
              </button>
              
              {/* Show replies when expanded */}
              {showReplies && comment.children && (
                <div className={depth<2?'mt-2 pl-3 border-l-2 border-gray-200 dark:border-gray-700':'mt-2'}>
                  {comment.children.map((reply) => (
                    <div key={reply.id} className="mt-3">
                      <CommentItem
                        comment={reply}
                        postId={postId}
                        replyingId={replyingId}
                        depth={depth + 1}
                        onReply={onReply}
                        isReplying={replyingId === reply.id}
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
