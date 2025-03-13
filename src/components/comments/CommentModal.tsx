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
      <DialogContent className="sm:max-w-md max-h-[90vh] bg-gaming-900 text-white p-0 gap-0 flex flex-col">
        <DialogTitle className="flex items-center justify-between border-b border-gaming-700 p-4">
          <h2 className="text-xl font-bold">Add Comment</h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="h-7 w-7 rounded-full text-gaming-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogTitle>
        
        {/* Post information */}
        {post && (
          <div className="p-4 border-b border-gaming-700">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={post.profiles?.avatar_url || ''} />
                <AvatarFallback>{post.profiles?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm text-white">
                  {post.profiles?.username || 'Anonymous'}
                </p>
                <p className="text-gaming-200 text-sm">Commenting on post from {post.profiles?.username}</p>
              </div>
            </div>
            {post.content && (
              <p className="mt-2 text-sm text-gaming-200 ml-10">{post.content}</p>
            )}
            {post.image_url && (
              <div className="ml-10 mt-2 w-14 h-14 rounded overflow-hidden">
                <img 
                  src={post.image_url} 
                  alt="Post image" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        )}

        {/* Comments section with scrolling */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="font-medium text-white mb-3">Comments</h3>
          
          {isLoading ? (
            <div className="py-10 text-center text-gaming-300">
              Loading comments...
            </div>
          ) : error ? (
            <div className="py-10 text-center text-red-500">
              Error loading comments. Please try again.
            </div>
          ) : organizedComments.length === 0 ? (
            <div className="py-10 text-center text-gaming-300">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-4">
              {organizedComments.map(comment => (
                <div key={comment.id} className="py-2 border-b border-gaming-700/30 last:border-b-0">
                  <div className="flex gap-2">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={comment.profiles?.avatar_url || ''} />
                      <AvatarFallback>{comment.profiles?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div>
                        <span className="font-semibold text-gaming-100 mr-1 text-sm">
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
                          <span className="text-gaming-200 text-sm">{comment.content}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center mt-1 text-xs text-gaming-400 space-x-3">
                        <span>{formatDate(comment.created_at)}</span>
                        {comment.likes_count > 0 && (
                          <span>{comment.likes_count} like{comment.likes_count !== 1 ? 's' : ''}</span>
                        )}
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
                            <div className="h-px bg-gaming-700 w-4 mr-1"></div>
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
                            <div className="mt-2 space-y-2 pl-4 border-l border-gaming-700/30">
                              {comment.children.map(reply => (
                                <div key={reply.id} className="flex gap-2">
                                  <Avatar className="h-6 w-6 flex-shrink-0">
                                    <AvatarImage src={reply.profiles?.avatar_url || ''} />
                                    <AvatarFallback>{reply.profiles?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                                  </Avatar>
                                  
                                  <div className="flex-1">
                                    <div>
                                      <span className="font-semibold text-gaming-100 mr-1 text-sm">
                                        {reply.profiles?.username || 'Anonymous'}
                                      </span>
                                      {editingComment?.id === reply.id ? (
                                        <div className="mt-1">
                                          <Textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="min-h-8 py-1 px-2 bg-gaming-800 border-gaming-700 resize-none text-sm"
                                            rows={2}
                                            autoFocus
                                          />
                                          <div className="flex gap-2 mt-1">
                                            <Button 
                                              variant="outline" 
                                              size="sm"
                                              onClick={handleSaveEdit}
                                              className="h-6 text-xs flex items-center px-2"
                                            >
                                              <Check className="h-3 w-3 mr-1" /> Save
                                            </Button>
                                            <Button 
                                              variant="ghost" 
                                              size="sm"
                                              onClick={handleCancelEdit}
                                              className="h-6 text-xs flex items-center px-2"
                                            >
                                              <XIcon className="h-3 w-3 mr-1" /> Cancel
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-gaming-200 text-sm">{reply.content}</span>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center mt-1 text-xs text-gaming-400 space-x-2">
                                      <span>{formatDate(reply.created_at)}</span>
                                      {reply.likes_count > 0 && (
                                        <span>{reply.likes_count} like{reply.likes_count !== 1 ? 's' : ''}</span>
                                      )}
                                      <button 
                                        className="font-semibold hover:text-gaming-300"
                                        onClick={() => handleReplyClick(reply)}
                                      >
                                        Reply
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-1">
                                    <button 
                                      className="flex-shrink-0 text-gaming-400 hover:text-red-500 transition-colors"
                                      onClick={() => handleLikeComment(reply.id)}
                                    >
                                      <Heart 
                                        className="h-3 w-3" 
                                        fill={reply.liked_by_me ? "currentColor" : "none"}
                                      />
                                    </button>
                                    
                                    {isCommentAuthor(reply) && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button className="flex-shrink-0 text-gaming-400 hover:text-gaming-300 transition-colors">
                                            <MoreVertical className="h-3 w-3" />
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-gaming-800 border-gaming-700 text-white">
                                          <DropdownMenuItem 
                                            className="text-blue-400 hover:text-blue-300 cursor-pointer"
                                            onClick={() => handleEditClick(reply)}
                                          >
                                            Edit
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            className="text-red-500 hover:text-red-400 cursor-pointer"
                                            onClick={() => handleDeleteComment(reply.id)}
                                          >
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button 
                        className="flex-shrink-0 text-gaming-400 hover:text-red-500 transition-colors"
                        onClick={() => handleLikeComment(comment.id)}
                      >
                        <Heart 
                          className="h-4 w-4" 
                          fill={comment.liked_by_me ? "currentColor" : "none"}
                        />
                      </button>
                      
                      {isCommentAuthor(comment) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex-shrink-0 text-gaming-400 hover:text-gaming-300 transition-colors">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gaming-800 border-gaming-700 text-white">
                            <DropdownMenuItem 
                              className="text-blue-400 hover:text-blue-300 cursor-pointer"
                              onClick={() => handleEditClick(comment)}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-500 hover:text-red-400 cursor-pointer"
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
              ))}
            </div>
          )}
        </div>

        {/* Comment form at the bottom */}
        <div className="border-t border-gaming-700 p-4 bg-gaming-900">
          <div className="relative">
            {replyingTo && (
              <div className="absolute -top-5 left-0 text-xs text-gaming-300 flex items-center">
                <span>Replying to {replyingTo.profiles?.username}</span>
                <button 
                  type="button"
                  className="ml-1 text-gaming-400 hover:text-gaming-300"
                  onClick={() => setReplyingTo(null)}
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </div>
            )}
            <Textarea
              id="comment-textarea"
              placeholder={replyingTo ? `Reply to ${replyingTo.profiles?.username}...` : "Write your comment..."}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-24 py-3 px-4 bg-gaming-800 border-gaming-700 resize-none w-full"
              rows={4}
            />
          </div>
          
          <div className="flex justify-end mt-4 gap-3">
            <Button 
              variant="outline"
              onClick={onClose}
              className="text-gaming-300 border-gaming-700 hover:bg-gaming-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitComment}
              disabled={!comment.trim() || addComment.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {addComment.isPending ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentModal;
