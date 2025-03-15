
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Send, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDate } from '@/lib/utils';

interface CommentData {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  parent_id?: string | null;
  likes_count?: number;
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
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

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
          parent_id,
          created_at,
          likes_count,
          profiles (id, username, avatar_url, display_name)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CommentData[];
    },
    enabled: !!postId,
  });

  // Organize comments into threads
  const organizedComments = () => {
    if (!comments) return [];
    
    // Create a map for quick parent lookup
    const commentMap = new Map();
    const topLevelComments: CommentData[] = [];
    
    // First pass - add all comments to the map
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });
    
    // Second pass - organize into parent/child
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id);
      
      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        // This is a reply - add to parent
        const parent = commentMap.get(comment.parent_id);
        parent.replies = parent.replies || [];
        parent.replies.push(commentWithReplies);
      } else {
        // This is a top-level comment
        topLevelComments.push(commentWithReplies);
      }
    });
    
    return topLevelComments;
  };

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
      toast.success('Comment added');
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

  const handleLike = (commentId: string) => {
    // You would implement the like functionality here
    toast('Liked comment');
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    setNewComment(prev => prev + emoji);
    inputRef.current?.focus();
  };

  // Format like "5d" for Instagram-style dates
  const formatShortDate = (date: string) => {
    const days = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    
    if (days < 1) {
      return 'today';
    } else if (days === 1) {
      return '1d';
    } else if (days < 7) {
      return `${days}d`;
    } else if (days < 30) {
      return `${Math.floor(days / 7)}w`;
    } else if (days < 365) {
      return `${Math.floor(days / 30)}m`;
    } else {
      return `${Math.floor(days / 365)}y`;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b flex justify-between items-center px-4 py-2 sticky top-0 bg-background z-10">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Comments</h1>
        </div>
        <Button variant="ghost" size="icon">
          <Filter className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Original post context */}
        {post && (
          <div className="border-b p-4">
            <div className="flex items-start mb-2">
              <Avatar className="h-8 w-8 mr-3">
                <AvatarImage src={post.profiles?.avatar_url || ''} />
                <AvatarFallback>
                  {post.profiles?.username?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center">
                  <span className="font-medium text-sm mr-1">
                    {post.profiles?.username}
                  </span>
                  <span className="text-blue-500">
                    ✓
                  </span>
                </div>
                <p className="text-sm">{post.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatShortDate(post.created_at)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Comments list */}
        <div className="divide-y">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : comments?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>No comments yet</p>
              <p className="text-sm">Be the first to comment</p>
            </div>
          ) : (
            // Main comments list - Instagram style
            comments?.map((comment) => (
              <div key={comment.id} className="p-4">
                <div className="flex">
                  <Avatar className="h-8 w-8 mr-3 flex-shrink-0">
                    <AvatarImage src={comment.profiles?.avatar_url || ''} />
                    <AvatarFallback>
                      {comment.profiles?.username?.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <span className="font-semibold text-sm mr-1">
                            {comment.profiles?.username}
                          </span>
                          {comment.profiles?.username === post?.profiles?.username && (
                            <span className="text-blue-500">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-sm">{comment.content}</p>
                        <div className="flex items-center mt-1 space-x-3 text-xs text-muted-foreground">
                          <span>{formatShortDate(comment.created_at)}</span>
                          {comment.likes_count && comment.likes_count > 0 && (
                            <span>{comment.likes_count} likes</span>
                          )}
                          <button className="font-medium">Reply</button>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleLike(comment.id)}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Heart className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Show replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-2 ml-5 border-l-2 border-muted pl-3 space-y-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage src={reply.profiles?.avatar_url || ''} />
                              <AvatarFallback>
                                {reply.profiles?.username?.substring(0, 2).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-semibold text-xs mr-1">
                                    {reply.profiles?.username}
                                  </span>
                                  <p className="text-xs">{reply.content}</p>
                                  <div className="flex items-center mt-1 space-x-2 text-xs text-muted-foreground">
                                    <span>{formatShortDate(reply.created_at)}</span>
                                    <button className="font-medium">Reply</button>
                                  </div>
                                </div>
                                <button className="text-muted-foreground hover:text-primary">
                                  <Heart className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Emoji reaction bar */}
      <div className="border-t px-4 py-2 flex justify-between">
        <div className="flex space-x-4">
          <button onClick={() => handleEmojiSelect('❤️')} className="text-xl">❤️</button>
          <button onClick={() => handleEmojiSelect('👏')} className="text-xl">👏</button>
          <button onClick={() => handleEmojiSelect('🔥')} className="text-xl">🔥</button>
          <button onClick={() => handleEmojiSelect('👍')} className="text-xl">👍</button>
          <button onClick={() => handleEmojiSelect('😢')} className="text-xl">😢</button>
          <button onClick={() => handleEmojiSelect('😍')} className="text-xl">😍</button>
          <button onClick={() => handleEmojiSelect('😮')} className="text-xl">😮</button>
          <button onClick={() => handleEmojiSelect('😂')} className="text-xl">😂</button>
        </div>
      </div>

      {/* Comment input */}
      <div className="border-t p-3 sticky bottom-0 bg-background">
        <form onSubmit={handleSubmit} className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src={user?.user_metadata?.avatar_url || ''} />
            <AvatarFallback>
              {user?.user_metadata?.name?.substring(0, 2)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 bg-muted rounded-full px-4 py-2 flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={`Add a comment as ${user?.user_metadata?.username || user?.email || 'you'}...`}
              className="bg-transparent outline-none w-full text-sm"
            />
          </div>
          <Button 
            type="submit" 
            disabled={!newComment.trim() || addCommentMutation.isPending}
            size="sm"
            variant="ghost"
            className="ml-2"
          >
            {addCommentMutation.isPending ? (
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
