import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { createComment, getComments, editComment, deleteComment } from '@/services/commentService';
import { toast } from 'sonner';
import { Loader2, Smile, Send, X, Heart, ChevronDown, ChevronUp, MoreVertical, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
  children?: Comment[];
  likes_count?: number;
}

interface CommentFormProps {
  postId: string;
  parentId?: string | null;
  onReplyComplete?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  buttonText?: string;
  className?: string;
  autoFocus?: boolean;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  postId,
  parentId = null,
  onReplyComplete,
  onCancel,
  placeholder = "Write your comment...",
  buttonText = "Post Comment",
  className = '',
  autoFocus = false
}) => {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showRepliesFor, setShowRepliesFor] = useState<Record<string, boolean>>({});
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editContent, setEditContent] = useState('');

  // Fetch comments for this post
  const { data: comments = [], isLoading, refetch } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const result = await getComments(postId);
      return result.data || [];
    },
    enabled: !!postId,
  });

  // Organize comments into parent-child structure
  const organizeComments = (comments: Comment[] = []) => {
    if (!comments || comments.length === 0) return [];
    
    const commentMap = new Map();
    const topLevelComments: Comment[] = [];

    // First pass: Create a map of all comments
    comments.forEach(comment => {
      comment.children = [];
      commentMap.set(comment.id, comment);
    });

    // Second pass: Organize comments into a tree structure
    comments.forEach(comment => {
      if (comment.parent_id) {
        const parentComment = commentMap.get(comment.parent_id);
        if (parentComment) {
          parentComment.children.push(comment);
        } else {
          // If parent doesn't exist, treat as top-level
          topLevelComments.push(comment);
        }
      } else {
        topLevelComments.push(comment);
      }
    });

    // Sort top-level comments by creation date (newest first)
    return topLevelComments.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  const organizedComments = organizeComments(comments);

  // Auto focus textarea if requested
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to comment');
      return;
    }
    
    if (!commentText.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createComment({
        content: commentText,
        post_id: postId,
        user_id: user.id,
        parent_id: parentId
      });
      
      setCommentText('');
      refetch();
      
      if (onReplyComplete) {
        onReplyComplete();
      }
      
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentCommentId: string) => {
    if (!user) {
      toast.error('Please login to reply');
      return;
    }
    
    if (!replyText.trim()) {
      return;
    }
    
    try {
      await createComment({
        content: replyText,
        post_id: postId,
        user_id: user.id,
        parent_id: parentCommentId
      });
      
      setReplyText('');
      setReplyingToId(null);
      refetch();
      
      toast.success('Reply added');
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to add reply');
    }
  };

  const handleEditComment = async () => {
    if (!editingComment || !user) return;
    
    try {
      await editComment(editingComment.id, user.id, editContent);
      setEditingComment(null);
      setEditContent('');
      refetch();
      toast.success('Comment updated');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    
    try {
      await deleteComment(commentId);
      refetch();
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const toggleReplies = (commentId: string) => {
    setShowRepliesFor(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // Emoji picker constants with popular emojis
  const popularEmojis = ['😊', '👍', '❤️', '🔥', '👏', '🎮', '😂', '🙌', '🤔', '😍', '😎', '👀', '🚀', '✨'];
  const gameEmojis = ['🎮', '🎯', '🎲', '🎪', '🏆', '🥇', '🏅', '🎖️', '🎨', '🎭'];
  
  const addEmoji = (emoji: string) => {
    setCommentText(prev => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return "recently";
    }
  };

  return (
    <div className={`shadow-lg ${className}`}>
      {/* Header with title */}
      <div className="bg-gaming-900 p-4 rounded-t-lg border-b border-gaming-700 flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Add Comment</h3>
        {onCancel && (
          <Button 
            onClick={onCancel} 
            size="icon"
            variant="ghost" 
            className="h-8 w-8 rounded-full hover:bg-gaming-700"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Content showing which post we're commenting on */}
      {parentId ? (
        <div className="px-4 py-2 bg-gaming-800 text-sm text-gray-400">
          Replying to comment
        </div>
      ) : (
        <div className="px-4 py-2 bg-gaming-800 text-sm text-gray-400">
          Commenting on post from {user?.user_metadata?.username || 'user'}
        </div>
      )}

      {/* Comments Section */}
      <div className="bg-gaming-800 p-4 max-h-[350px] overflow-y-auto">
        <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
          <MessageCircle className="h-4 w-4 mr-1" />
          Comments ({comments.length})
        </h4>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : organizedComments.length === 0 ? (
          <div className="bg-gaming-900 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {organizedComments.map(comment => (
              <div key={comment.id} className="group">
                <div className="flex items-start gap-3 bg-gaming-900 rounded-lg p-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage 
                      src={comment.profiles?.avatar_url || ''} 
                      alt={comment.profiles?.username || 'User'} 
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500 text-white">
                      {comment.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="font-semibold text-white text-sm">
                        {comment.profiles?.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(comment.created_at)}
                      </span>
                    </div>
                    
                    {editingComment?.id === comment.id ? (
                      <div className="mt-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[60px] bg-gaming-800 border border-gaming-700 focus:ring-2 focus:ring-purple-600 rounded-lg text-white resize-none text-sm"
                          autoFocus
                        />
                        <div className="flex gap-2 mt-2 justify-end">
                          <Button 
                            variant="ghost" 
                            onClick={() => setEditingComment(null)}
                            size="sm"
                            className="text-gray-300 hover:text-white hover:bg-gaming-700"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleEditComment}
                            size="sm"
                            disabled={!editContent.trim() || editContent.trim() === comment.content}
                            className="bg-gradient-to-r from-blue-600 to-purple-700 text-white"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-200 text-sm break-words">
                        {comment.content}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2">
                      <button 
                        onClick={() => setReplyingToId(prevId => prevId === comment.id ? null : comment.id)}
                        className="text-xs text-gray-400 hover:text-indigo-400 flex items-center"
                      >
                        Reply
                      </button>
                      
                      {comment.children && comment.children.length > 0 && (
                        <button
                          onClick={() => toggleReplies(comment.id)}
                          className="text-xs text-gray-400 hover:text-indigo-400 flex items-center"
                        >
                          {showRepliesFor[comment.id] ? (
                            <>
                              <ChevronUp className="h-3 w-3 mr-1" />
                              Hide replies
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3 mr-1" />
                              Show replies ({comment.children.length})
                            </>
                          )}
                        </button>
                      )}
                      
                      {user && user.id === comment.user_id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-gaming-800 border border-gaming-700">
                            <DropdownMenuItem 
                              className="cursor-pointer hover:bg-gaming-700 text-gray-200"
                              onClick={() => {
                                setEditingComment(comment);
                                setEditContent(comment.content);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer hover:bg-gaming-700 text-red-400"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Reply input */}
                {replyingToId === comment.id && (
                  <div className="ml-8 mt-2 bg-gaming-900 rounded-lg p-3 border border-gaming-700">
                    <div className="text-xs text-indigo-400 mb-2">
                      Replying to {comment.profiles?.username}
                    </div>
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your reply..."
                      className="min-h-[60px] bg-gaming-800 border border-gaming-700 rounded-lg text-white resize-none text-sm"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        variant="ghost"
                        onClick={() => setReplyingToId(null)}
                        size="sm"
                        className="text-gray-300 hover:text-white hover:bg-gaming-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleReply(comment.id)}
                        disabled={!replyText.trim()}
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-purple-700 text-white"
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Replies */}
                {showRepliesFor[comment.id] && comment.children && comment.children.length > 0 && (
                  <div className="ml-8 mt-2 space-y-2">
                    {comment.children.map(reply => (
                      <div key={reply.id} className="bg-gaming-900 rounded-lg p-3 group">
                        <div className="flex items-start gap-2">
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarImage 
                              src={reply.profiles?.avatar_url || ''} 
                              alt={reply.profiles?.username || 'User'} 
                            />
                            <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500 text-white text-xs">
                              {reply.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between mb-1">
                              <span className="font-semibold text-white text-xs">
                                {reply.profiles?.username}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(reply.created_at)}
                              </span>
                            </div>
                            
                            {editingComment?.id === reply.id ? (
                              <div className="mt-1">
                                <Textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="min-h-[40px] bg-gaming-800 border border-gaming-700 rounded-lg text-white resize-none text-xs"
                                  autoFocus
                                />
                                <div className="flex gap-2 mt-2 justify-end">
                                  <Button 
                                    variant="ghost" 
                                    onClick={() => setEditingComment(null)}
                                    size="sm"
                                    className="h-7 text-xs text-gray-300 hover:text-white hover:bg-gaming-700"
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={handleEditComment}
                                    size="sm"
                                    className="h-7 text-xs bg-gradient-to-r from-blue-600 to-purple-700 text-white"
                                    disabled={!editContent.trim() || editContent.trim() === reply.content}
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-200 text-xs break-words">
                                {reply.content}
                              </p>
                            )}
                            
                            {user && user.id === reply.user_id && (
                              <div className="flex justify-end mt-1">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                                      <MoreVertical className="h-3 w-3" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="bg-gaming-800 border border-gaming-700">
                                    <DropdownMenuItem 
                                      className="cursor-pointer hover:bg-gaming-700 text-gray-200 text-xs"
                                      onClick={() => {
                                        setEditingComment(reply);
                                        setEditContent(reply.content);
                                      }}
                                    >
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="cursor-pointer hover:bg-gaming-700 text-red-400 text-xs"
                                      onClick={() => handleDeleteComment(reply.id)}
                                    >
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Form for adding comment */}
      <form onSubmit={handleSubmit} className="bg-gaming-800 p-4 rounded-b-lg border-t border-gaming-700">
        {/* Textarea for comment */}
        <div className="relative mb-4">
          <textarea
            ref={textareaRef}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={placeholder}
            className="w-full h-24 bg-gaming-900 border border-gaming-700 rounded-lg p-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
          />
          
          {/* Emoji picker button */}
          <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
            <PopoverTrigger asChild>
              <Button 
                type="button" 
                size="sm" 
                variant="ghost" 
                className="absolute bottom-2 right-2 h-8 w-8 p-0 rounded-full text-gray-400 hover:text-white hover:bg-gaming-700"
              >
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="bg-gaming-800 border-gaming-700 p-3 w-64 shadow-lg rounded-xl">
              <div className="mb-2">
                <div className="text-sm text-gray-400 mb-1">Popular</div>
                <div className="flex flex-wrap gap-1">
                  {popularEmojis.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        addEmoji(emoji);
                        setIsEmojiPickerOpen(false);
                      }}
                      className="text-xl hover:bg-gaming-700 p-1.5 rounded-md transition-colors w-9 h-9"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Gaming</div>
                <div className="flex flex-wrap gap-1">
                  {gameEmojis.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        addEmoji(emoji);
                        setIsEmojiPickerOpen(false);
                      }}
                      className="text-xl hover:bg-gaming-700 p-1.5 rounded-md transition-colors w-9 h-9"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <Button 
              onClick={onCancel} 
              type="button"
              variant="outline" 
              className="border-gaming-600 hover:bg-gaming-700 text-gray-300"
            >
              Cancel
            </Button>
          )}
          
          <Button 
            type="submit"
            disabled={isSubmitting || !commentText.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white px-6 py-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {buttonText}
          </Button>
        </div>
      </form>
    </div>
  );
};
