import React, { useState, useEffect } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { getComments, createComment, editComment, deleteComment } from '@/services/commentService';
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from '@/components/ui/avatar';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Heart, 
  MoreVertical, 
  ChevronDown, 
  ChevronUp,
  Send,
  X,
  ChevronLeft,
  Menu
} from 'lucide-react';

interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
  };
  parent_id?: string | null;
  children?: Comment[];
  likes_count?: number;
  liked_by_me?: boolean;
}

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  post?: {
    id: string;
    content?: string;
    created_at: string;
    profiles?: {
      username: string;
      avatar_url: string;
    };
  };
}

export const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  postId,
  post,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [showRepliesFor, setShowRepliesFor] = useState<Record<string, boolean>>({});
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editContent, setEditContent] = useState('');

  const { data: comments = [], isLoading, error, refetch } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const result = await getComments(postId);
      return result.data || [];
    },
    enabled: isOpen && !!postId,
  });

  // Organize comments into parent and children
  const organizedComments = comments.filter(comment => !comment.parent_id);
  organizedComments.forEach(parent => {
    parent.children = comments.filter(comment => comment.parent_id === parent.id);
  });

  // Reset form state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setComment('');
      setReplyingTo(null);
      setEditingComment(null);
    }
  }, [isOpen]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      if (isToday) {
        return format(date, 'h:mm a');
      } else {
        const daysAgo = formatDistanceToNow(date, { addSuffix: true });
        return daysAgo;
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const handleSubmitComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!comment.trim() || !user) return;

    try {
      const commentData = {
        post_id: postId,
        content: comment.trim(),
        parent_id: replyingTo ? replyingTo.id : null,
      };

      await createComment(commentData);
      
      setComment('');
      setReplyingTo(null);
      refetch();
      
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleReplyClick = (comment: Comment) => {
    setReplyingTo(comment);
    setComment('');
    
    // Focus on textarea after state update
    setTimeout(() => {
      const textarea = document.getElementById('comment-textarea');
      if (textarea) {
        textarea.focus();
      }
    }, 0);
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike if already liked
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      } else {
        // Like if not already liked
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
          });
      }

      // Invalidate and refetch comments
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    } catch (error) {
      console.error('Error liking comment:', error);
      toast({
        title: "Error",
        description: "Failed to like comment. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const toggleReplies = (commentId: string) => {
    setShowRepliesFor(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const isCommentAuthor = (comment: Comment) => {
    return user && user.id === comment.user_id;
  };

  const handleEditClick = (comment: Comment) => {
    setEditingComment(comment);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const handleSaveEdit = async () => {
    if (!editingComment || !editContent.trim()) return;

    try {
      await editComment(editingComment.id, user.id, editContent.trim());
      
      setEditingComment(null);
      setEditContent('');
      refetch();
      
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      
      refetch();
      
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-full h-[95vh] sm:max-w-[900px] p-0 m-0 bg-gradient-to-b from-[#1a1b26] to-[#282a36] border-[#3b3d4d] rounded-lg overflow-hidden">
        {/* Console-style header */}
        <div className="bg-[#1e1f2e] px-6 py-4 border-b border-[#3b3d4d] flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="text-gray-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h2 className="text-white text-xl font-semibold tracking-wide">
              Game Chat
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border-2 border-[#6366f1]">
                  <AvatarImage src={user.user_metadata?.avatar_url || ''} />
                  <AvatarFallback className="bg-[#2d2e3d]">
                    {user.user_metadata?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-white font-medium hidden sm:block">
                  {user.user_metadata?.username || 'User'}
                </span>
              </div>
            )}
            <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex h-[calc(100%-8rem)]">
          {/* Left sidebar - would contain friends/chats in a real console UI */}
          <div className="hidden lg:block w-64 border-r border-[#3b3d4d] p-4 bg-[#1c1d2b]">
            <div className="mb-4">
              <h3 className="text-gray-300 uppercase text-xs font-bold tracking-wider mb-3">
                Active Discussions
              </h3>
              {post && (
                <div className="bg-[#2d2e3d] rounded-lg p-3 mb-2 cursor-pointer border-l-4 border-indigo-500">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={post.profiles?.avatar_url || ''} />
                      <AvatarFallback className="bg-[#3d3e4d]">
                        {post.profiles?.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-white truncate">
                      {post.profiles?.username}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {post.content || 'Post content'}
                  </p>
                </div>
              )}
              <div className="bg-[#2d2e3d] rounded-lg p-3 opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-[#3d3e4d]"></div>
                  <span className="text-sm font-medium text-gray-400">
                    Other discussions
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main chat area */}
          <div className="flex-1 flex flex-col h-full">
            {/* Message list */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#1a1b26]">
              {isLoading ? (
                <div className="flex items-center justify-center h-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : error ? (
                <div className="text-red-400 text-center p-4 bg-[#2d2e3d] rounded-lg">
                  Error loading messages
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center p-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#2d2e3d] flex items-center justify-center">
                    <Heart className="h-8 w-8 text-indigo-400 opacity-60" />
                  </div>
                  <h3 className="text-white font-medium mb-1">No messages yet</h3>
                  <p className="text-gray-400 text-sm">
                    Be the first to start the conversation!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {comments
                    .filter(comment => !comment.parent_id)
                    .map((comment) => (
                      <div key={comment.id} className="group">
                        <div className="flex gap-3 items-start">
                          <div className="flex-shrink-0 mt-1">
                            <Avatar className="h-10 w-10 border-2 border-[#3b3d4d] group-hover:border-indigo-500 transition-all">
                              <AvatarImage 
                                src={comment.profiles?.avatar_url || ''} 
                                alt={comment.profiles?.username} 
                              />
                              <AvatarFallback className="bg-[#2d2e3d] text-white">
                                {comment.profiles?.username?.[0]?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-end mb-1">
                              <span className="font-semibold text-white mr-2">
                                {comment.profiles?.username}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(comment.created_at)}
                              </span>
                            </div>
                            
                            {editingComment?.id === comment.id ? (
                              <div className="mt-2">
                                <Textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="min-h-[80px] bg-[#2d2e3d] border-[#3b3d4d] focus:border-indigo-500 rounded-lg text-white resize-none"
                                  autoFocus
                                />
                                <div className="flex gap-2 mt-2 justify-end">
                                  <Button 
                                    variant="ghost" 
                                    onClick={handleCancelEdit}
                                    className="h-9 px-4 text-gray-300 hover:text-white hover:bg-[#3d3e4d]"
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={handleSaveEdit}
                                    disabled={!editContent.trim() || editContent.trim() === comment.content}
                                    className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white"
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-[#2d2e3d] text-white rounded-lg p-3 break-words">
                                {comment.content}
                              </div>
                            )}
                            
                            <div className="flex gap-4 mt-2 text-sm group">
                              <button 
                                onClick={() => handleReplyClick(comment)}
                                className="text-gray-400 hover:text-indigo-400 flex items-center gap-1"
                              >
                                <span>Reply</span>
                              </button>
                              <button 
                                onClick={() => handleLikeComment(comment.id)}
                                className={`flex items-center gap-1 ${comment.liked_by_me ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                              >
                                <Heart className={`h-4 w-4 ${comment.liked_by_me ? 'fill-current' : ''}`} />
                                <span>{comment.likes_count || 0}</span>
                              </button>
                              
                              {user && user.id === comment.user_id && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="text-gray-400 hover:text-white invisible group-hover:visible focus:visible">
                                      <MoreVertical className="h-4 w-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="bg-[#2d2e3d] border border-[#3b3d4d]">
                                    <DropdownMenuItem 
                                      className="text-white cursor-pointer hover:bg-[#3d3e4d]"
                                      onClick={() => handleEditClick(comment)}
                                    >
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="text-red-400 cursor-pointer hover:bg-[#3d3e4d]"
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

                        {/* Replies */}
                        {comment.children && comment.children.length > 0 && (
                          <div className="mt-3 ml-14">
                            <button
                              onClick={() => toggleReplies(comment.id)}
                              className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 mb-3"
                            >
                              {showRepliesFor[comment.id] ? (
                                <>
                                  <ChevronUp className="h-4 w-4" />
                                  <span>Hide {comment.children.length} {comment.children.length === 1 ? 'reply' : 'replies'}</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4" />
                                  <span>View {comment.children.length} {comment.children.length === 1 ? 'reply' : 'replies'}</span>
                                </>
                              )}
                            </button>
                            
                            {showRepliesFor[comment.id] && (
                              <div className="space-y-4">
                                {comment.children.map((reply) => (
                                  <div key={reply.id} className="group">
                                    <div className="flex gap-3 items-start">
                                      <div className="flex-shrink-0 mt-1">
                                        <Avatar className="h-8 w-8 border-2 border-[#3b3d4d] group-hover:border-indigo-500 transition-all">
                                          <AvatarImage 
                                            src={reply.profiles?.avatar_url || ''} 
                                            alt={reply.profiles?.username} 
                                          />
                                          <AvatarFallback className="bg-[#2d2e3d] text-white text-xs">
                                            {reply.profiles?.username?.[0]?.toUpperCase() || 'U'}
                                          </AvatarFallback>
                                        </Avatar>
                                      </div>
                                      
                                      <div className="flex-1">
                                        <div className="flex items-end mb-1">
                                          <span className="font-semibold text-white mr-2">
                                            {reply.profiles?.username}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            {formatDate(reply.created_at)}
                                          </span>
                                        </div>
                                        
                                        {editingComment?.id === reply.id ? (
                                          <div className="mt-1">
                                            <Textarea
                                              value={editContent}
                                              onChange={(e) => setEditContent(e.target.value)}
                                              className="min-h-[60px] flex-1 bg-[#232433] border-[#3b3d4d] focus:border-indigo-500 rounded-lg text-white resize-none text-sm"
                                              autoFocus
                                            />
                                            <div className="flex gap-2 mt-2 justify-end">
                                              <Button 
                                                variant="ghost" 
                                                onClick={handleCancelEdit}
                                                className="h-8 text-sm text-gray-300 hover:text-white hover:bg-[#3d3e4d]"
                                              >
                                                Cancel
                                              </Button>
                                              <Button 
                                                onClick={handleSaveEdit}
                                                disabled={!editContent.trim() || editContent.trim() === reply.content}
                                                className="h-8 text-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                                              >
                                                Save
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="bg-[#2d2e3d] text-white rounded-lg p-2.5 break-words text-sm">
                                            {reply.content}
                                          </div>
                                        )}
                                        
                                        <div className="flex gap-3 mt-1.5 text-xs group">
                                          <button 
                                            onClick={() => handleLikeComment(reply.id)}
                                            className={`flex items-center gap-1 ${reply.liked_by_me ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                                          >
                                            <Heart className={`h-3 w-3 ${reply.liked_by_me ? 'fill-current' : ''}`} />
                                            <span>{reply.likes_count || 0}</span>
                                          </button>
                                          
                                          {user && user.id === reply.user_id && (
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <button className="text-gray-400 hover:text-white invisible group-hover:visible focus:visible">
                                                  <MoreVertical className="h-3 w-3" />
                                                </button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent className="bg-[#2d2e3d] border border-[#3b3d4d]">
                                                <DropdownMenuItem 
                                                  className="text-white cursor-pointer hover:bg-[#3d3e4d]"
                                                  onClick={() => handleEditClick(reply)}
                                                >
                                                  Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                  className="text-red-400 cursor-pointer hover:bg-[#3d3e4d]"
                                                  onClick={() => handleDeleteComment(reply.id)}
                                                >
                                                  Delete
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Reply input area */}
                        {replyingTo?.id === comment.id && (
                          <div className="ml-14 mt-3">
                            <div className="bg-[#2d2e3d] rounded-lg p-3 border border-[#3b3d4d]">
                              <div className="flex items-center gap-2 mb-2 text-xs text-indigo-400">
                                <span>Replying to {replyingTo.profiles?.username}</span>
                              </div>
                              <div className="flex gap-2">
                                <Textarea
                                  id="comment-textarea"
                                  value={comment}
                                  onChange={(e) => setComment(e.target.value)}
                                  placeholder="Type your reply..."
                                  className="min-h-[60px] flex-1 bg-[#232433] border-[#3b3d4d] focus:border-indigo-500 rounded text-white text-sm resize-none"
                                  autoFocus
                                />
                              </div>
                              <div className="flex justify-end gap-2 mt-2">
                                <Button
                                  variant="ghost"
                                  onClick={() => setReplyingTo(null)}
                                  className="h-8 text-sm text-gray-300 hover:text-white hover:bg-[#3d3e4d]"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleSubmitComment}
                                  disabled={!comment.trim()}
                                  className="h-8 text-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                  Send
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
            
            {/* Message input */}
            {!replyingTo && (
              <div className="p-4 bg-[#1e1f2e] border-t border-[#3b3d4d]">
                <form onSubmit={handleSubmitComment} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Type a message..."
                      className="min-h-[60px] bg-[#2d2e3d] border-[#3b3d4d] focus:border-indigo-500 rounded-lg text-white resize-none"
                      rows={2}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={!comment.trim()}
                    className={`rounded-full h-10 w-10 flex items-center justify-center ${comment.trim() ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-[#3d3e4d] cursor-not-allowed'}`}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentModal;
