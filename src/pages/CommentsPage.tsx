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
import supabase from '@/lib/supabase';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { createComment, deleteComment } from '@/lib/api/comments';

export const CommentsPage = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [loadingCommentIds, setLoadingCommentIds] = useState<string[]>([]);

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

      {/* Add Comment Form */}
      <div className="mb-6" id="comment-form">
        <CommentForm postId={post.id} className="mb-6" />
      </div>

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
