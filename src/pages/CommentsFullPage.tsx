import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ChevronLeft, 
  MessageCircle, 
  MoreVertical, 
  Send, 
  Smile,
  Trash,
  Edit,
  X,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getPostWithComments } from '@/lib/api/posts';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  parent_id: string | null;
  likes_count: number;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  children?: Comment[];
}

interface Post {
  id: string;
  content: string;
  image_url?: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  comments?: Comment[];
}

const CommentsFullPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);

  // Manually force refetch on mount to ensure comments are up to date
  useEffect(() => {
    if (postId) {
      queryClient.invalidateQueries({ queryKey: ['post-comments-fullpage', postId] });
    }
  }, [postId, queryClient]);

  // Monitor scroll position to show/hide scroll buttons
  useEffect(() => {
    const handleScroll = () => {
      if (!commentsContainerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = commentsContainerRef.current;
      
      // Show scroll buttons when content is scrollable (more than 1.5 screens)
      setShowScrollButtons(scrollHeight > clientHeight * 1.5);
      
      // Check if we're at the top or bottom
      setAtTop(scrollTop < 10);
      setAtBottom(scrollTop + clientHeight >= scrollHeight - 10);
    };

    // Set up scroll event listener
    const container = commentsContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll();
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Add keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process if we're on the comments page and not typing in the input
      const activeElement = document.activeElement;
      const isInputActive = activeElement instanceof HTMLInputElement || 
                           activeElement instanceof HTMLTextAreaElement;
      
      if (isInputActive) return;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          scrollToTop();
          break;
        case 'ArrowDown':
          e.preventDefault();
          scrollToBottom();
          break;
        case 'Home':
          e.preventDefault();
          scrollToTop();
          break;
        case 'End':
          e.preventDefault();
          scrollToBottom();
          break;
        case 'c':
        case 'C':
          // Focus the comment input
          e.preventDefault();
          inputRef.current?.focus();
          break;
        case 'Escape':
          // Go back
          e.preventDefault();
          handleBack();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.addEventListener('keydown', handleKeyDown);
  }, []);

  const { data: post, isLoading, refetch } = useQuery<Post>({
    queryKey: ['post-comments-fullpage', postId],
    queryFn: async () => {
      if (!postId) throw new Error('Post ID is required');
      return await getPostWithComments(postId);
    },
    enabled: !!postId,
    refetchOnWindowFocus: true,
    staleTime: 0 // Consider data always stale to force refresh
  });

  // Auto-scroll to bottom when new comments are added
  useEffect(() => {
    if (!isLoading && post?.comments) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [post?.comments?.length, isLoading]);

  // Focus input when replying to a comment
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  const addComment = useMutation({
    mutationFn: async () => {
      if (!user || !postId || !newComment.trim()) {
        throw new Error('Missing required data');
      }

      const { data, error } = await supabase
        .from('comments')
        .insert({
          content: newComment.trim(),
          post_id: postId,
          user_id: user.id,
          parent_id: replyingTo
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setNewComment('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['post-comments-fullpage', postId] });
      toast.success('Comment added');
    },
    onError: (error) => {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  });

  const updateComment = useMutation({
    mutationFn: async () => {
      if (!user || !editingComment || !editContent.trim()) {
        throw new Error('Missing required data');
      }

      const { data, error } = await supabase
        .from('comments')
        .update({ content: editContent.trim() })
        .eq('id', editingComment)
        .eq('user_id', user.id) // Security: ensure comment belongs to user
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setEditingComment(null);
      setEditContent('');
      queryClient.invalidateQueries({ queryKey: ['post-comments-fullpage', postId] });
      toast.success('Comment updated');
    },
    onError: (error) => {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user || !commentId) {
        throw new Error('Missing required data');
      }

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id); // Security: ensure comment belongs to user

      if (error) throw error;
      return commentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments-fullpage', postId] });
      toast.success('Comment deleted');
    },
    onError: (error) => {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          content: newComment,
          post_id: postId,
          user_id: user.id,
          parent_id: replyingTo
        })
        .select(`
          *,
          profiles:user_id(id, username, avatar_url)
        `)
        .single();
        
      if (error) throw error;
      
      // Add new comment to the list and reset form
      setNewComment('');
      setReplyingTo(null);
      
      // Invalidate cache to trigger update
      queryClient.invalidateQueries({ queryKey: ['post-comments-fullpage', postId] });
      
      // Scroll to bottom to see the new comment
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim() || !editingComment) return;
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .update({ content: editContent })
        .eq('id', editingComment)
        .select()
        .single();
        
      if (error) throw error;
      
      // Update comments with the edited comment
      setEditingComment(null);
      setEditContent('');
      
      queryClient.invalidateQueries({ queryKey: ['post-comments-fullpage', postId] });
      
      toast.success('Comment updated successfully');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  };
  
  const handleEditStart = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleEditCancel = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Scroll functions
  const scrollToTop = () => {
    commentsContainerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToBottom = () => {
    if (commentsContainerRef.current) {
      commentsContainerRef.current.scrollTo({
        top: commentsContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Custom scroller for paginated scrolling
  const scrollPage = (direction: 'up' | 'down') => {
    if (!commentsContainerRef.current) return;
    
    const { clientHeight } = commentsContainerRef.current;
    const currentScroll = commentsContainerRef.current.scrollTop;
    
    // Scroll one page (container height) at a time
    commentsContainerRef.current.scrollTo({
      top: direction === 'up' ? currentScroll - clientHeight * 0.8 : currentScroll + clientHeight * 0.8,
      behavior: 'smooth'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f112a] text-white pb-20">
        <div className="bg-[#141644] py-4 px-6 flex items-center sticky top-0 z-10 border-b-4 border-[#4a4dff] shadow-[0_4px_0_0_#000]">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack}
            className="mr-3 text-gray-300 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold pixel-font">COMMENTS</h1>
        </div>
        <div className="px-4 py-6">
          <div className="retro-border p-4 mb-6">
            <div className="flex items-center mb-6">
              <Skeleton className="h-10 w-10 rounded-none" />
              <Skeleton className="h-10 ml-3 flex-1 rounded-none" />
            </div>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map(n => (
              <div key={n} className="flex items-start gap-3 retro-border p-3">
                <Skeleton className="h-10 w-10 rounded-none flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1 rounded-none" />
                  <Skeleton className="h-12 w-full rounded-none" />
                  <Skeleton className="h-3 w-20 mt-1 rounded-none" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0f112a] text-white pb-20">
        <div className="bg-[#141644] py-4 px-6 flex items-center sticky top-0 z-10 border-b-4 border-[#4a4dff] shadow-[0_4px_0_0_#000]">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack}
            className="mr-3 text-gray-300 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold pixel-font">COMMENTS</h1>
        </div>
        <div className="flex flex-col items-center justify-center h-[50vh] px-4">
          <div className="retro-border p-6 text-center">
            <MessageCircle className="h-12 w-12 text-red-400 mb-4 mx-auto" />
            <p className="text-lg text-red-400 mb-2 pixel-font">GAME OVER</p>
            <p className="mb-4 text-gray-400">Post not found</p>
            <Button onClick={() => navigate('/')} className="mt-4 retro-button">
              RETURN TO HOME
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const comments = post.comments || [];
  const totalComments = comments.length;

  return (
    <div className="min-h-screen bg-[#0f112a] text-white pb-20 retro-game-bg">
      {/* Header */}
      <div className="bg-[#141644] py-4 px-6 flex items-center sticky top-0 z-10 border-b-4 border-[#4a4dff] shadow-[0_4px_0_0_#000]">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleBack}
          className="mr-3 text-gray-300 hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold pixel-font">COMMENTS</h1>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="flex items-center text-gray-400">
            <MessageCircle className="h-4 w-4 mr-1" />
            <span className="text-sm">{totalComments}</span>
          </div>
        </div>
      </div>

      <div ref={topRef} className="h-1"></div>

      {/* Comments content with improved scrolling */}
      <div 
        ref={commentsContainerRef}
        className="h-[calc(100vh-140px)] overflow-y-auto scroll-smooth px-4 hide-scrollbar"
      >
        {/* Comment Count */}
        <button 
          className="flex items-center gap-2 py-4 text-[#5ce1ff] hover:text-[#00c3ff] transition-colors pixel-font mt-2"
          onClick={scrollToBottom}
        >
          <MessageCircle className="h-4 w-4" />
          <span>VIEW ALL {totalComments} COMMENTS</span>
        </button>

        {/* Comments Section Header */}
        <h2 className="text-xl font-bold mb-6 mt-2 pixel-font retro-text-shadow">COMMENTS</h2>

        {/* Comments List */}
        <div className="space-y-6 mb-32">
          {comments.length === 0 ? (
            <div className="text-center py-12 retro-border p-6">
              <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="pixel-font text-[#5ce1ff]">NO COMMENTS YET</p>
              <p className="text-sm mt-1">Be the first to comment!</p>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="border-b border-[#333a7a] pb-4 last:border-0 retro-border p-4 mb-2">
                {editingComment === comment.id ? (
                  // Edit Comment Form
                  <form onSubmit={handleEditSubmit} className="mt-2">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 mt-1 rounded-none">
                        <AvatarImage src={user?.user_metadata?.avatar_url || undefined} />
                        <AvatarFallback className="bg-[#333a7a] rounded-none">
                          {user?.user_metadata?.name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="font-medium mr-2 pixel-font">
                            {user?.user_metadata?.name || user?.email}
                          </span>
                          <span className="text-xs text-[#5ce1ff]">EDITING</span>
                        </div>
                        <Input
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          className="bg-[#1a1d45] border-[#4a4dff] mb-2 rounded-none"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={handleEditCancel}
                            className="h-8 retro-button-secondary"
                          >
                            CANCEL
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={!editContent.trim()}
                            size="sm"
                            className="h-8 retro-button"
                          >
                            SAVE
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                ) : (
                  // Comment Display
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0 rounded-none border-2 border-[#4a4dff]">
                      <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="bg-[#1a1d45] rounded-none">
                        {comment.profiles?.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Link 
                          to={`/profile/${comment.profiles?.username}`}
                          className="font-semibold hover:underline truncate pixel-font text-[#5ce1ff]"
                        >
                          {comment.profiles?.username}
                        </Link>
                        
                        {/* Only show menu for user's own comments */}
                        {user && user.id === comment.user_id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 rounded-none text-gray-400 hover:text-white border border-[#4a4dff]"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#1a1d45] border-2 border-[#4a4dff] text-white rounded-none">
                              <DropdownMenuItem 
                                className="flex items-center cursor-pointer hover:bg-[#252968] pixel-font"
                                onClick={() => handleEditStart(comment)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                <span>EDIT</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="flex items-center cursor-pointer text-red-400 hover:bg-[#252968] hover:text-red-300 pixel-font"
                                onClick={() => deleteComment.mutate(comment.id)}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                <span>DELETE</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      <p className="text-white break-words mb-2 retro-text-content">
                        {comment.content}
                      </p>
                      <div className="flex items-center text-xs text-gray-400 gap-4">
                        <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                        <button 
                          className="hover:text-[#5ce1ff] transition-colors font-medium pixel-font text-xs"
                          onClick={() => setReplyingTo(comment.id)}
                        >
                          REPLY
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={bottomRef}></div>
        </div>
      </div>

      {/* Floating scroll controls for easier navigation */}
      {showScrollButtons && (
        <div className="fixed right-4 bottom-24 flex flex-col gap-2 z-10">
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={() => scrollPage('up')}
            disabled={atTop}
            className="h-9 w-9 bg-[#252968] border-2 border-[#4a4dff] rounded-none shadow-[2px_2px_0px_#000] opacity-80 hover:opacity-100"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={() => scrollPage('down')}
            disabled={atBottom}
            className="h-9 w-9 bg-[#252968] border-2 border-[#4a4dff] rounded-none shadow-[2px_2px_0px_#000] opacity-80 hover:opacity-100"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Comment Form */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#141644] p-3 pb-5 border-t-4 border-[#4a4dff] shadow-[0_-4px_0_0_#000]">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Avatar className="h-10 w-10 rounded-none border-2 border-[#4a4dff]">
            <AvatarImage src={user?.user_metadata?.avatar_url || undefined} />
            <AvatarFallback className="bg-[#1a1d45] rounded-none">
              {user?.user_metadata?.name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="relative flex-1">
            {replyingTo && (
              <div className="absolute -top-6 left-0 right-0 bg-[#333a7a] px-3 py-1 rounded-t-none text-xs flex items-center justify-between retro-border-top">
                <span className="pixel-font">
                  REPLYING TO COMMENT
                </span>
                <button 
                  type="button" 
                  onClick={() => setReplyingTo(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            
            <Input
              ref={inputRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="bg-[#1a1d45] border-[#4a4dff] pr-12 focus:ring-1 focus:ring-[#5ce1ff] rounded-none"
            />
            <button 
              type="button" 
              className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#5ce1ff] transition-colors"
            >
              <Smile className="h-5 w-5" />
            </button>
          </div>
          
          <Button 
            type="submit" 
            size="icon"
            disabled={!newComment.trim()}
            className={`bg-[#4a4dff] hover:bg-[#333a7a] h-10 w-10 rounded-none flex items-center justify-center transition-colors retro-button ${
              !newComment.trim() ? 'opacity-50' : ''
            }`}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CommentsFullPage;
