import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User } from '@supabase/supabase-js';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ChevronLeft, MessageCircle, Heart, Share2, Bookmark, Loader2, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getPostWithComments } from '@/lib/api/posts';
import { CommentForm } from '@/components/post/comment/CommentForm';
import { PostWithProfile, CommentWithProfile } from '@/types/post';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { createComment, deleteComment } from '@/lib/api/comments';

const CommentsPage = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [loadingCommentIds, setLoadingCommentIds] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: post, isLoading: isPostLoading, error: postError } = useQuery<PostWithProfile | null>({
    queryKey: ['post-details', id],
    queryFn: async () => {
      if (!id) return null;
      const post = await getPostWithComments(id);
      return post;
    },
  });

  if (isPostLoading) {
    return (
      <div className="container max-w-3xl mx-auto py-6 px-4">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-2" 
            asChild
          >
            <Link to="/home">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <h1 className="text-xl font-bold">Comments</h1>
        </div>

        <Card className="mb-6 p-4 border border-gaming-700 bg-gaming-800">
          <div className="flex items-center mb-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="ml-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16 mt-1" />
            </div>
          </div>
          <Skeleton className="h-4 w-full mt-2" />
          <Skeleton className="h-4 w-3/4 mt-2" />
          <Skeleton className="h-64 w-full mt-4 rounded-lg" />
        </Card>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 border border-gaming-700 bg-gaming-800">
              <div className="flex">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="ml-2 flex-grow">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-12 w-full mt-2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="container max-w-3xl mx-auto py-6 px-4">
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-4 text-red-700 dark:text-red-400">
          <p>Error loading post: {(postError as Error)?.message || 'Post not found'}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            asChild
          >
            <Link to="/home">Back to Feed</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Group comments by their parent_id
  const commentsByParentId: Record<string, CommentWithProfile[]> = {};
  
  // Initialize with root comments (parent_id is null)
  commentsByParentId['root'] = [];
  
  post.comments.forEach(comment => {
    const parentId = comment.parent_id || 'root';
    if (!commentsByParentId[parentId]) {
      commentsByParentId[parentId] = [];
    }
    commentsByParentId[parentId].push(comment);
  });

  // Sort comments by created_at
  Object.keys(commentsByParentId).forEach(parentId => {
    commentsByParentId[parentId].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  });

  const renderComments = (parentId: string | 'root' = 'root', depth: number = 0) => {
    const comments = commentsByParentId[parentId];
    if (!comments) return null;
    
    return (
      <div className={`space-y-4 ${depth > 0 ? 'ml-6 pl-4 border-l border-gaming-600' : ''}`}>
        {comments.map(comment => (
          <div key={comment.id} className="relative">
            <Card className={`p-4 border border-gaming-700 bg-gaming-800 ${depth === 0 ? 'hover:border-gaming-600 transition-colors' : ''}`}>
              <div className="flex items-start">
                <Link to={`/profile/${comment.profiles.username}`} className="shrink-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={comment.profiles.avatar_url || ''} 
                      alt={comment.profiles.username || 'User'} 
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500 text-white">
                      {comment.profiles.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                
                <div className="ml-3 flex-grow">
                  <div className="flex justify-between items-center">
                    <Link to={`/profile/${comment.profiles.username}`} className="font-medium text-white hover:underline">
                      {comment.profiles.username}
                    </Link>
                    
                    <div className="flex items-center">
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                      
                      {user && comment.user_id === user.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-1">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gaming-800 border-gaming-700">
                            <DropdownMenuItem 
                              className="flex items-center cursor-pointer hover:bg-gaming-700"
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditText(comment.content);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Comment
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="flex items-center cursor-pointer text-red-500 hover:bg-gaming-700 hover:text-red-400"
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this comment?')) {
                                  setLoadingCommentIds(prev => [...prev, comment.id]);
                                  try {
                                    await deleteComment(comment.id);
                                    toast.success('Comment deleted successfully');
                                    
                                    // Refresh post data
                                    queryClient.invalidateQueries({ queryKey: ['post-details', id] });
                                  } catch (error) {
                                    console.error('Error deleting comment:', error);
                                    toast.error('Failed to delete comment');
                                  } finally {
                                    setLoadingCommentIds(prev => prev.filter(id => id !== comment.id));
                                  }
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Comment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                  
                  {editingCommentId === comment.id ? (
                    <div className="mt-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full p-2 bg-gaming-700 border border-gaming-600 rounded-md text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows={3}
                      />
                      <div className="mt-2 flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditText('');
                          }}
                          className="text-sm"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                          disabled={isEditSubmitting || !editText.trim()}
                          onClick={async () => {
                            if (!editText.trim()) return;
                            
                            setIsEditSubmitting(true);
                            try {
                              const { data, error } = await supabase
                                .from('comments')
                                .update({ content: editText })
                                .eq('id', comment.id)
                                .select();
                              
                              if (error) throw error;
                              
                              toast.success('Comment updated successfully');
                              setEditingCommentId(null);
                              setEditText('');
                              
                              // Refresh post data
                              queryClient.invalidateQueries({ queryKey: ['post-details', id] });
                            } catch (error) {
                              console.error('Error updating comment:', error);
                              toast.error('Failed to update comment');
                            } finally {
                              setIsEditSubmitting(false);
                            }
                          }}
                        >
                          {isEditSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-white">{comment.content}</p>
                  )}
                  
                  {loadingCommentIds.includes(comment.id) && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
              </div>
              
              {!editingCommentId && (
                <div className="mt-3 ml-13 flex items-center space-x-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-7 px-2 text-gray-400 hover:text-white"
                    onClick={() => {
                      const commentForm = document.getElementById('comment-form');
                      if (commentForm) {
                        commentForm.scrollIntoView({ behavior: 'smooth' });
                        // Set focus to the input
                        const input = commentForm.querySelector('input');
                        if (input) input.focus();
                      }
                    }}
                  >
                    <MessageCircle className="h-3.5 w-3.5 mr-1" />
                    Reply
                  </Button>
                </div>
              )}
            </Card>
            
            {/* Render replies */}
            {renderComments(comment.id, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({ content: newComment, post_id: post.id, parent_id: null })
        .select();
      
      if (error) throw error;
      
      toast.success('Comment created successfully');
      setNewComment('');
      
      // Refresh post data
      queryClient.invalidateQueries({ queryKey: ['post-details', id] });
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Failed to create comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2" 
          asChild
        >
          <Link to="/home">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Comments</h1>
      </div>

      {/* Post */}
      <Card className="mb-6 p-4 border border-gaming-700 bg-gaming-800">
        <div className="flex items-start mb-4">
          <Link to={`/profile/${post.profiles.username}`}>
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={post.profiles.avatar_url || ''} 
                alt={post.profiles.username || 'User'} 
              />
              <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500 text-white">
                {post.profiles.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="ml-3 flex-grow">
            <Link to={`/profile/${post.profiles.username}`} className="font-medium text-white hover:underline">
              {post.profiles.username}
            </Link>
            <p className="text-sm text-gray-400">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        <p className="mb-4 text-white">{post.content}</p>
        
        {post.image_url && (
          <div className="relative aspect-video mb-4 overflow-hidden rounded-lg">
            <img 
              src={post.image_url} 
              alt="Post" 
              className="object-cover w-full h-full"
            />
          </div>
        )}
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex space-x-4">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Heart className="h-5 w-5 mr-1" />
              <span>{post.likes_count || 0}</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <MessageCircle className="h-5 w-5 mr-1" />
              <span>{post.comments_count || 0}</span>
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Bookmark className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Instagram-style comment input */}
      <div className="fixed bottom-0 left-0 right-0 bg-gaming-900 border-t border-gaming-700">
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
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
              </svg>
            </button>
            <button className="text-orange-500 hover:text-orange-400 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </button>
            <button className="text-yellow-400 hover:text-yellow-300 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
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
                <path d="M21 11h-3.17l2.54-2.54c.39-.39.39-1.02 0-1.41-.39-.39-1.03-.39-1.42 0L15 11h-2V9l3.95-3.95c.39-.39.39-1.03 0-1.42-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.03 0 1.42L11 9v2H9L5.05 7.05c-.39-.39-1.03-.39-1.42 0-.39.39-.39 1.02 0 1.41L6.17 11H3c-.55 0-1 .45-1 1s.45 1 1 1h3.17l-2.54 2.54c-.39.39-.39 1.02 0 1.41.39.39 1.03.39 1.42 0L9 13h2v2l-3.95 3.95c-.39.39-.39 1.03 0 1.42.39.39 1.02.39 1.41 0 .39-.39.39-1.03 0-1.42L13 15v-2h2l3.95-3.95c.39-.39 1.03-.39 1.42 0 .39.39.39 1.02 0 1.41L17.83 13H21c.55 0 1-.45 1-1s-.45-1-1-1z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <form 
          onSubmit={handleCommentSubmit} 
          className="px-4 py-3 flex items-center"
        >
          {user && (
            <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
              <AvatarImage 
                src={user?.user_metadata?.avatar_url || ''} 
                alt={user?.user_metadata?.username || 'User'} 
              />
              <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500 text-white">
                {user?.user_metadata?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          )}
          
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={`Add a comment as ${user?.user_metadata?.username || 'user'}...`}
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-gray-500 py-2 px-3 focus:outline-none focus:ring-0"
            disabled={isSubmitting}
          />
          
          {newComment.trim() && (
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="ml-2 text-blue-400 font-semibold text-sm hover:text-blue-300 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post
            </button>
          )}
        </form>
      </div>

      {/* Add padding to ensure content isn't hidden behind fixed comment input */}
      <div className="pb-36"></div>

      {/* Comments */}
      <div className="space-y-6">
        <h2 className="text-lg font-medium">Comments</h2>
        {post.comments.length > 0 ? (
          renderComments()
        ) : (
          <div className="text-center py-8 bg-gaming-800 border border-gaming-700 rounded-lg">
            <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-400">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentsPage;
