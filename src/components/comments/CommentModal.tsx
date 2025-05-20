import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// Import from our centralized icon library
import { 
  CloseIcon, 
  HeartIcon, 
  ChevronDownIcon, 
  ChevronUpIcon, 
  MoreIcon, 
  CheckIcon 
} from "@/components/ui/icons";
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

// Custom styled versions of our icons
const SmallHeartIcon = ({ fill }: { fill: string }) => <HeartIcon className="h-3 w-3" fill={fill} />;
const DownIcon = () => <ChevronDownIcon className="h-3 w-3 ml-1" />;
const UpIcon = () => <ChevronUpIcon className="h-3 w-3 ml-1" />;
const SmallMoreIcon = () => <MoreIcon className="h-3 w-3" />;
const CheckmarkIcon = () => <CheckIcon className="h-3 w-3 mr-1" />;
const SmallCloseIcon = () => <CloseIcon className="h-3 w-3 mr-1" />;
const TinyCloseIcon = () => <CloseIcon className="h-3 w-3" />;

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
  const [showUserComments, setShowUserComments] = useState<string | null>(null);
  const [userComments, setUserComments] = useState<Comment[]>([]);
  const [isLoadingUserComments, setIsLoadingUserComments] = useState(false);

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

  // Fetch user comments
  const fetchUserComments = useCallback(async (userId: string) => {
    if (!userId) return;
    
    setIsLoadingUserComments(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          parent_id,
          user_id,
          post_id,
          profiles:user_id (
            username,
            avatar_url
          ),
          likes_count
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) {
        console.error("Error fetching user comments:", error);
        toast.error("Failed to load user comments");
        return;
      }
      
      setUserComments(data || []);
    } catch (error) {
      console.error("Error in fetchUserComments:", error);
      toast.error("An error occurred while loading user comments");
    } finally {
      setIsLoadingUserComments(false);
    }
  }, []);

  // Toggle showing user comments
  const toggleUserComments = useCallback((userId: string) => {
    if (showUserComments === userId) {
      setShowUserComments(null);
    } else {
      setShowUserComments(userId);
      fetchUserComments(userId);
    }
  }, [showUserComments, fetchUserComments]);

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
      <DialogContent className="sm:max-w-lg bg-gaming-800 border-gaming-700 text-white p-0 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header with title and close button */}
        <div className="flex justify-between items-center py-3 px-4 border-b border-gaming-700 bg-gradient-to-r from-indigo-900/50 to-purple-900/50">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Add Comment
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
            <CloseIcon className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Post summary (if available) */}
        {post && (
          <div className="p-4 border-b border-gaming-700 bg-gaming-900/50">
            <div className="flex items-start space-x-3">
              <Avatar className="w-10 h-10 rounded-full border-2 border-purple-600/50">
                <AvatarImage src={post?.profiles?.avatar_url || ''} alt={post?.profiles?.username || 'User'} />
                <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500">
                  {post?.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white">{post?.profiles?.username || 'User'}</div>
                <p className="text-sm text-gray-300 line-clamp-2 mt-1">{post?.content || ''}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Comment input section */}
        <div className="p-4 border-b border-gaming-700 bg-gradient-to-b from-gaming-800 to-gaming-900/90">
          {replyingTo ? (
            <div className="mb-3 flex items-center">
              <div className="text-sm text-gray-300">
                Replying to <span className="font-medium text-blue-400">{replyingTo.profiles.username}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setReplyingTo(null)} 
                className="ml-auto text-gray-400 hover:text-white h-6 px-1"
              >
                <SmallCloseIcon />
                Cancel
              </Button>
            </div>
          ) : null}
          
          {/* Comment form with animated border */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl opacity-30 group-focus-within:opacity-100 blur transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-gaming-900 rounded-xl p-2">
              <div className="flex items-start space-x-2">
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarImage src={user?.user_metadata?.avatar_url || ''} alt={user?.user_metadata?.username || 'User'} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500">
                    {user?.user_metadata?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={replyingTo ? `Reply to ${replyingTo.profiles.username}...` : "Write a comment..."}
                    className="min-h-[80px] resize-none bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-gray-500 p-0"
                  />
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex space-x-1">
                      {['😊', '👍', '❤️', '🔥', '👏', '🎮'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setComment(prev => prev + emoji)}
                          className="text-lg hover:bg-gaming-700 p-1 rounded-full transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    
                    <Button
                      onClick={() => handleSubmitComment}
                      disabled={!comment.trim() || addComment.isPending}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-4"
                    >
                      {addComment.isPending ? <SmallLoader className="mr-2 animate-spin" /> : null}
                      {replyingTo ? 'Reply' : 'Post'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Comment list section with scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <SmallLoader className="animate-spin h-8 w-8 text-purple-500" />
            </div>
          ) : error ? (
            <div className="text-center p-4">
              <p className="text-red-400">Failed to load comments</p>
              <Button variant="ghost" onClick={() => refetch()} className="mt-2 text-sm">
                Try Again
              </Button>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center p-6 space-y-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-purple-900/20 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-purple-500 opacity-70" />
              </div>
              <h3 className="text-lg font-medium text-white">No comments yet</h3>
              <p className="text-gray-400 text-sm">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <>
              {/* User comments section - shown when a user is clicked */}
              {showUserComments && (
                <div className="bg-gaming-700/50 rounded-xl p-4 mb-4 border border-gaming-600">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-white flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1 text-blue-400" />
                      Recent comments by 
                      <span className="text-blue-400 ml-1">
                        {userComments[0]?.profiles?.username || 'this user'}
                      </span>
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowUserComments(null)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      <TinyCloseIcon />
                    </Button>
                  </div>
                  
                  {isLoadingUserComments ? (
                    <div className="flex justify-center items-center h-20">
                      <SmallLoader className="animate-spin h-5 w-5 text-purple-500" />
                    </div>
                  ) : userComments.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {userComments.map(userComment => (
                        <div 
                          key={userComment.id} 
                          className="text-sm bg-gaming-800/70 p-2 rounded-lg hover:bg-gaming-800 transition-colors"
                        >
                          <div className="text-xs text-gray-400 mb-1">
                            {formatDistanceToNowStrict(new Date(userComment.created_at), { addSuffix: true })}
                          </div>
                          <p className="text-gray-300">{userComment.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-3 text-sm text-gray-400">
                      No other comments found
                    </div>
                  )}
                </div>
              )}
            
              {/* Regular comments list */}
              {organizedComments.map((comment) => (
                <div key={comment.id} className="comment-thread">
                  <div className={`comment-item p-3 rounded-xl ${comment.parent_id ? 'bg-gaming-800/50' : 'bg-gaming-800/70 border border-gaming-700/50'}`}>
                    <div className="flex items-start space-x-2">
                      {/* Avatar - clickable to see user's comments */}
                      <div className="cursor-pointer" onClick={() => toggleUserComments(comment.user_id)}>
                        <Avatar className={`w-8 h-8 ${showUserComments === comment.user_id ? 'ring-2 ring-blue-500' : ''}`}>
                          <AvatarImage src={comment.profiles.avatar_url || ''} alt={comment.profiles.username} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500">
                            {comment.profiles.username?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-1">
                          {/* Username - clickable to see user's comments */}
                          <span 
                            className="font-medium text-white hover:text-blue-400 cursor-pointer transition-colors"
                            onClick={() => toggleUserComments(comment.user_id)}
                          >
                            {comment.profiles.username}
                          </span>
                          
                          <span className="text-xs text-gray-400 ml-2">
                            {formatDistanceToNowStrict(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                          
                          {/* User's own comment options */}
                          {user && user.id === comment.user_id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto text-gray-400 hover:text-white">
                                  <SmallMoreIcon />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-gaming-800 border-gaming-700 text-white">
                                <DropdownMenuItem
                                  className="text-blue-400 hover:text-blue-300 hover:bg-gaming-700 cursor-pointer"
                                  onClick={() => handleEditClick(comment)}
                                >
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-400 hover:text-red-300 hover:bg-gaming-700 cursor-pointer"
                                  onClick={() => handleDeleteComment(comment.id)}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        
                        {/* Comment content or edit form */}
                        {editingComment && editingComment.id === comment.id ? (
                          <div className="mb-2">
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="min-h-[60px] resize-none bg-gaming-900 border border-gaming-600 focus-visible:ring-purple-500 text-white p-2 text-sm"
                            />
                            <div className="flex justify-end space-x-2 mt-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingComment(null)}
                                className="h-7 px-2 text-sm text-gray-400 hover:text-white"
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit()}
                                disabled={!editContent.trim() || editCommentMutation.isPending}
                                className="h-7 px-3 text-sm bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-300 whitespace-pre-wrap break-words">{comment.content}</p>
                        )}
                        
                        {/* Comment actions */}
                        <div className="flex items-center space-x-3 mt-2 text-xs">
                          <button
                            onClick={() => handleLikeComment(comment.id)}
                            className={`flex items-center space-x-1 ${comment.liked_by_me ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                          >
                            <SmallHeartIcon fill={comment.liked_by_me ? "currentColor" : "none"} />
                            <span>{comment.likes_count || 0}</span>
                          </button>
                          
                          <button
                            onClick={() => handleReplyClick(comment)}
                            className="flex items-center space-x-1 text-gray-400 hover:text-blue-400"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            <span>Reply</span>
                          </button>
                          
                          {comment.children && comment.children.length > 0 && (
                            <button
                              onClick={() => toggleReplies(comment.id)}
                              className="flex items-center space-x-1 text-blue-400 hover:text-blue-300"
                            >
                              <span>{comment.children.length} replies</span>
                              {showRepliesFor[comment.id] ? <UpIcon /> : <DownIcon />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Reply form */}
                  {replyingTo && replyingTo.id === comment.id && (
                    <div className="ml-10 mt-2">
                      <div className="bg-gaming-800/30 rounded-lg p-2 border border-gaming-700/30">
                        <Textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder={`Reply to ${replyingTo.profiles.username}...`}
                          className="min-h-[60px] resize-none bg-transparent border-0 focus-visible:ring-0 text-white p-0 text-sm"
                        />
                        <div className="flex justify-end space-x-2 mt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setReplyingTo(null)}
                            className="h-7 px-2 text-xs text-gray-400 hover:text-white"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSubmitComment()}
                            disabled={!comment.trim() || addComment.isPending}
                            className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Replies */}
                  {comment.children && comment.children.length > 0 && showRepliesFor[comment.id] && (
                    <div className="ml-10 mt-2 space-y-2 border-l-2 border-gaming-700/30 pl-3">
                      {comment.children.map((reply) => (
                        <div key={reply.id} className="comment-item">
                          {/* Render reply with similar structure to parent comment */}
                          <div className="flex items-start space-x-2">
                            <div className="cursor-pointer" onClick={() => toggleUserComments(reply.user_id)}>
                              <Avatar className={`w-6 h-6 ${showUserComments === reply.user_id ? 'ring-2 ring-blue-500' : ''}`}>
                                <AvatarImage src={reply.profiles.avatar_url || ''} alt={reply.profiles.username} />
                                <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500">
                                  {reply.profiles.username?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center mb-1">
                                <span 
                                  className="font-medium text-white hover:text-blue-400 cursor-pointer transition-colors text-sm"
                                  onClick={() => toggleUserComments(reply.user_id)}
                                >
                                  {reply.profiles.username}
                                </span>
                                
                                <span className="text-xs text-gray-400 ml-2">
                                  {formatDistanceToNowStrict(new Date(reply.created_at), { addSuffix: true })}
                                </span>
                                
                                {/* Reply options for user's own replies */}
                                {user && user.id === reply.user_id && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto text-gray-400 hover:text-white">
                                        <SmallMoreIcon />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-gaming-800 border-gaming-700 text-white">
                                      <DropdownMenuItem
                                        className="text-blue-400 hover:text-blue-300 hover:bg-gaming-700 cursor-pointer"
                                        onClick={() => handleEditClick(reply)}
                                      >
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-red-400 hover:text-red-300 hover:bg-gaming-700 cursor-pointer"
                                        onClick={() => handleDeleteComment(reply.id)}
                                      >
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                              
                              {/* Reply content or edit form */}
                              {editingComment && editingComment.id === reply.id ? (
                                <div className="mb-2">
                                  <Textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="min-h-[60px] resize-none bg-gaming-900 border border-gaming-600 focus-visible:ring-purple-500 text-white p-2 text-sm"
                                  />
                                  <div className="flex justify-end space-x-2 mt-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingComment(null)}
                                      className="h-6 px-2 text-xs text-gray-400 hover:text-white"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveEdit()}
                                      disabled={!editContent.trim() || editCommentMutation.isPending}
                                      className="h-6 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-gray-300 text-sm whitespace-pre-wrap break-words">{reply.content}</p>
                              )}
                              
                              {/* Reply actions */}
                              <div className="flex items-center space-x-3 mt-1 text-xs">
                                <button
                                  onClick={() => handleLikeComment(reply.id)}
                                  className={`flex items-center space-x-1 ${reply.liked_by_me ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                                >
                                  <SmallHeartIcon fill={reply.liked_by_me ? "currentColor" : "none"} />
                                  <span>{reply.likes_count || 0}</span>
                                </button>
                                
                                <button
                                  onClick={() => handleReplyClick(comment)} // reply to parent instead of nested reply
                                  className="flex items-center space-x-1 text-gray-400 hover:text-blue-400"
                                >
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                  </svg>
                                  <span>Reply</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentModal;
