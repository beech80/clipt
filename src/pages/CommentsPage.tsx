import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { CommentList } from '@/components/post/CommentList';
import { Loader2, ArrowLeft, RefreshCw, AlertCircle, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

// Define proper type for post data
interface PostWithProfile {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  likes_count: number;
  comments_count: number;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

/**
 * A dedicated page to view all comments for a specific post
 */
const CommentsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Redirect if no postId is provided
  useEffect(() => {
    if (!id) {
      toast.error('No post selected');
      navigate('/');
    }
  }, [id, navigate]);

  // Fetch post details to display post content
  const { 
    data: post, 
    isLoading: isPostLoading, 
    error: postError 
  } = useQuery<PostWithProfile | null>({
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
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();
        
      if (error) {
        console.error("Error fetching post:", error);
        throw new Error(error.message);
      }
      
      // Make sure we have a valid post with all expected properties
      if (!data || typeof data !== 'object') {
        throw new Error("Post data is invalid");
      }
      
      return data as PostWithProfile;
    },
    enabled: !!id,
  });

  // Handle refreshing comments
  const handleRefresh = () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    window.location.reload();
  };

  // Navigation back to post
  const goBackToPost = () => {
    navigate(`/post/${id}`);
  };

  if (isPostLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gaming-900 p-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-gray-400">Loading comments...</p>
        </div>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gaming-900 p-6">
        <div className="max-w-md text-center">
          <div className="bg-red-500/10 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Post Not Found</h2>
          <p className="text-gray-400 mb-6">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gaming-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gaming-800/95 backdrop-blur-sm border-b border-gaming-700 shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goBackToPost}
            className="text-gray-300 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Post
          </Button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Comments
          </h1>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-gray-300 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Post summary */}
      <div className="container mx-auto px-4 py-4">
        <div className="bg-gaming-800 rounded-lg p-5 mb-6 shadow-lg border border-gaming-700 hover:border-purple-500/30 transition-all duration-300">
          <div className="flex items-start gap-4">
            <a
              href={`/profile/${post?.user_id}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/profile/${post?.user_id}`);
              }}
            >
              <Avatar className="h-12 w-12 rounded-full border-2 border-purple-600/50 hover:border-purple-500/80 transition-all duration-200 shadow-md">
                <AvatarImage
                  src={post?.profiles?.avatar_url || ''}
                  alt={post?.profiles?.username || 'User'}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500">
                  {post?.profiles?.username?.substring(0, 2)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </a>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <a
                  href={`/profile/${post?.user_id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/profile/${post?.user_id}`);
                  }}
                  className="font-semibold text-white text-lg hover:text-purple-400 transition-colors"
                >
                  {post?.profiles?.username || 'Anonymous'}
                </a>
                <span className="text-xs text-gray-400 bg-gaming-700/50 px-2 py-1 rounded-full">
                  {post?.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : ''}
                </span>
              </div>
              <p className="text-gray-300 mb-4 text-base whitespace-pre-wrap break-words leading-relaxed">{post?.content || ''}</p>
              <div className="text-sm text-gray-400 flex items-center gap-6 pt-3 border-t border-gaming-700/50">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-red-500" fill={post?.likes_count ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{post?.likes_count ?? 0} likes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-purple-400" />
                  <span>{post?.comments_count ?? 0} comments</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments section */}
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center">
            <MessageSquare className="mr-2 h-5 w-5 text-purple-400" />
            All Comments
            {post?.comments_count ? (
              <span className="ml-2 px-2.5 py-0.5 bg-purple-600/20 rounded-full text-sm text-purple-300">
                {post.comments_count}
              </span>
            ) : null}
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Join the conversation! Like comments, reply to others, or share your own thoughts on this post.
          </p>
        </div>

        <div className="bg-gaming-800/50 rounded-lg shadow-lg overflow-hidden border border-gaming-700">
          <CommentList 
            postId={id} 
            onCommentAdded={() => {
              // Refresh comments count after adding
              toast.success('Comment added!');
            }} 
            autoFocus={true}
          />
        </div>

        {/* Info box about comment features */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-6">
          <h3 className="text-blue-300 font-medium mb-2 flex items-center">
            <AlertCircle className="mr-2 h-4 w-4" />
            Comment Features
          </h3>
          <ul className="text-sm text-gray-300 space-y-1.5 ml-6 list-disc">
            <li>Like comments by clicking the heart button</li>
            <li>Reply to any comment to start a conversation</li>
            <li>Edit or delete your own comments using the menu (•••)</li>
            <li>View user profiles by clicking their name or avatar</li>
            <li>Send direct messages by clicking the message icon</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CommentsPage;
