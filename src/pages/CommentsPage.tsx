import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CommentData {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    avatar_url: string | null;
    display_name: string | null;
  };
}

export default function CommentsPage() {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  // Fetch the post details to display context
  const { data: post } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      if (!postId) return null;
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          game_title,
          user_id,
          created_at,
          profiles:user_id (username, avatar_url, display_name)
        `)
        .eq('id', postId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!postId,
  });

  // Fetch existing comments for this post
  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      if (!postId) return [];
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          user_id,
          post_id,
          content,
          created_at,
          profiles (id, username, avatar_url, display_name)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as CommentData[];
    },
    enabled: !!postId,
  });

  // Mutation for adding a new comment
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !postId) throw new Error('Not authenticated or missing post ID');
      
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            post_id: postId,
            user_id: user.id,
            content,
          },
        ])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setNewComment('');
      toast.success('Comment added successfully');
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
    onError: (error) => {
      toast.error('Failed to add comment: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 space-y-6 animate-fade-in">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold">Comments</h1>
      </div>

      {/* Post context (optional) */}
      {post && (
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.profiles?.avatar_url || ''} />
              <AvatarFallback>
                {post.profiles?.username?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{post.profiles?.display_name || post.profiles?.username}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <p className="text-sm line-clamp-2">{post.content}</p>
        </div>
      )}

      {/* Existing comments */}
      <div className="space-y-4 mb-6">
        <h2 className="text-lg font-medium mb-3">
          {comments?.length === 0 
            ? "No comments yet - be the first to comment!" 
            : `${comments?.length || 0} Comments`
          }
        </h2>
        
        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="animate-pulse rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        
        <div className="space-y-3">
          {comments?.map((comment) => (
            <div key={comment.id} className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-4 transition-all hover:bg-card/80">
              <div className="flex space-x-3 mb-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.profiles.avatar_url || ''} />
                  <AvatarFallback>
                    {comment.profiles.username?.substring(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-sm">{comment.profiles.display_name || comment.profiles.username}</p>
                    <time className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </time>
                  </div>
                  <p className="text-sm mt-1">{comment.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comment form */}
      <div className="sticky bottom-0 bg-background pt-2 pb-6">
        {user ? (
          <form onSubmit={handleSubmit} className="flex items-end space-x-2">
            <div className="flex-1">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] resize-none bg-card/50 backdrop-blur-sm border-border"
              />
            </div>
            <Button 
              type="submit" 
              disabled={!newComment.trim() || addCommentMutation.isPending}
              className="h-10 flex items-center"
            >
              {addCommentMutation.isPending ? (
                <div className="animate-spin h-4 w-4 border-2 border-t-transparent rounded-full" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-4 text-center">
            <p className="text-sm mb-2">You must be logged in to comment</p>
            <Button onClick={() => navigate('/login')} size="sm">
              Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
