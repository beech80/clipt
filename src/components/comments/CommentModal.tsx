import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// Import basic Lucide icons - simpler approach
import { X, Heart, ChevronDown, ChevronUp, MoreVertical, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getComments, getCommentCount, likeComment, deleteComment, editComment, createComment } from "@/services/commentService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNowStrict } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Create wrapper components to avoid bundling issues
const CloseIcon = () => <X className="h-4 w-4" />;
const HeartIcon = ({ fill }: { fill: string }) => <Heart className="h-4 w-4" fill={fill} />;
const SmallHeartIcon = ({ fill }: { fill: string }) => <Heart className="h-3 w-3" fill={fill} />;
const DownIcon = () => <ChevronDown className="h-3 w-3 ml-1" />;
const UpIcon = () => <ChevronUp className="h-3 w-3 ml-1" />;
const MoreIcon = () => <MoreVertical className="h-4 w-4" />;
const SmallMoreIcon = () => <MoreVertical className="h-3 w-3" />;
const CheckmarkIcon = () => <Check className="h-3 w-3 mr-1" />;
const SmallCloseIcon = () => <X className="h-3 w-3 mr-1" />;
const TinyCloseIcon = () => <X className="h-3 w-3" />;

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

interface CommentData {
  post_id: string;
  user_id: string;
  content: string;
  parent_id?: string | null;
}

const CommentModal: React.FC<CommentModalProps> = ({ postId, isOpen, onClose }) => {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showRepliesFor, setShowRepliesFor] = useState<Record<string, boolean>>({});
  const [post, setPost] = useState<any>(null);

  // Get useQueryClient
  const queryClient = useQueryClient();

  // Console.log when component mounts and dependencies change
  useEffect(() => {
    console.log(`CommentModal rendered - postId: ${postId}, isOpen: ${isOpen}`);
    
    if (isOpen && postId) {
      console.log(`Modal open for post ${postId}, fetching data...`);
    }
  }, [postId, isOpen]);

  // Force refresh comments when modal opens
  useEffect(() => {
    if (isOpen && postId) {
      console.log("Modal opened, forcing comment refresh");
      refetch();
    }
  }, [isOpen, postId, refetch]);

  // Fetch the post data
  useEffect(() => {
    if (isOpen && postId) {
      const fetchPost = async () => {
        console.log(`Fetching post data for ${postId}`);
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
            
          if (error) {
            console.error("Error fetching post:", error);
            toast.error("Failed to load post");
            return;
          }
          
          console.log("Post data retrieved:", data);
          setPost(data);
        } catch (error) {
          console.error("Error in fetchPost:", error);
          toast.error("An error occurred while loading the post");
        }
      };
      
      fetchPost();
    }
  }, [isOpen, postId]);

  // Fetch comments
  const { 
    data: comments = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      console.log(`Running useQuery to fetch comments for post ${postId}`);
      if (!postId) return [];
      const { data, error } = await getComments(postId);
      if (error) {
        console.error('Error fetching comments in useQuery:', error);
        throw error;
      }
      console.log(`Comments fetched in useQuery:`, data?.length, data);
      return data || [];
    },
    enabled: !!postId && isOpen
  });

  // Add comment mutation
  const addComment = useMutation({
    mutationFn: async ({ content, parentId }: { content: string, parentId?: string }) => {
      if (!user || !postId) {
        throw new Error('User or post ID is missing');
      }
      
      console.log(`Adding comment: content=${content}, parentId=${parentId}, postId=${postId}`);
      
      const commentData: CommentData = {
        post_id: postId,
        user_id: user.id,
        content: content,
        parent_id: parentId || null
      };
      
      const result = await createComment(commentData);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: () => {
      console.log("Comment added successfully, refetching comments...");
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      setComment('');
      setReplyingTo(null);
      toast.success('Comment added successfully!');
    },
    onError: (error: any) => {
      console.error("Error adding comment:", error);
      toast.error('Failed to add comment. Please try again.');
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
  const organizedComments = useMemo(() => {
    if (!comments || !Array.isArray(comments)) {
      console.log("No comments to organize or comments is not an array", comments);
      return [];
    }
    
    console.log(`Organizing ${comments.length} comments for post ${postId}`);
    
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
        } else {
          // If we can't find the parent or it has no children array
          // (rare edge case), treat as top-level
          topLevelComments.push(currentComment);
        }
      } else {
        // This is a top-level comment (no parent or parent not found)
        topLevelComments.push(currentComment);
      }
    });
    
    // Sort all comments by created_at (newest first)
    const sortedComments = topLevelComments.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    console.log(`Organized comments: ${sortedComments.length} top-level comments with their replies`, 
      sortedComments.map(c => ({ 
        id: c.id, 
        content: c.content.substring(0, 20) + '...', 
        childCount: c.children?.length 
      }))
    );
    
    return sortedComments;
  }, [comments, postId]);

  // Check if current user is the author of a comment
  const isCommentAuthor = useCallback((comment: Comment) => {
    if (!user) return false;
    const isAuthor = user.id === comment.user_id;
    console.log(`Checking if user ${user.id} is author of comment ${comment.id} by ${comment.user_id}: ${isAuthor}`);
    return isAuthor;
  }, [user]);

  // Enhanced logging to debug why comments aren't showing
  useEffect(() => {
    if (comments?.length > 0) {
      console.log("Current comments data:", comments);
      console.log("User IDs in comments:", comments.map(c => ({
        comment_id: c.id,
        user_id: c.user_id,
        username: c.profiles?.username,
        content_preview: c.content.substring(0, 15) + '...',
        isMyComment: user?.id === c.user_id
      })));
    }
  }, [comments, user]);

  // Add ability to manually refresh comments
  const handleRefreshComments = () => {
    console.log("Manually refreshing comments");
    refetch();
    toast.success("Refreshing comments...");
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
            <CloseIcon />
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
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-white">Comments</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefreshComments}
              className="text-xs text-gaming-300 hover:text-white"
            >
              Refresh
            </Button>
          </div>
          
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
              <div className="p-2 bg-gaming-800 rounded mb-4 text-sm">
                <p className="text-gaming-200">Showing {organizedComments.length} comments 
                {comments?.length > organizedComments.length && ` (and ${comments.length - organizedComments.length} replies)`}</p>
              </div>
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
                                <CheckmarkIcon /> Save
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={handleCancelEdit}
                                className="h-7 text-xs flex items-center"
                              >
                                <SmallCloseIcon /> Cancel
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
                                Hide replies <UpIcon />
                              </span>
                            ) : (
                              <span className="flex items-center">
                                View {comment.children.length} {comment.children.length === 1 ? 'reply' : 'replies'} <DownIcon />
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
                                              <CheckmarkIcon /> Save
                                            </Button>
                                            <Button 
                                              variant="ghost" 
                                              size="sm"
                                              onClick={handleCancelEdit}
                                              className="h-6 text-xs flex items-center px-2"
                                            >
                                              <SmallCloseIcon /> Cancel
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
                                      <SmallHeartIcon fill={reply.liked_by_me ? "currentColor" : "none"} />
                                    </button>
                                    
                                    {isCommentAuthor(reply) && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button className="flex-shrink-0 text-gaming-400 hover:text-gaming-300 transition-colors">
                                            <SmallMoreIcon />
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
                        <HeartIcon fill={comment.liked_by_me ? "currentColor" : "none"} />
                      </button>
                      
                      {isCommentAuthor(comment) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex-shrink-0 text-gaming-400 hover:text-gaming-300 transition-colors">
                              <MoreIcon />
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
                  <TinyCloseIcon />
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
