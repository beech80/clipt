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
      <DialogContent className="sm:max-w-lg bg-gaming-800 border-gaming-700 text-white p-0 max-h-[90vh] flex flex-col overflow-hidden">
        <DialogTitle className="border-b border-gaming-700 p-4 flex items-center">
          <div className="flex-1 flex items-center">
            {post?.profiles?.username && (
              <span className="text-base">
                Comments on {post.profiles.username}'s post
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogTitle>

        {/* Comments section - scrollable */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-12 text-center text-gaming-300">
              <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              Loading comments...
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
                <div key={comment.id} className="px-4 py-3 border-b border-gray-800 hover:bg-gaming-700/20 transition-colors">
                  <div className="flex gap-3">
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarImage src={comment.profiles?.avatar_url || ''} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500 text-white">{comment.profiles?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <span className="font-semibold text-gaming-100 mr-1">
                          {comment.profiles?.username || 'Anonymous'}
                        </span>
                        
                        {isCommentAuthor(comment) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
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
                      
                      {editingComment?.id === comment.id ? (
                        <div className="mt-1">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-9 py-2 px-3 bg-gaming-800 border-gaming-700 resize-none text-sm"
                            rows={2}
                            autoFocus
                          />
                          <div className="flex gap-2 mt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={handleSaveEdit}
                              className="h-8 text-xs flex items-center"
                            >
                              <Check className="h-3 w-3 mr-1" /> Save
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={handleCancelEdit}
                              className="h-8 text-xs flex items-center"
                            >
                              <XIcon className="h-3 w-3 mr-1" /> Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gaming-200 mt-1 break-words">{comment.content}</p>
                      )}
                      
                      <div className="flex items-center mt-2 text-xs text-gaming-400 space-x-4">
                        <span>{formatDate(comment.created_at)}</span>
                        
                        <button 
                          className={`flex items-center space-x-1 ${comment.liked_by_me ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                          onClick={() => handleLikeComment(comment.id)}
                        >
                          <Heart className="h-3.5 w-3.5" fill={comment.liked_by_me ? "currentColor" : "none"} />
                          <span>{comment.likes_count || ''}</span>
                        </button>
                        
                        <button 
                          className="font-semibold hover:text-gaming-300"
                          onClick={() => handleReplyClick(comment)}
                        >
                          Reply
                        </button>
                      </div>
                      
                      {/* Show replies if any */}
                      {comment.children && comment.children.length > 0 && (
                        <div className="mt-2">
                          <button
                            className="flex items-center text-xs text-gaming-400 mt-1"
                            onClick={() => toggleReplies(comment.id)}
                          >
                            <div className="h-px bg-gaming-700 w-6 mr-2"></div>
                            {showRepliesFor[comment.id] ? (
                              <span className="flex items-center">
                                Hide replies <ChevronUp className="h-3 w-3 ml-1" />
                              </span>
                            ) : (
                              <span className="flex items-center">
                                View {comment.children.length} {comment.children.length === 1 ? 'reply' : 'replies'} <ChevronDown className="h-3 w-3 ml-1" />
                              </span>
                            )}
                          </button>
                          
                          {showRepliesFor[comment.id] && (
                            <div className="mt-3 space-y-3 ml-3 pl-3 border-l border-gaming-700/50">
                              {comment.children.map(reply => (
                                <div key={reply.id} className="flex gap-3">
                                  <Avatar className="h-7 w-7 flex-shrink-0">
                                    <AvatarImage src={reply.profiles?.avatar_url || ''} />
                                    <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500 text-white">{reply.profiles?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                                  </Avatar>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                      <span className="font-semibold text-gaming-100 mr-1">
                                        {reply.profiles?.username || 'Anonymous'}
                                      </span>
                                      
                                      {isCommentAuthor(reply) && (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                              <MoreVertical className="h-3 w-3" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="bg-gaming-800 border-gaming-700">
                                            <DropdownMenuItem 
                                              className="cursor-pointer hover:bg-gaming-700 text-xs py-1"
                                              onClick={() => handleEditClick(reply)}
                                            >
                                              Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                              className="cursor-pointer text-red-500 hover:bg-gaming-700 text-xs py-1"
                                              onClick={() => handleDeleteComment(reply.id)}
                                            >
                                              Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      )}
                                    </div>
                                    
                                    {editingComment?.id === reply.id ? (
                                      <div className="mt-1">
                                        <Textarea
                                          value={editContent}
                                          onChange={(e) => setEditContent(e.target.value)}
                                          className="min-h-9 py-2 px-3 bg-gaming-800 border-gaming-700 resize-none text-sm"
                                          rows={2}
                                          autoFocus
                                        />
                                        <div className="flex gap-2 mt-2">
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={handleSaveEdit}
                                            className="h-7 text-xs flex items-center"
                                          >
                                            <Check className="h-3 w-3 mr-1" /> Save
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={handleCancelEdit}
                                            className="h-7 text-xs flex items-center"
                                          >
                                            <XIcon className="h-3 w-3 mr-1" /> Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-gaming-200 text-sm mt-0.5 break-words">{reply.content}</p>
                                    )}
                                    
                                    <div className="flex items-center mt-1 text-xs text-gaming-400 space-x-4">
                                      <span>{formatDate(reply.created_at)}</span>
                                      
                                      <button 
                                        className={`flex items-center space-x-1 ${reply.liked_by_me ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                                        onClick={() => handleLikeComment(reply.id)}
                                      >
                                        <Heart className="h-3 w-3" fill={reply.liked_by_me ? "currentColor" : "none"} />
                                        <span>{reply.likes_count || ''}</span>
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
                        <div className="mt-3 ml-3 pl-3 border-l border-gaming-700/50">
                          <div className="flex gap-2">
                            {user && (
                              <Avatar className="h-7 w-7 flex-shrink-0">
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
                              <Textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder={`Reply to ${replyingTo.profiles?.username}...`}
                                className="min-h-9 py-2 px-3 bg-gaming-800 border-gaming-700 resize-none text-sm w-full"
                                rows={2}
                                autoFocus
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setReplyingTo(null)}
                                  className="h-7 text-xs"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleSubmitComment}
                                  disabled={!comment.trim()}
                                  className="h-7 text-xs bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                                >
                                  Reply
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
        
        {/* Comment input at bottom - Modern social media style */}
        {!replyingTo && (
          <form onSubmit={handleSubmitComment} className="border-t border-gaming-700 p-3 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg opacity-0 group-focus-within:opacity-70 blur group-hover:opacity-30 transition duration-300"></div>
            <div className="relative flex items-center bg-gaming-800 p-2.5 rounded-full">
              {user && (
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage 
                    src={user.user_metadata?.avatar_url || ''} 
                    alt={user.user_metadata?.username || 'User'} 
                  />
                  <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500 text-white">
                    {user.user_metadata?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 min-h-8 py-1.5 px-3 bg-transparent border-none resize-none focus:ring-0 text-white placeholder:text-gray-500"
                rows={1}
              />
              
              <Button
                type="submit"
                disabled={!comment.trim()}
                className="ml-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full px-4"
              >
                Post
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CommentModal;
