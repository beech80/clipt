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
        <DialogTitle className="flex items-center justify-between">
          <span className="font-medium text-lg text-white">Add Comment</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white focus:outline-none transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogTitle>
        
        <div className="pb-16 flex flex-col h-full">
          {post && (
            <div className="text-sm text-gray-400 mb-2 px-4">
              Commenting on post from {post.profiles?.username}
            </div>
          )}
          
          {/* Chat-style Comments List */}
          <div className="flex-1 overflow-y-auto pb-4 bg-[#191919]">
            {isLoading ? (
              <div className="flex items-center justify-center h-24">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center p-4">
                Error loading comments
              </div>
            ) : comments.length === 0 ? (
              <div className="text-gray-500 text-center p-4">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              <div className="divide-y divide-gray-800/30">
                {/* List of comments in chat style */}
                {comments
                  .filter(comment => !comment.parent_id) // Only show top-level comments first
                  .map((comment) => (
                    <div key={comment.id} className="px-4 py-3 hover:bg-gray-800/20">
                      <div className="flex items-start">
                        {/* User Avatar */}
                        <div className="flex-shrink-0 mr-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={comment.profiles?.avatar_url || ''} 
                              alt={comment.profiles?.username || 'User'} 
                            />
                            <AvatarFallback className="bg-gray-800 text-white">
                              {comment.profiles?.username?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        
                        {/* Comment Content and Username */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col">
                            <div className="flex justify-between">
                              <span className="font-medium text-white">
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
                                  className="min-h-[60px] bg-gray-800 border-gray-700 text-sm resize-none"
                                  autoFocus
                                />
                                <div className="flex gap-2 mt-2 justify-end">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={handleCancelEdit}
                                    className="h-7 text-xs"
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    onClick={handleSaveEdit}
                                    disabled={!editContent.trim() || editContent.trim() === comment.content}
                                    className="h-7 text-xs"
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-gray-300 break-words mt-0.5">
                                {comment.content}
                              </div>
                            )}
                            
                            {/* Comment actions row */}
                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                              <button 
                                onClick={() => handleReplyClick(comment)}
                                className="hover:text-gray-300 transition-colors"
                              >
                                Reply
                              </button>
                              <button 
                                onClick={() => handleLikeComment(comment.id)}
                                className={`flex items-center gap-1 transition-colors ${comment.liked_by_me ? 'text-red-500 hover:text-red-400' : 'hover:text-gray-300'}`}
                              >
                                <Heart className={`h-3 w-3 ${comment.liked_by_me ? 'fill-current' : ''}`} />
                                <span>{comment.likes_count > 0 ? comment.likes_count : ''}</span>
                              </button>
                              {user && user.id === comment.user_id && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="text-gray-500 hover:text-white focus:outline-none">
                                      <MoreVertical className="h-3 w-3" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                                    <DropdownMenuItem 
                                      className="text-white cursor-pointer hover:bg-gray-700"
                                      onClick={() => handleEditClick(comment)}
                                    >
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="text-red-500 cursor-pointer hover:bg-gray-700"
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
                      </div>

                      {/* Replies section */}
                      {comment.children && comment.children.length > 0 && (
                        <div className="mt-2 ml-12">
                          <div className="flex items-center gap-1 mb-2">
                            <button
                              onClick={() => toggleReplies(comment.id)}
                              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                            >
                              {showRepliesFor[comment.id] ? 'Hide replies' : `View ${comment.children.length} ${comment.children.length === 1 ? 'reply' : 'replies'}`}
                              {showRepliesFor[comment.id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                          </div>
                          
                          {showRepliesFor[comment.id] && (
                            <div className="space-y-3">
                              {comment.children.map((reply) => (
                                <div key={reply.id} className="flex items-start pt-2">
                                  <Avatar className="h-8 w-8 flex-shrink-0 mr-3">
                                    <AvatarImage 
                                      src={reply.profiles?.avatar_url || ''} 
                                      alt={reply.profiles?.username || 'User'} 
                                    />
                                    <AvatarFallback className="bg-gray-800 text-white text-xs">
                                      {reply.profiles?.username?.[0]?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  
                                  <div className="flex-1">
                                    <div className="flex flex-col">
                                      <div className="flex justify-between">
                                        <span className="font-medium text-white text-sm">
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
                                            className="min-h-[40px] bg-gray-800 border-gray-700 text-xs resize-none"
                                            autoFocus
                                          />
                                          <div className="flex gap-2 mt-1 justify-end">
                                            <Button 
                                              size="sm" 
                                              variant="outline" 
                                              onClick={handleCancelEdit}
                                              className="h-6 text-xs px-2"
                                            >
                                              Cancel
                                            </Button>
                                            <Button 
                                              size="sm" 
                                              onClick={handleSaveEdit}
                                              disabled={!editContent.trim() || editContent.trim() === reply.content}
                                              className="h-6 text-xs px-2"
                                            >
                                              Save
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-gray-300 text-sm break-words">
                                          {reply.content}
                                        </div>
                                      )}
                                      
                                      <div className="flex gap-4 mt-1 text-xs text-gray-500">
                                        <button 
                                          onClick={() => handleLikeComment(reply.id)}
                                          className={`flex items-center gap-1 transition-colors ${reply.liked_by_me ? 'text-red-500 hover:text-red-400' : 'hover:text-gray-300'}`}
                                        >
                                          <Heart className={`h-3 w-3 ${reply.liked_by_me ? 'fill-current' : ''}`} />
                                          <span>{reply.likes_count > 0 ? reply.likes_count : ''}</span>
                                        </button>
                                        
                                        {user && user.id === reply.user_id && (
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <button className="text-gray-500 hover:text-white focus:outline-none">
                                                <MoreVertical className="h-3 w-3" />
                                              </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                                              <DropdownMenuItem 
                                                className="text-white cursor-pointer hover:bg-gray-700"
                                                onClick={() => handleEditClick(reply)}
                                              >
                                                Edit
                                              </DropdownMenuItem>
                                              <DropdownMenuItem 
                                                className="text-red-500 cursor-pointer hover:bg-gray-700"
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
                      
                      {/* Reply form */}
                      {replyingTo?.id === comment.id && (
                        <div className="mt-2 ml-12">
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
                                  id="comment-textarea"
                                  value={comment}
                                  onChange={(e) => setComment(e.target.value)}
                                  placeholder={`Reply to ${replyingTo.profiles?.username}...`}
                                  className="min-h-8 py-1.5 px-3 bg-gray-800 border-gray-700 resize-none text-sm flex-1"
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
                                  className="h-7 text-xs"
                                >
                                  Post
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
          
          {/* Comment input at bottom - Chat style */}
          <div className="border-t border-gray-800 sticky bottom-0 bg-gray-900 p-3">
            <form onSubmit={handleSubmitComment} className="flex items-center gap-3">
              {user && (
                <Avatar className="h-8 w-8 flex-shrink-0">
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
                  className="w-full py-2 px-3 bg-gray-800 border-none rounded-full text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-0"
                />
              </div>
              
              {comment.trim() && (
                <button
                  type="submit"
                  className="text-blue-400 font-semibold text-sm hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post
                </button>
              )}
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentModal;
