
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Send, ChevronDown, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import '../components/comments/comment-modal.css';

interface CommentData {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  parent_id?: string | null;
  likes_count?: number;
  liked_by_user?: boolean;
  profiles: {
    id: string;
    username: string;
    avatar_url: string | null;
    display_name: string | null;
  };
  replies?: CommentData[];
}

export default function CommentsPage() {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

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
  const { data: comments = [], isLoading } = useQuery({
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
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Check which comments the user has liked
      if (user) {
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id);
          
        const likedCommentIds = new Set((likes || []).map(like => like.comment_id));
        
        return data.map(comment => ({
          ...comment,
          liked_by_user: likedCommentIds.has(comment.id)
        }));
      }
      
      return data;
    },
    enabled: !!postId,
  });

  // Organize comments into threaded structure
  const organizedComments = () => {
    if (!comments) return [];
    
    const commentMap = new Map<string, CommentData>();
    const topLevelComments: CommentData[] = [];
    
    // First, add all comments to the map
    comments.forEach(comment => {
      commentMap.set(comment.id, {...comment, replies: []});
    });
    
    // Then organize into parent/child relationships
    comments.forEach(comment => {
      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        // This is a reply, add to parent's replies array
        const parent = commentMap.get(comment.parent_id);
        if (parent && parent.replies) {
          parent.replies.push(commentMap.get(comment.id) as CommentData);
        }
      } else {
        // This is a top-level comment
        topLevelComments.push(commentMap.get(comment.id) as CommentData);
      }
    });
    
    return topLevelComments;
  };
  
  const threadedComments = organizedComments();

  // Mutation for adding a new comment
  const addCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string, parentId?: string }) => {
      if (!user || !postId) throw new Error('Not authenticated or missing post ID');
      
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            post_id: postId,
            user_id: user.id,
            content,
            parent_id: parentId || null
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

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ commentId, isLiked }: { commentId: string, isLiked: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      
      if (isLiked) {
        // Unlike the comment
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('comment_id', commentId);
          
        if (error) throw error;
      } else {
        // Like the comment
        const { error } = await supabase
          .from('comment_likes')
          .insert([
            {
              comment_id: commentId,
              user_id: user.id
            }
          ]);
          
        if (error) throw error;
      }
      
      return { commentId, isLiked: !isLiked };
    },
    onSuccess: (result) => {
      // Update the comments data in the cache
      queryClient.setQueryData(['comments', postId], (oldData: CommentData[] | undefined) => {
        if (!oldData) return [];
        
        return oldData.map(comment => {
          if (comment.id === result.commentId) {
            return {
              ...comment,
              likes_count: result.isLiked 
                ? (comment.likes_count || 0) + 1 
                : Math.max(0, (comment.likes_count || 0) - 1),
              liked_by_user: result.isLiked
            };
          }
          return comment;
        });
      });
    },
    onError: (error) => {
      toast.error('Failed to update like: ' + error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate({ content: newComment, parentId });
  };

  const handleLike = (commentId: string, isLiked: boolean) => {
    if (!user) {
      toast.error('Please sign in to like comments');
      return;
    }
    toggleLikeMutation.mutate({ commentId, isLiked });
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    setNewComment(prev => prev + emoji);
    inputRef.current?.focus();
  };
  
  const toggleReplies = (commentId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // Format like "5d" for Instagram-style dates
  const formatShortDate = (date: string) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'now';
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h`;
    } else if (diffInSeconds < 604800) {
      return `${Math.floor(diffInSeconds / 86400)}d`;
    } else if (diffInSeconds < 2592000) {
      return `${Math.floor(diffInSeconds / 604800)}w`;
    } else {
      return `${Math.floor(diffInSeconds / 2592000)}mo`;
    }
  };

  const handleReply = (username: string) => {
    setNewComment(`@${username} `);
    inputRef.current?.focus();
  };

  return (
    <div className="instagram-comments min-h-screen flex flex-col">
      {/* Header */}
      <div className="comment-header sticky top-0 z-10 bg-white">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="title">Comments</h1>
        <button className="direct-button">
          <MessageSquare className="h-6 w-6" />
        </button>
      </div>

      {/* Original post context */}
      {post && (
        <div className="post-author">
          <Avatar className="avatar">
            <AvatarImage src={post.profiles?.avatar_url || ''} />
            <AvatarFallback>
              {post.profiles?.username?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center">
              <span className="username">{post.profiles?.username}</span>
              <span className="verified">✓</span>
              <span className="post-content">{post.content}</span>
            </div>
            <div className="comment-meta">
              <span className="comment-time">{formatShortDate(post.created_at)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Comments list */}
      <div className="comment-list flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : threadedComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <MessageSquare className="h-10 w-10 mb-2 opacity-40" />
            <p>No comments yet</p>
            <p className="text-sm">Be the first to comment</p>
          </div>
        ) : (
          threadedComments.map(comment => (
            <div key={comment.id} className="comment-thread">
              <div className="comment-item">
                <Avatar className="comment-avatar">
                  <AvatarImage src={comment.profiles?.avatar_url || ''} />
                  <AvatarFallback>
                    {comment.profiles?.username?.substring(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="comment-content">
                  <div>
                    <span className="comment-user">{comment.profiles?.username}</span>
                    {post && comment.profiles?.username === post.profiles?.username && (
                      <span className="verified-badge">✓</span>
                    )}
                    <span className="comment-text"> {comment.content}</span>
                  </div>
                  <div className="comment-meta">
                    <span className="comment-time">{formatShortDate(comment.created_at)}</span>
                    {comment.likes_count && comment.likes_count > 0 && (
                      <span className="comment-likes">{comment.likes_count} likes</span>
                    )}
                    <button onClick={() => handleReply(comment.profiles.username)}>Reply</button>
                  </div>
                </div>
                <button 
                  className="like-button"
                  onClick={() => handleLike(comment.id, !!comment.liked_by_user)}
                >
                  <Heart 
                    className="h-4 w-4" 
                    fill={comment.liked_by_user ? "currentColor" : "none"}
                    color={comment.liked_by_user ? "#ed4956" : "#8e8e8e"}
                  />
                </button>
              </div>
              
              {/* Comment replies */}
              {comment.replies && comment.replies.length > 0 && (
                <>
                  <div 
                    className="replies-toggle"
                    onClick={() => toggleReplies(comment.id)}
                  >
                    <div className="line"></div>
                    {expandedComments[comment.id] 
                      ? `Hide replies` 
                      : `View replies (${comment.replies.length})`}
                  </div>
                  
                  {expandedComments[comment.id] && (
                    <div className="reply-list">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="comment-item">
                          <Avatar className="comment-avatar">
                            <AvatarImage src={reply.profiles?.avatar_url || ''} />
                            <AvatarFallback>
                              {reply.profiles?.username?.substring(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="comment-content">
                            <div>
                              <span className="comment-user">{reply.profiles?.username}</span>
                              {post && reply.profiles?.username === post.profiles?.username && (
                                <span className="verified-badge">✓</span>
                              )}
                              <span className="comment-text"> {reply.content}</span>
                            </div>
                            <div className="comment-meta">
                              <span className="comment-time">{formatShortDate(reply.created_at)}</span>
                              {reply.likes_count && reply.likes_count > 0 && (
                                <span className="comment-likes">{reply.likes_count} likes</span>
                              )}
                              <button onClick={() => handleReply(reply.profiles.username)}>Reply</button>
                            </div>
                          </div>
                          <button 
                            className="like-button"
                            onClick={() => handleLike(reply.id, !!reply.liked_by_user)}
                          >
                            <Heart 
                              className="h-4 w-4" 
                              fill={reply.liked_by_user ? "currentColor" : "none"}
                              color={reply.liked_by_user ? "#ed4956" : "#8e8e8e"}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Emoji reaction bar */}
      <div className="emoji-bar">
        <button className="emoji-button" onClick={() => handleEmojiSelect('❤️')}>❤️</button>
        <button className="emoji-button" onClick={() => handleEmojiSelect('👏')}>👏</button>
        <button className="emoji-button" onClick={() => handleEmojiSelect('🔥')}>🔥</button>
        <button className="emoji-button" onClick={() => handleEmojiSelect('👍')}>👍</button>
        <button className="emoji-button" onClick={() => handleEmojiSelect('😢')}>😢</button>
        <button className="emoji-button" onClick={() => handleEmojiSelect('😍')}>😍</button>
        <button className="emoji-button" onClick={() => handleEmojiSelect('😮')}>😮</button>
        <button className="emoji-button" onClick={() => handleEmojiSelect('😂')}>😂</button>
      </div>

      {/* Comment input */}
      <div className="comment-input-container sticky bottom-0">
        <Avatar className="comment-user-avatar">
          <AvatarImage src={user?.user_metadata?.avatar_url || ''} />
          <AvatarFallback>
            {user?.user_metadata?.name?.substring(0, 2)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <form 
          className="comment-input-wrapper flex-1"
          onSubmit={handleSubmit}
        >
          <input
            ref={inputRef}
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={`Add a comment as ${user?.user_metadata?.username || user?.email || 'you'}...`}
            className="comment-input"
          />
          <button 
            type="submit" 
            className={`post-button ${newComment.trim() ? 'active' : ''}`}
            disabled={!newComment.trim() || addCommentMutation.isPending}
          >
            {addCommentMutation.isPending ? 'Posting...' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
}
