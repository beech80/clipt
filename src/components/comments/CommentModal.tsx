import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ArrowLeft, Heart, ChevronDown, ChevronUp, MoreVertical, Check, X as XIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getComments, getCommentCount, likeComment, deleteComment, editComment } from "@/services/commentService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNowStrict } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  user_id: string;
  post_id: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
  likes_count: number;
  liked_by_me?: boolean;
  children?: Comment[];
}

const CommentModal: React.FC<CommentModalProps> = ({ isOpen, onClose, postId }) => {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [showRepliesFor, setShowRepliesFor] = useState<{[key: string]: boolean}>({});
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editContent, setEditContent] = useState('');
  const queryClient = useQueryClient();
  const [post, setPost] = useState<any>(null);
  
  // Get the post content to display in the modal header
  useEffect(() => {
    if (isOpen && postId) {
      const fetchPost = async () => {
        try {
          const { data, error } = await supabase
            .from("posts")
            .select(`
              id,
              content,
              image_url,
              profiles:user_id (
                username,
                avatar_url
              )
            `)
            .eq("id", postId)
            .single();
          
          if (error) throw error;
          setPost(data);
        } catch (error) {
          console.error("Error fetching post:", error);
        }
      };
      
      fetchPost();
    }
  }, [isOpen, postId]);
  
  // Query comments for the post
  const { data: comments = [], isLoading, error, refetch } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      try {
        console.log(`Fetching comments for post ${postId}`);
        const result = await getComments(postId);
        if (result.error) {
          console.error("Error fetching comments:", result.error);
          throw result.error;
        }
        console.log(`Retrieved ${result.data?.length || 0} comments`, result.data);
        return result.data || [];
      } catch (error) {
        console.error("Exception in comments query:", error);
        throw error;
      }
    },
    enabled: isOpen && !!postId,
    staleTime: 5000, // 5 seconds
    refetchOnWindowFocus: false,
  });

  // Add comment mutation
  const addComment = useMutation({
    mutationFn: async ({ content, parentId }: { content: string, parentId?: string }) => {
      if (!user) throw new Error("You must be logged in to comment");
      
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            content,
            user_id: user.id,
            post_id: postId,
            parent_id: parentId || null
          }
        ])
        .select(`
          id,
          content,
          created_at,
          parent_id,
          user_id,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setComment('');
      setReplyingTo(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['comments-count', postId] });
      toast.success("Comment added successfully!");
    },
    onError: (error) => {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  });

  // Like comment mutation
  const likeMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user) throw new Error("You must be logged in to like a comment");
      return await likeComment(commentId);
    },
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error("Error liking comment:", error);
      toast.error("Failed to like comment");
    }
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user) throw new Error("You must be logged in to delete a comment");
      return await deleteComment(commentId, user.id);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['comments-count', postId] });
      toast.success("Comment deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  });

  // Edit comment mutation
  const editCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string, content: string }) => {
      if (!user) throw new Error("You must be logged in to edit a comment");
      return await editComment(commentId, user.id, content);
    },
    onSuccess: () => {
      setEditingComment(null);
      setEditContent('');
      refetch();
      toast.success("Comment updated successfully");
    },
    onError: (error) => {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
    }
  });

  // Handle comment submission
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    console.log(`Submitting comment for post ${postId}`, {
      content: comment.trim(),
      parentId: replyingTo?.id || null
    });
    
    if (!user) {
      toast.error("You must be logged in to comment");
      return;
    }
    
    addComment.mutate({
      content: comment.trim(),
      parentId: replyingTo?.id
    });
  };

  // Handle reply to comment
  const handleReplyClick = (comment: Comment) => {
    setReplyingTo(comment);
    
    // Focus the textarea after a short delay
    setTimeout(() => {
      const textareaElement = document.getElementById('comment-textarea');
      if (textareaElement) {
        textareaElement.focus();
      }
    }, 100);
  };

  // Handle like comment
  const handleLikeComment = (commentId: string) => {
    likeMutation.mutate(commentId);
  };

  // Handle delete comment
  const handleDeleteComment = (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  // Handle edit comment
  const handleEditClick = (comment: Comment) => {
    setEditingComment(comment);
    setEditContent(comment.content);
  };

  // Handle save edit
  const handleSaveEdit = () => {
    if (!editingComment) return;
    if (!editContent.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    
    editCommentMutation.mutate({
      commentId: editingComment.id,
      content: editContent.trim()
    });
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  // Toggle showing replies for a comment
  const toggleReplies = (commentId: string) => {
    setShowRepliesFor(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // Format date to Instagram style (e.g., "2d")
  const formatDate = (dateString: string) => {
    try {
      const result = formatDistanceToNowStrict(new Date(dateString), { 
        addSuffix: false,
        roundingMethod: 'floor'
      });
      
      // Convert "2 days" to "2d", "5 minutes" to "5m", etc.
      return result
        .replace(' days', 'd')
        .replace(' day', 'd')
        .replace(' hours', 'h')
        .replace(' hour', 'h')
        .replace(' minutes', 'm')
        .replace(' minute', 'm')
        .replace(' seconds', 's')
        .replace(' second', 's')
        .replace(' months', 'mo')
        .replace(' month', 'mo')
        .replace(' years', 'y')
        .replace(' year', 'y');
    } catch (e) {
      console.error("Date formatting error:", e);
      return "?";
    }
  };

  // Organize comments into threaded view
  const organizedComments = React.useMemo(() => {
    if (!comments || !Array.isArray(comments)) {
      console.log("No comments to organize or comments is not an array", comments);
      return [];
    }
    
    console.log(`Organizing ${comments.length} comments`);
    
    // Create a map of comments by ID for quick lookup
    const commentMap = new Map<string, Comment>();
    const topLevelComments: Comment[] = [];
    
    // First pass - add all comments to the map
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, children: [] });
    });
    
    // Second pass - organize into parent-child relationships
    comments.forEach(comment => {
      const currentComment = commentMap.get(comment.id);
      if (!currentComment) return;
      
      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        // This is a reply - add to parent's children
        const parentComment = commentMap.get(comment.parent_id);
        if (parentComment && parentComment.children) {
          parentComment.children.push(currentComment);
        }
      } else {
        // This is a top-level comment
        topLevelComments.push(currentComment);
      }
    });
    
    // Sort all comments by created_at (newest first)
    return topLevelComments.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [comments]);

  // Check if current user is the author of a comment
  const isCommentAuthor = (comment: Comment) => {
    return user?.id === comment.user_id;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-gaming-900 border-gaming-700 text-white p-0 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Instagram-style header */}
        <DialogTitle className="flex justify-between items-center p-3 border-b border-gaming-700 sticky top-0 bg-gaming-900 z-10">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 mr-2" 
              onClick={onClose}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h3 className="text-lg font-semibold">Comments</h3>
          </div>
        </DialogTitle>
        
        {/* Original post creator section - Instagram style */}
        {post && (
          <div className="p-4 border-b border-gaming-700 flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.profiles?.avatar_url || ''} />
              <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500 text-white">
                {post.profiles?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div>
                <span className="font-semibold text-gaming-100 mr-1">
                  {post.profiles?.username || 'Anonymous'}
                </span>
                <span className="text-gaming-200">{post.content || ''}</span>
              </div>
              <span className="text-xs text-gray-400 mt-1 block">
                {post.created_at && formatDate(post.created_at)}
              </span>
            </div>
          </div>
        )}
        
        {/* Comments section - scrollable */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-500">Failed to load comments</div>
          ) : organizedComments.length === 0 ? (
            <div className="p-12 text-center text-gaming-300">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div>
              {organizedComments.map(comment => (
                <div key={comment.id} className="px-4 py-3 border-b border-gray-800/40">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={comment.profiles?.avatar_url || ''} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500 text-white">
                        {comment.profiles?.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between group">
                        <div>
                          <span className="font-semibold text-gaming-100 mr-1">
                            {comment.profiles?.username || 'Anonymous'}
                          </span>
                          
                          {editingComment?.id === comment.id ? (
                            <div className="mt-1">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="min-h-9 py-2 px-3 bg-gaming-800 border-gaming-700 resize-none text-sm"
                                rows={2}
                                autoFocus
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  className="h-7 text-xs"
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={handleSaveEdit}
                                  className="h-7 text-xs bg-gradient-to-r from-blue-500 to-purple-600"
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gaming-200 inline-block">{comment.content}</span>
                          )}
                        </div>
                        
                        {isCommentAuthor(comment) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-gaming-800 border-gaming-700">
                              <DropdownMenuItem 
                                className="cursor-pointer hover:bg-gaming-700"
                                onClick={() => handleEditClick(comment)}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="cursor-pointer text-red-500 hover:bg-gaming-700"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      
                      <div className="flex items-center mt-1 text-xs text-gray-400 space-x-4">
                        <span>{formatDate(comment.created_at)}</span>
                        
                        <button 
                          className={`flex items-center space-x-1 ${comment.liked_by_me ? 'text-red-500' : 'hover:text-gray-300'}`}
                          onClick={() => handleLikeComment(comment.id)}
                        >
                          <span>{comment.likes_count || 0} like{comment.likes_count !== 1 ? 's' : ''}</span>
                        </button>
                        
                        <button 
                          className="hover:text-gray-300"
                          onClick={() => handleReplyClick(comment)}
                        >
                          Reply
                        </button>
                      </div>
                      
                      {/* Show replies if any */}
                      {comment.children && comment.children.length > 0 && (
                        <div className="mt-2">
                          <button
                            className="flex items-center text-xs text-gray-400 mt-1"
                            onClick={() => toggleReplies(comment.id)}
                          >
                            <div className="h-px bg-gray-700 w-8 mr-2"></div>
                            {showRepliesFor[comment.id] ? (
                              <span>Hide replies</span>
                            ) : (
                              <span>View {comment.children.length} {comment.children.length === 1 ? 'reply' : 'replies'}</span>
                            )}
                          </button>
                          
                          {showRepliesFor[comment.id] && (
                            <div className="mt-3 space-y-3 ml-4 pl-4 border-l border-gray-800/30">
                              {comment.children.map(reply => (
                                <div key={reply.id} className="flex gap-2">
                                  <Avatar className="h-6 w-6 flex-shrink-0">
                                    <AvatarImage src={reply.profiles?.avatar_url || ''} />
                                    <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500 text-white">
                                      {reply.profiles?.username?.[0]?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between group">
                                      <div>
                                        <span className="font-semibold text-gaming-100 mr-1 text-sm">
                                          {reply.profiles?.username || 'Anonymous'}
                                        </span>
                                        
                                        {editingComment?.id === reply.id ? (
                                          <div className="mt-1">
                                            <Textarea
                                              value={editContent}
                                              onChange={(e) => setEditContent(e.target.value)}
                                              className="min-h-9 py-2 px-3 bg-gaming-800 border-gaming-700 resize-none text-sm"
                                              rows={2}
                                              autoFocus
                                            />
                                            <div className="flex justify-end gap-2 mt-2">
                                              <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={handleCancelEdit}
                                                className="h-6 text-xs"
                                              >
                                                Cancel
                                              </Button>
                                              <Button 
                                                variant="default" 
                                                size="sm"
                                                onClick={handleSaveEdit}
                                                className="h-6 text-xs bg-gradient-to-r from-blue-500 to-purple-600"
                                              >
                                                Save
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="text-gaming-200 text-sm inline-block">{reply.content}</span>
                                        )}
                                      </div>
                                      
                                      {isCommentAuthor(reply) && (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <MoreVertical className="h-3 w-3" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="bg-gaming-800 border-gaming-700 p-1">
                                            <DropdownMenuItem 
                                              className="cursor-pointer hover:bg-gaming-700 text-xs p-1"
                                              onClick={() => handleEditClick(reply)}
                                            >
                                              Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                              className="cursor-pointer text-red-500 hover:bg-gaming-700 text-xs p-1"
                                              onClick={() => handleDeleteComment(reply.id)}
                                            >
                                              Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center mt-0.5 text-xs text-gray-400 space-x-3">
                                      <span>{formatDate(reply.created_at)}</span>
                                      
                                      <button 
                                        className={`${reply.liked_by_me ? 'text-red-500' : 'hover:text-gray-300'}`}
                                        onClick={() => handleLikeComment(reply.id)}
                                      >
                                        {reply.likes_count || 0} like{reply.likes_count !== 1 ? 's' : ''}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Reply form */}
                      {replyingTo?.id === comment.id && (
                        <div className="mt-2 ml-4 pl-4 border-l border-gray-800/30">
                          <div className="flex gap-2 mt-1">
                            {user && (
                              <Avatar className="h-6 w-6 flex-shrink-0">
                                <AvatarImage 
                                  src={user.user_metadata?.avatar_url || ''} 
                                  alt={user.user_metadata?.username || 'User'} 
                                />
                                <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500 text-white">
                                  {user.user_metadata?.username?.[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="flex-1">
                              <div className="flex gap-2 items-center">
                                <Textarea
                                  value={comment}
                                  onChange={(e) => setComment(e.target.value)}
                                  placeholder={`Reply to ${replyingTo.profiles?.username}...`}
                                  className="min-h-8 py-1.5 px-3 bg-gaming-800 border-gaming-700 resize-none text-sm flex-1"
                                  rows={1}
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setReplyingTo(null)}
                                  className="h-7 text-xs"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleSubmitComment}
                                  disabled={!comment.trim()}
                                  className="h-7 text-xs bg-gradient-to-r from-blue-500 to-purple-600"
                                >
                                  Post
                                </Button>
                              </div>
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
        
        {/* Comment input at bottom - Instagram style */}
        {!replyingTo && (
          <div className="border-t border-gaming-700 sticky bottom-0 bg-gaming-900">
            {/* Emoji reaction row */}
            <div className="flex justify-between px-4 py-2 border-b border-gaming-700/50">
              <div className="flex space-x-6">
                <button className="text-red-500 hover:text-red-400 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </button>
                <button className="text-yellow-500 hover:text-yellow-400 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 11h-3.17l2.54-2.54c.39-.39.39-1.02 0-1.41-.39-.39-1.03-.39-1.42 0L15 11h-2V9l3.95-3.95c.39-.39.39-1.03 0-1.42-.39-.39-1.02-.39-1.41 0L12 7.17 8.46 3.63c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.03 0 1.42L11 9v2H9L5.05 7.05c-.39-.39-1.03-.39-1.42 0-.39.39-.39 1.02 0 1.41L6.17 11H3c-.55 0-1 .45-1 1s.45 1 1 1h3.17l-2.54 2.54c-.39.39-.39 1.02 0 1.41.39.39 1.03.39 1.42 0L9 13h2v2l-3.95 3.95c-.39.39-.39 1.03 0 1.42.39.39 1.02.39 1.41 0L12 16.83l3.55 3.54c.39.39 1.02.39 1.41 0 .39-.39.39-1.03 0-1.42L13 15v-2h2l3.95 3.95c.39.39 1.03.39 1.42 0 .39-.39.39-1.02 0-1.41L17.83 13H21c.55 0 1-.45 1-1s-.45-1-1-1z"/>
                  </svg>
                </button>
                <button className="text-orange-500 hover:text-orange-400 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zM8 17c-.83 0-1.5-.67-1.5-1.5S7.17 14 8 14s1.5.67 1.5 1.5S8.83 17 8 17zm8 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                  </svg>
                </button>
                <button className="text-yellow-400 hover:text-yellow-300 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 11h-3.17l2.54-2.54c.39-.39.39-1.02 0-1.41-.39-.39-1.03-.39-1.42 0L15 11h-2V9l3.95-3.95c.39-.39.39-1.03 0-1.42-.39-.39-1.02-.39-1.41 0L12 7.17 8.46 3.63c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.03 0 1.42L11 9v2H9L5.05 7.05c-.39-.39-1.03-.39-1.42 0-.39.39-.39 1.02 0 1.41L6.17 11H3c-.55 0-1 .45-1 1s.45 1 1 1h3.17l-2.54 2.54c-.39.39-.39 1.02 0 1.41.39.39 1.03.39 1.42 0L9 13h2v2l-3.95 3.95c-.39.39-.39 1.03 0 1.42.39.39 1.02.39 1.41 0L12 16.83l3.55 3.54c.39.39 1.02.39 1.41 0 .39-.39.39-1.03 0-1.42L13 15v-2h2l3.95 3.95c.39.39 1.03.39 1.42 0 .39-.39.39-1.02 0-1.41L17.83 13H21c.55 0 1-.45 1-1s-.45-1-1-1z"/>
                  </svg>
                </button>
              </div>
              <div className="flex space-x-6">
                <button className="text-gray-400 hover:text-gray-300 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </button>
                <button className="text-gray-400 hover:text-gray-300 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Instagram-style comment input */}
            <form onSubmit={handleSubmitComment} className="px-3 py-2">
              <div className="flex items-center">
                {user && (
                  <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                    <AvatarImage 
                      src={user.user_metadata?.avatar_url || ''} 
                      alt={user.user_metadata?.username || 'User'} 
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500 text-white">
                      {user.user_metadata?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={`Add a comment as ${user?.user_metadata?.username || 'user'}...`}
                    className="w-full py-2 px-3 bg-transparent border-none rounded-full text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-0"
                  />
                </div>
                
                {comment.trim() && (
                  <button
                    type="submit"
                    className="ml-2 text-blue-400 font-semibold text-sm hover:text-blue-300 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Post
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CommentModal;
