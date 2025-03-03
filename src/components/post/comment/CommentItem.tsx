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
  
  // Handler for starting edit mode
  const handleEditClick = () => {
    setIsEditing(true);
    setEditedContent(comment.content);
  };
  
  // Handler for saving edited comment
  const handleSaveEdit = async () => {
    if (!user) {
      toast.error("Please login to edit comments");
      return;
    }
    
    if (!editedContent.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    
    try {
      const { data, error } = await editComment(comment.id, user.id, editedContent);
      
      if (error) {
        throw error;
      }
      
      // Update the UI with edited content
      comment.content = editedContent;
      if (data && data[0]?.updated_at) {
        comment.updated_at = data[0].updated_at;
      }
      
      setIsEditing(false);
      toast.success("Comment updated");
    } catch (error) {
      console.error("Error editing comment:", error);
      toast.error("Failed to update comment");
    }
  };
  
  // Handler for cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(comment.content);
  };
  
  // Handler for deleting comment
  const handleDelete = async () => {
    if (!user) {
      toast.error("Please login to delete comments");
      return;
    }
    
    try {
      setIsDeleting(true);
      const { data, error } = await deleteComment(comment.id, user.id);
      
      if (error) {
        throw error;
      }
      
      // Remove the comment from UI (We'll rely on refetching in parent)
      if (onReplyAdded) onReplyAdded(); // Reuse the onReplyAdded to refetch comments
      toast.success("Comment deleted");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    } finally {
      setIsDeleting(false);
    }
  };

  const username = comment.profiles?.username || "Unknown";
  const avatarUrl = comment.profiles?.avatar_url;
  const formattedDate = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });
  const wasEdited = comment.updated_at && comment.updated_at !== comment.created_at;

  // Exit early if no valid postId
  if (!postId || typeof postId !== 'string' || postId.trim() === '') {
    console.error("Invalid postId in CommentItem for comment:", comment.id);
    return null;
  }

  return (
    <div className="rounded-lg bg-[#252A39] p-3 mb-3">
      <div className="flex gap-3 group relative">
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={username} />
            ) : (
              <AvatarFallback>
                {username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg relative">
            <div className="flex justify-between items-start gap-2">
              <a 
                href={`/profile/${comment.user_id}`}
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = `/profile/${comment.user_id}`;
                }}
                className="font-semibold text-gray-900 dark:text-white hover:underline"
              >
                {username}
              </a>
              {wasEdited && (
                <span className="text-xs text-gray-400 ml-2">(edited)</span>
              )}
              <div className="flex items-center">
                <span className="text-xs text-gray-400 mr-2">{formattedDate}</span>
                
                {!isAuthor && user && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/messages/${comment.user_id}`)}
                    className="text-xs p-1 hover:bg-[#1A1F2C] rounded-full"
                  >
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                  </Button>
                )}
                
                {isAuthor && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 hover:bg-[#1A1F2C] rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="19" cy="12" r="1" />
                          <circle cx="5" cy="12" r="1" />
                        </svg>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem 
                        onClick={handleEditClick}
                        disabled={isEditing || isDeleting}
                        className="cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-red-500 focus:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            
            {isEditing ? (
              <div className="mb-2">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[80px] text-sm bg-[#1A1F2C] border-[#3A3F4C] mb-2"
                  placeholder="Edit your comment..."
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancelEdit}
                    className="text-xs h-8"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Cancel
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleSaveEdit}
                    className="text-xs h-8 bg-[#9b87f5] hover:bg-[#8a78d9]"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm mb-2 whitespace-pre-wrap break-words text-gray-200">
                {comment.content}
              </p>
            )}
            
            {!isEditing && (
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
            )}
            
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
    </div>
  );
};
