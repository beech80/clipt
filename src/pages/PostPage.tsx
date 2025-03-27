import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BackButton } from '@/components/ui/back-button';
import { MessageSquare, ThumbsUp, Trophy, Share2, Heart, X } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CommentForm } from '@/components/post/comment/CommentForm';

interface PostType {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[] | string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  trophy_count: number;
  is_published: boolean;
  post_type?: string;
  thumbnail_url?: string;
  image_url?: string | null;
  video_url?: string | null;
  profiles: {
    username: string;
    avatar_url: string;
    display_name?: string;
  } | null;
  liked_by_current_user?: boolean;
}

const PostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Fetch current post details
  const { data: currentPost, isLoading: isLoadingCurrentPost } = useQuery({
    queryKey: ['post-details', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          likes_count,
          comments_count,
          trophy_count,
          is_published,
          post_type,
          media_urls,
          thumbnail_url,
          image_url,
          video_url,
          profiles:user_id (
            username,
            avatar_url,
            display_name
          )
        `)
        .eq('id', id)
        .single();
        
      if (error) {
        console.error("Error fetching post:", error);
        return null;
      }

      // Also check if post is liked by current user
      if (user) {
        const { data: likeData } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', id)
          .eq('user_id', user.id)
          .single();
        
        return {
          ...data,
          liked_by_current_user: !!likeData
        };
      }
      
      return {
        ...data,
        liked_by_current_user: false
      };
    },
    enabled: !!id,
  });

  // Fetch other posts from the same user
  const { data: userPosts = [], isLoading: isLoadingUserPosts } = useQuery({
    queryKey: ['user-posts', currentPost?.user_id],
    queryFn: async () => {
      if (!currentPost?.user_id) return [];
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          likes_count,
          comments_count,
          trophy_count,
          is_published,
          post_type,
          media_urls,
          thumbnail_url,
          image_url,
          video_url,
          profiles:user_id (
            username,
            avatar_url,
            display_name
          )
        `)
        .eq('user_id', currentPost.user_id)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) {
        console.error("Error fetching user posts:", error);
        return [];
      }

      // Check which posts are liked by current user
      if (user) {
        const postIds = data.map(post => post.id);
        const { data: likeData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);
        
        const likedPostIds = new Set(likeData?.map(like => like.post_id) || []);
        
        return data.map(post => ({
          ...post,
          liked_by_current_user: likedPostIds.has(post.id)
        }));
      }
      
      return data.map(post => ({
        ...post,
        liked_by_current_user: false
      }));
    },
    enabled: !!currentPost?.user_id,
  });

  // Fetch comments for current post
  const { data: comments = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ['post-comments', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles:user_id (
            username,
            avatar_url,
            display_name
          )
        `)
        .eq('post_id', id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching comments:", error);
        return [];
      }
      
      return data;
    },
    enabled: !!id && showComments,
  });

  // Like post mutation
  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) {
        toast.error("Please sign in to like posts");
        return;
      }
      
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();
      
      if (existingLike) {
        // Unlike - delete the like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);
          
        if (error) throw error;
        
        // Decrement likes count
        const { error: updateError } = await supabase.rpc('decrement_likes_count', { post_id: postId });
        if (updateError) throw updateError;
        
        return { action: 'unliked', postId };
      } else {
        // Like - insert new like
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id });
          
        if (error) throw error;
        
        // Increment likes count
        const { error: updateError } = await supabase.rpc('increment_likes_count', { post_id: postId });
        if (updateError) throw updateError;
        
        return { action: 'liked', postId };
      }
    },
    onSuccess: (result, postId) => {
      // Update query cache
      queryClient.invalidateQueries({ queryKey: ['post-details', postId] });
      queryClient.invalidateQueries({ queryKey: ['user-posts', currentPost?.user_id] });
      
      toast.success(result?.action === 'liked' ? 'Post liked!' : 'Post unliked');
    },
    onError: (error) => {
      console.error("Error liking post:", error);
      toast.error("Failed to like post");
    }
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string, content: string }) => {
      if (!user) {
        toast.error("Please sign in to comment");
        return;
      }
      
      if (!content.trim()) {
        toast.error("Comment cannot be empty");
        return;
      }
      
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim()
        });
        
      if (error) throw error;
      
      // Increment comments count
      const { error: updateError } = await supabase.rpc('increment_comments_count', { post_id: postId });
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      // Reset comment text
      setCommentText('');
      
      // Update query cache
      queryClient.invalidateQueries({ queryKey: ['post-details', id] });
      queryClient.invalidateQueries({ queryKey: ['post-comments', id] });
      
      toast.success('Comment added!');
    },
    onError: (error) => {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  });

  // Function to get media URL from post
  const getMediaUrl = (post: PostType) => {
    try {
      // First try media_urls field
      if (post.media_urls) {
        if (typeof post.media_urls === 'string') {
          try {
            // Try to parse JSON string
            const parsed = JSON.parse(post.media_urls);
            return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : post.media_urls;
          } catch (e) {
            // If parsing fails, use the string directly
            return post.media_urls;
          }
        } else if (Array.isArray(post.media_urls) && post.media_urls.length > 0) {
          return post.media_urls[0];
        }
      }

      // Fallback to other fields if not found
      if (post.thumbnail_url) return post.thumbnail_url;
      else if (post.image_url) return post.image_url;
      else if (post.video_url) return post.video_url;
      
      return null;
    } catch (error) {
      console.error("Error processing media URL:", error);
      return null;
    }
  };

  // Function to render a post
  const renderPost = (post: PostType, isCurrentPost: boolean = false) => {
    if (!post) return null;
    
    const mediaUrl = getMediaUrl(post);
    const formattedDate = post.created_at 
      ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
      : '2 hours ago';
    
    return (
      <div key={post.id} className="bg-black/30 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 shadow-xl mb-4">
        {/* Post Author */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar 
              className="w-10 h-10 rounded-full bg-purple-500 overflow-hidden cursor-pointer"
              onClick={() => navigate(`/profile/${post.user_id}`)}
            >
              {post.profiles?.avatar_url ? (
                <AvatarImage 
                  src={post.profiles.avatar_url}
                  alt={post.profiles.username || 'User'}
                />
              ) : (
                <AvatarFallback className="text-white font-bold">
                  {post.profiles?.username?.substring(0, 1)?.toUpperCase() || 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <p 
                className="font-medium text-white cursor-pointer hover:text-purple-300"
                onClick={() => navigate(`/profile/${post.user_id}`)}
              >
                {post.profiles?.display_name || post.profiles?.username || 'Username'}
              </p>
              <p className="text-xs text-gray-400">
                {formattedDate}
              </p>
            </div>
          </div>
          {isCurrentPost && (
            <button 
              className="text-gray-400 hover:text-gray-300"
              onClick={() => navigate(-1)}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        {/* Post Content */}
        <div className="p-4">
          {post.content && (
            <p className="text-gray-300 mb-4">{post.content}</p>
          )}
          
          {/* Media content */}
          {mediaUrl && (
            <div className="rounded-lg overflow-hidden bg-black/50 aspect-video flex items-center justify-center">
              {(mediaUrl.includes('.mp4') || mediaUrl.includes('.webm')) ? (
                <video 
                  src={mediaUrl}
                  controls
                  className="w-full h-full object-contain max-h-[80vh]"
                  poster={post.thumbnail_url || ''}
                />
              ) : (
                <img 
                  src={mediaUrl} 
                  alt={post.content?.substring(0, 20) || "Post content"} 
                  className="w-full h-full object-contain max-h-[80vh]"
                  onError={(e) => {
                    console.log(`Image load error:`, e);
                    const target = e.target as HTMLImageElement;
                    target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23001133'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%234488cc' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                  }}
                />
              )}
            </div>
          )}
        </div>
        
        {/* Post Actions */}
        <div className="px-4 py-3 bg-black/40 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button 
              className={`flex items-center ${post.liked_by_current_user ? 'text-red-400' : 'text-gray-300'} hover:text-red-400`}
              onClick={() => likeMutation.mutate(post.id)}
            >
              <Heart className={`mr-1 h-5 w-5 ${likeMutation.isPending && likeMutation.variables === post.id ? 'animate-pulse' : ''}`} />
              <span className="text-sm font-semibold">{post.likes_count || 0}</span>
            </button>
            <button 
              className="flex items-center text-gray-300 hover:text-blue-400"
              onClick={() => isCurrentPost && setShowComments(!showComments)}
            >
              <MessageSquare className="mr-1 h-5 w-5" />
              <span className="text-sm font-semibold">{post.comments_count || 0}</span>
            </button>
            <button className="flex items-center text-gray-300 hover:text-yellow-400">
              <Trophy className="mr-1 h-5 w-5" />
              <span className="text-sm font-semibold">{post.trophy_count || 0}</span>
            </button>
          </div>
          <button className="text-gray-300 hover:text-purple-400">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
        
        {/* Comments Section (only for current post) */}
        {isCurrentPost && showComments && (
          <div className="p-4 bg-black/60 border-t border-white/10">
            <h3 className="text-white font-medium mb-4">Comments ({post.comments_count || 0})</h3>
            
            {/* Comment Form */}
            <div className="mb-4">
              <div className="flex items-start gap-2">
                <Avatar className="w-8 h-8 mt-1">
                  {user && (
                    <AvatarImage src={user.user_metadata.avatar_url} />
                  )}
                  <AvatarFallback className="bg-purple-700 text-white">
                    {user?.user_metadata.username?.substring(0, 1)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Add a comment..."
                    className="w-full bg-black/30 border-white/20 text-white resize-none mb-2"
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      disabled={!commentText.trim() || addCommentMutation.isPending}
                      onClick={() => addCommentMutation.mutate({ postId: post.id, content: commentText })}
                      className="bg-purple-700 hover:bg-purple-600 text-white"
                    >
                      {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Comments List */}
            {isLoadingComments ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                {comments.map(comment => (
                  <div key={comment.id} className="flex items-start gap-2 pb-3 border-b border-white/5">
                    <Avatar className="w-8 h-8 mt-1">
                      {comment.profiles?.avatar_url ? (
                        <AvatarImage 
                          src={comment.profiles.avatar_url}
                          alt={comment.profiles.username || 'User'} 
                        />
                      ) : (
                        <AvatarFallback className="bg-purple-700 text-white">
                          {comment.profiles?.username?.substring(0, 1)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-purple-300">
                          {comment.profiles?.display_name || comment.profiles?.username || 'Username'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400">
                <p>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const isLoading = isLoadingCurrentPost || (currentPost && isLoadingUserPosts);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
      </div>
    );
  }

  // Error state
  if (!currentPost) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c] flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-white mb-4">Post Not Found</h2>
        <p className="text-gray-300 mb-6">The post you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate(-1)} className="bg-purple-600 hover:bg-purple-700">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c]">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <BackButton />
          <h1 className="text-xl font-bold text-white">Post</h1>
          <div className="w-10"></div> {/* Empty div for flex spacing */}
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-32 max-w-2xl">
        {/* Current Post */}
        {renderPost(currentPost, true)}
        
        {/* Other Posts from Same User */}
        {userPosts.length > 1 && (
          <>
            <h2 className="text-xl font-semibold text-white mb-4 mt-8">
              More from {currentPost.profiles?.display_name || currentPost.profiles?.username || 'this user'}
            </h2>
            
            {userPosts
              .filter(post => post.id !== currentPost.id)
              .map(post => renderPost(post))}
          </>
        )}
      </div>
    </div>
  );
};

export default PostPage;
