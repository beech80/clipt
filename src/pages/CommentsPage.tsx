import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ChevronLeft, MessageCircle, Heart, Share2, Bookmark, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getPostWithComments } from '@/lib/api/posts';
import { CommentForm } from '@/components/post/comment/CommentForm';
import { CommentItem } from '@/components/post/comment/CommentItem';
import { PostWithProfile, CommentWithProfile } from '@/types/post';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const CommentsPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  const { data: post, isLoading: isPostLoading, error: postError } = useQuery<PostWithProfile | null>({
    queryKey: ['post-details', postId],
    queryFn: async () => {
      if (!postId) return null;
      const post = await getPostWithComments(postId);
      return post;
    },
    enabled: !!postId,
    // Fetch comments again every time we revisit this page
    refetchOnWindowFocus: true
  });

  // Handle invalidating queries when a new comment is added
  const refreshComments = () => {
    queryClient.invalidateQueries({ queryKey: ['post-details', postId] });
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleReplyComplete = () => {
    setReplyingToId(null);
    refreshComments();
  };

  const organizeComments = (comments: CommentWithProfile[] = []) => {
    if (!comments || comments.length === 0) return [];
    
    const commentMap = new Map();
    const topLevelComments: CommentWithProfile[] = [];

    // First pass: Create a map of all comments
    comments.forEach(comment => {
      comment.children = [];
      commentMap.set(comment.id, comment);
    });

    // Second pass: Organize comments into a tree structure
    comments.forEach(comment => {
      if (comment.parent_id) {
        const parentComment = commentMap.get(comment.parent_id);
        if (parentComment) {
          parentComment.children.push(comment);
        } else {
          // If parent doesn't exist (should be rare), treat as top-level
          topLevelComments.push(comment);
        }
      } else {
        topLevelComments.push(comment);
      }
    });

    // Sort top-level comments by creation date (newest first)
    return topLevelComments.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  if (isPostLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2"
            onClick={handleBackClick}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Comments</h1>
        </div>
        
        <Card className="mb-6 p-4 border border-gaming-700 bg-gaming-800">
          <div className="flex items-start mb-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="ml-3 flex-grow">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          <div className="flex justify-between">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </Card>
        
        <div className="space-y-6">
          <Skeleton className="h-4 w-28 mb-4" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2"
            onClick={handleBackClick}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Comments</h1>
        </div>
        
        <div className="text-center py-8 bg-gaming-800 border border-gaming-700 rounded-lg">
          <p className="text-red-400">Error loading post or comments. Please try again later.</p>
          <Button 
            variant="default" 
            className="mt-4"
            onClick={() => navigate(`/post/${postId}`)}
          >
            Return to Post
          </Button>
        </div>
      </div>
    );
  }

  const organizedComments = organizeComments(post.comments || []);
  
  console.log('Post with comments:', post);
  console.log('Organized comments:', organizedComments);

  return (
    <div className="comments-page-container">
      <div className="comments-header">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2"
          onClick={handleBackClick}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Comments</h1>
      </div>

      {/* Post */}
      <div className="comments-content custom-scrollbar">
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
                <span>{post.comments?.length || 0}</span>
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

        {/* Comments */}
        {organizedComments.length > 0 ? (
          <div className="space-y-4">
            {organizedComments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={() => setReplyingToId(comment.id)} 
                isReplying={replyingToId === comment.id}
                onReplyCancel={() => setReplyingToId(null)}
                onReplyAdded={handleReplyComplete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-[#1e1f2e] border border-[#3b3d4d] rounded-lg">
            <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-400">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>

      {/* Comment Form at bottom */}
      <div className="comments-input">
        <CommentForm 
          postId={postId as string}
          onReplyComplete={refreshComments}
        />
      </div>
    </div>
  );
};

export default CommentsPage;
