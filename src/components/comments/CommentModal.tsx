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
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { 
  Dialog,
  DialogContent,
  DialogTitle
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
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
  username: string;
  avatar_url: string;
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

const CommentModal: React.FC<CommentModalProps> = ({
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
        user_id: user.id,
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
    setEditingComment(null);
    
    // Ensure replies are shown for this comment
    if (comment.children && comment.children.length > 0) {
      setShowRepliesFor(prev => ({
        ...prev,
        [comment.id]: true
      }));
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to sign in to like comments.",
        duration: 3000,
      });
      return;
    }

    try {
      const comment = comments.find(c => c.id === commentId);
      const isLiked = comment?.liked_by_me;

      // Optimistic update
      queryClient.setQueryData(['comments', postId], (oldData: any) => {
        return oldData.map((c: Comment) => {
          if (c.id === commentId) {
            return {
              ...c,
              liked_by_me: !isLiked,
              likes_count: isLiked ? (c.likes_count || 1) - 1 : (c.likes_count || 0) + 1
            };
          }
          return c;
        });
      });

      const { error } = await supabase
        .from('comment_likes')
        .upsert(
          { comment_id: commentId, user_id: user.id, liked: !isLiked },
          { onConflict: 'comment_id,user_id' }
        );

      if (error) throw error;
      
      // Refetch to ensure data consistency
      refetch();
    } catch (error) {
      console.error('Error liking comment:', error);
      toast({
        title: "Error",
        description: "Failed to update like status. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
      refetch();
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
    if (!editingComment || !editContent.trim() || editContent.trim() === editingComment.content) {
      return;
    }

    try {
      await editComment({
        id: editingComment.id,
        content: editContent.trim()
      });
      
      // Update local state
      queryClient.setQueryData(['comments', postId], (oldData: any) => {
        return oldData.map((c: Comment) => {
          if (c.id === editingComment.id) {
            return { ...c, content: editContent.trim() };
          }
          return c;
        });
      });
      
      setEditingComment(null);
      setEditContent('');
      
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
    if (!user) return;
    
    try {
      await deleteComment(commentId);
      
      // Update local state
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 bg-gradient-to-b from-[#1f1f32] to-[#1a1a28] border-indigo-500/30 text-white h-[600px] max-h-[90vh] flex flex-col overflow-hidden rounded-xl shadow-2xl shadow-purple-900/20">
        <div className="flex flex-col h-full relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-indigo-600/20 to-transparent"></div>
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-purple-600/20 blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-indigo-600/20 blur-3xl"></div>
          </div>
          
          {/* Header */}
          <div className="p-4 border-b border-indigo-500/30 backdrop-blur-md bg-[#1d1d30]/70 flex items-center sticky top-0 z-10">
            <Button variant="ghost" size="icon" onClick={onClose} className="mr-2 rounded-full hover:bg-indigo-500/20">
              <X className="h-5 w-5 text-indigo-200" />
            </Button>
            <DialogTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">Comments</DialogTitle>
          </div>
          
          {/* Comments content area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-[#1e1f2e]" style={{ overscrollBehavior: 'contain' }}>
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-indigo-700 opacity-70 mb-2"></div>
                  <div className="h-2 w-24 bg-indigo-600 opacity-50 rounded mb-1"></div>
                  <div className="h-2 w-16 bg-indigo-600 opacity-30 rounded"></div>
                </div>
              </div>
            ) : organizedComments.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-full p-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-900/20">
                  <Send className="h-8 w-8 text-white opacity-80" />
                </div>
                <p className="text-white font-medium mb-2 text-lg">Start the conversation</p>
                <p className="text-indigo-300 text-center max-w-xs">Be the first to comment and share your thoughts on this clip!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {organizedComments.map(comment => (
                  <div key={comment.id} className="group relative bg-[#2a2b3b] bg-opacity-60 rounded-xl p-4 backdrop-blur-sm border border-indigo-500/20 shadow-lg shadow-indigo-900/10 transition-all duration-200 hover:border-indigo-500/40 hover:bg-[#2d2e3e]">
                    <div className="flex gap-4">
                      {/* User avatar with glow effect */}
                      <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-indigo-600 rounded-full opacity-70 blur-sm"></div>
                        <Avatar className="relative h-12 w-12 border-2 border-[#3b3d4d]">
                          <AvatarImage src={comment.profiles?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white font-bold text-lg">
                            {comment.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      {/* Comment content */}
                      <div className="flex-1">
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
                              className="min-h-[60px] flex-1 bg-[#232433] border-[#3b3d4d] focus:border-indigo-500 rounded text-white text-sm resize-none"
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
                                disabled={!editContent.trim() || editContent.trim() === comment.content}
                                className="h-8 text-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-[#2d2e3d] text-white rounded-lg p-2.5 break-words text-sm">
                            {comment.content}
                          </div>
                        )}
                        
                        <div className="flex gap-3 mt-1.5 text-xs group">
                          <button 
                            onClick={() => handleLikeComment(comment.id)}
                            className={`flex items-center gap-1 ${comment.liked_by_me ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                          >
                            <Heart className={`h-4 w-4 ${comment.liked_by_me ? 'fill-current' : ''}`} />
                            <span>{comment.likes_count || 0}</span>
                          </button>

                          <button 
                            onClick={() => handleReplyClick(comment)}
                            className="text-gray-400 hover:text-indigo-400 flex items-center gap-1"
                          >
                            <span>Reply</span>
                          </button>

                          {isCommentAuthor(comment) && (
                            <div className="ml-auto">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-6 w-6 p-0 rounded-full hover:bg-indigo-500/20">
                                    <MoreVertical className="h-3 w-3 text-gray-400" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="min-w-[160px] bg-[#1f2033] text-white border border-indigo-500/40">
                                  <DropdownMenuItem className="cursor-pointer hover:bg-indigo-600/30" onClick={() => handleEditClick(comment)}>
                                    <span className="text-indigo-200">Edit Comment</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer hover:bg-red-900/30" onClick={() => handleDeleteComment(comment.id)}>
                                    <span className="text-red-400">Delete Comment</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
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
                                              className="min-h-[60px] flex-1 bg-[#232433] border-[#3b3d4d] focus:border-indigo-500 rounded text-white text-sm resize-none"
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
                                                  className="text-red-400 cursor-pointer hover:bg-red-900/30"
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Enhanced Message input */}
          {!replyingTo && (
            <div className="p-5 bg-gradient-to-b from-[#1e1f2e]/70 to-[#1e1f2e] backdrop-blur-lg border-t border-indigo-500/20 sticky bottom-0">
              <form onSubmit={handleSubmitComment} className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-50 blur-sm pointer-events-none"></div>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="min-h-[60px] relative bg-[#2a2b3b] border-none focus:ring-1 focus:ring-indigo-500/50 rounded-xl text-white resize-none shadow-lg placeholder:text-indigo-300/50"
                    rows={2}
                  />
                </div>
                <div className="relative">
                  <div className={`absolute -inset-0.5 rounded-full ${comment.trim() ? 'bg-gradient-to-r from-pink-500 to-indigo-500 opacity-70 blur-sm' : 'bg-transparent'} transition-all duration-300`}></div>
                  <Button
                    type="submit"
                    disabled={!comment.trim()}
                    className={`relative rounded-full h-12 w-12 flex items-center justify-center shadow-lg shadow-indigo-900/30 transition-all duration-300 ${comment.trim() ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500' : 'bg-[#3d3e4d] cursor-not-allowed'}`}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentModal;
