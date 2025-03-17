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
  X
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
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: post, isLoading } = useQuery<Post>({
    queryKey: ['post-comments-fullpage', postId],
    queryFn: async () => {
      if (!postId) throw new Error('Post ID is required');
      return await getPostWithComments(postId);
    },
    enabled: !!postId,
    refetchOnWindowFocus: true
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
      queryClient.invalidateQueries(['post-comments-fullpage', postId]);
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
      queryClient.invalidateQueries(['post-comments-fullpage', postId]);
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
      queryClient.invalidateQueries(['post-comments-fullpage', postId]);
      toast.success('Comment deleted');
    },
    onError: (error) => {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addComment.mutate();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateComment.mutate();
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f111a] text-white pb-20">
        <div className="bg-[#171a29] py-4 px-6 flex items-center sticky top-0 z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack}
            className="mr-3 text-gray-300 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Comments</h1>
        </div>
        <div className="px-4 py-6">
          <div className="flex items-center mb-6">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 ml-3 flex-1 rounded-full" />
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map(n => (
              <div key={n} className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-12 w-full rounded-md" />
                  <Skeleton className="h-3 w-20 mt-1" />
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
      <div className="min-h-screen bg-[#0f111a] text-white pb-20">
        <div className="bg-[#171a29] py-4 px-6 flex items-center sticky top-0 z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack}
            className="mr-3 text-gray-300 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Comments</h1>
        </div>
        <div className="flex flex-col items-center justify-center h-[50vh] px-4">
          <MessageCircle className="h-12 w-12 text-gray-500 mb-4" />
          <p className="text-lg text-gray-400 mb-2">Post not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  const comments = post.comments || [];
  const totalComments = comments.length;

  return (
    <div className="min-h-screen bg-[#0f111a] text-white pb-20">
      {/* Header */}
      <div className="bg-[#171a29] py-4 px-6 flex items-center sticky top-0 z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleBack}
          className="mr-3 text-gray-300 hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Comments</h1>
      </div>

      <div className="px-4">
        {/* Comment Count */}
        <button 
          className="flex items-center gap-2 py-4 text-blue-400 hover:text-blue-300 transition-colors"
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
        >
          <MessageCircle className="h-4 w-4" />
          <span>View all {totalComments} comments</span>
        </button>

        {/* Comments Section Header */}
        <h2 className="text-xl font-bold mb-6 mt-2">Comments</h2>

        {/* Comments List */}
        <div className="space-y-6 mb-8">
          {comments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No comments yet</p>
              <p className="text-sm mt-1">Be the first to comment!</p>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="border-b border-gray-800 pb-4 last:border-0">
                {editingComment === comment.id ? (
                  // Edit Comment Form
                  <form onSubmit={handleEditSubmit} className="mt-2">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 mt-1">
                        <AvatarImage src={user?.user_metadata?.avatar_url || undefined} />
                        <AvatarFallback className="bg-blue-900">
                          {user?.user_metadata?.name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="font-medium mr-2">
                            {user?.user_metadata?.name || user?.email}
                          </span>
                          <span className="text-xs text-gray-400">Editing</span>
                        </div>
                        <Input
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          className="bg-[#1a1d2d] border-[#2a2e42] mb-2"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={handleEditCancel}
                            className="h-8"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={!editContent.trim() || updateComment.isLoading}
                            size="sm"
                            className="h-8 bg-blue-600 hover:bg-blue-700"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                ) : (
                  // Comment Display
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gray-800">
                        {comment.profiles?.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Link 
                          to={`/profile/${comment.profiles?.username}`}
                          className="font-semibold hover:underline truncate"
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
                                className="h-8 w-8 rounded-full text-gray-400 hover:text-white"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#1a1d2d] border-[#2a2e42] text-white">
                              <DropdownMenuItem 
                                className="flex items-center cursor-pointer hover:bg-[#252938]"
                                onClick={() => handleEditStart(comment)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="flex items-center cursor-pointer text-red-500 hover:bg-[#252938] hover:text-red-400"
                                onClick={() => deleteComment.mutate(comment.id)}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      <p className="text-white break-words mb-2">
                        {comment.content}
                      </p>
                      <div className="flex items-center text-xs text-gray-400 gap-4">
                        <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                        <button 
                          className="hover:text-blue-400 transition-colors font-medium"
                          onClick={() => setReplyingTo(comment.id)}
                        >
                          Reply
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

        {/* Comment Form */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#171a29] p-3 pb-5 border-t border-[#2a2e42]">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.user_metadata?.avatar_url || undefined} />
              <AvatarFallback className="bg-blue-900">
                {user?.user_metadata?.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="relative flex-1">
              {replyingTo && (
                <div className="absolute -top-6 left-0 right-0 bg-blue-900/30 px-3 py-1 rounded-t-md text-xs flex items-center justify-between">
                  <span>
                    Replying to comment
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
                className="bg-[#1a1d2d] border-[#2a2e42] pr-12 focus:ring-1 focus:ring-blue-500"
              />
              <button 
                type="button" 
                className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors"
              >
                <Smile className="h-5 w-5" />
              </button>
            </div>
            
            <Button 
              type="submit" 
              size="icon"
              disabled={!newComment.trim() || addComment.isLoading}
              className={`bg-blue-600 hover:bg-blue-700 h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                !newComment.trim() ? 'opacity-50' : ''
              }`}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommentsFullPage;
