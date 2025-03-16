import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getComments, createComment, editComment, deleteComment } from '@/services/commentService';
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Layout from '@/components/layout';
import { 
  Heart, 
  MoreVertical, 
  ChevronDown, 
  ChevronUp,
  Send,
  X,
  ChevronLeft,
  Menu,
  MessageSquare
} from 'lucide-react';

interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    avatar_url: string;
  };
  parent_id?: string | null;
  children?: Comment[];
  likes_count?: number;
  liked_by_me?: boolean;
}

interface Post {
  id: string;
  content?: string;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    avatar_url: string;
  };
  title?: string; 
}

const CommentsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const postId = queryParams.get('postId');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [showRepliesFor, setShowRepliesFor] = useState<Record<string, boolean>>({});
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editContent, setEditContent] = useState('');

  // Fetch post data
  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id(id, username, avatar_url)
        `)
        .eq('id', postId)
        .single();
        
      if (error) throw error;
      return data as Post;
    },
    enabled: !!postId,
  });

  // Fetch comments
  const { data: comments = [], isLoading, error, refetch } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      if (!postId) return [];
      const result = await getComments(postId as string);
      return result.data || [];
    },
    enabled: !!postId,
  });

  // Organize comments into parent and children
  const organizedComments = comments.filter(comment => !comment.parent_id);
  organizedComments.forEach(parent => {
    parent.children = comments.filter(comment => comment.parent_id === parent.id);
  });

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
    
    if (!comment.trim() || !user || !postId) return;

    try {
      const commentData = {
        post_id: postId as string,
        content: comment.trim(),
        parent_id: replyingTo ? replyingTo.id : null,
      };

      await createComment(commentData);
      
      setComment('');
      setReplyingTo(null);
      refetch();
      
      toast.success("Comment added successfully");
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error("Failed to add comment. Please try again.");
    }
  };

  const handleReplyClick = (comment: Comment) => {
    setReplyingTo(comment);
    
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
      toast.error("Failed to like comment. Please try again.");
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
    if (!editingComment || !editContent.trim() || !user) return;

    try {
      await editComment(editingComment.id, user.id, editContent.trim());
      
      setEditingComment(null);
      setEditContent('');
      refetch();
      
      toast.success("Comment updated successfully");
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error("Failed to update comment. Please try again.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    
    try {
      await deleteComment(commentId);
      refetch();
      toast.success("Comment deleted successfully");
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error("Failed to delete comment. Please try again.");
    }
  };

  return (
    <Layout>
      <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col z-50 pt-safe-top">
        {/* Top header with console-style UI */}
        <div className="bg-[#1c1d2b] border-b border-[#3b3d4d]">
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(-1)}
                className="mr-2 text-gray-300 hover:text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-white font-bold text-lg">Comments</h2>
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
              {isLoading || postLoading ? (
                <div className="flex items-center justify-center h-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : error ? (
                <div className="text-red-400 text-center p-4 bg-[#2d2e3d] rounded-lg">
                  Error loading messages
                </div>
              ) : !post ? (
                <div className="text-center p-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#2d2e3d] flex items-center justify-center">
                    <X className="h-8 w-8 text-red-400 opacity-60" />
                  </div>
                  <h3 className="text-white font-medium mb-1">Post not found</h3>
                  <p className="text-gray-400 text-sm">
                    The post you're looking for doesn't exist or has been removed.
                  </p>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center p-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#2d2e3d] flex items-center justify-center">
                    <MessageSquare className="h-8 w-8 text-indigo-400 opacity-60" />
                  </div>
                  <h3 className="text-white font-medium mb-1">No comments yet</h3>
                  <p className="text-gray-400 text-sm">
                    Be the first to start the conversation!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Post information header */}
                  {post && (
                    <div className="bg-[#2d2e3d] rounded-lg p-4 mb-6 border-l-4 border-indigo-500">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.profiles?.avatar_url || ''} />
                          <AvatarFallback className="bg-[#3d3e4d]">
                            {post.profiles?.username?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-white font-medium">{post.profiles?.username}</h3>
                          <div className="text-xs text-gray-400">
                            {formatDate(post.created_at)}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-200 text-sm mt-2">{post.content}</p>
                    </div>
                  )}
                  
                  {/* Comments list */}
                  {organizedComments.map((comment) => (
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
                            
                            {isCommentAuthor(comment) && (
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
                                        <AvatarFallback className="bg-[#2d2e3d] text-white">
                                          {reply.profiles?.username?.[0]?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                      </Avatar>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-end mb-1">
                                        <span className="font-semibold text-white mr-2">
                                          {reply.profiles?.username}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {formatDate(reply.created_at)}
                                        </span>
                                      </div>
                                      
                                      {editingComment?.id === reply.id ? (
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
                                              className="h-8 px-3 text-xs text-gray-300 hover:text-white hover:bg-[#3d3e4d]"
                                            >
                                              Cancel
                                            </Button>
                                            <Button 
                                              onClick={handleSaveEdit}
                                              disabled={!editContent.trim() || editContent.trim() === reply.content}
                                              className="h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                                            >
                                              Save
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="bg-[#2d2e3d] text-white rounded-lg p-3 break-words">
                                          {reply.content}
                                        </div>
                                      )}
                                      
                                      <div className="flex gap-4 mt-2 text-sm group">
                                        <button 
                                          onClick={() => handleLikeComment(reply.id)}
                                          className={`flex items-center gap-1 ${reply.liked_by_me ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                                        >
                                          <Heart className={`h-4 w-4 ${reply.liked_by_me ? 'fill-current' : ''}`} />
                                          <span>{reply.likes_count || 0}</span>
                                        </button>
                                        
                                        {isCommentAuthor(reply) && (
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <button className="text-gray-400 hover:text-white invisible group-hover:visible focus:visible">
                                                <MoreVertical className="h-4 w-4" />
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
                      
                      {/* Reply area for this comment */}
                      {replyingTo?.id === comment.id && (
                        <div className="mt-3 ml-14">
                          <div className="flex gap-2 items-start">
                            {user && (
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={user.user_metadata?.avatar_url || ''} />
                                <AvatarFallback className="bg-[#2d2e3d] text-white">
                                  {user.user_metadata?.username?.[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="flex-1 min-w-0">
                              <form onSubmit={handleSubmitComment} className="relative">
                                <Textarea
                                  id="comment-textarea"
                                  value={comment}
                                  onChange={(e) => setComment(e.target.value)}
                                  placeholder={`Reply to ${replyingTo.profiles?.username}...`}
                                  className="pr-12 min-h-[80px] bg-[#2d2e3d] border-[#3b3d4d] focus:border-indigo-500 rounded-lg text-white resize-none"
                                />
                                <Button
                                  type="submit"
                                  disabled={!comment.trim()}
                                  className="absolute right-2 bottom-2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full h-8 w-8 flex items-center justify-center"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              </form>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setReplyingTo(null)}
                                className="mt-2 text-xs text-gray-400 hover:text-gray-300"
                              >
                                Cancel
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
            
            {/* Comment input */}
            {user && !replyingTo && (
              <div className="p-4 border-t border-[#3b3d4d] bg-[#1c1d2b]">
                <form onSubmit={handleSubmitComment} className="flex gap-3 items-start">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={user.user_metadata?.avatar_url || ''} />
                    <AvatarFallback className="bg-[#2d2e3d] text-white">
                      {user.user_metadata?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 relative">
                    <Textarea
                      id="main-comment-textarea"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="pr-12 min-h-[80px] bg-[#2d2e3d] border-[#3b3d4d] focus:border-indigo-500 rounded-lg text-white resize-none"
                    />
                    <Button
                      type="submit"
                      disabled={!comment.trim()}
                      className="absolute right-2 bottom-2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full h-8 w-8 flex items-center justify-center"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CommentsPage;
