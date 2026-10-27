import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CommentForm } from './comment/CommentForm';
import { CommentItem, Comment } from './comment/CommentItem';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getComments, getCommentCount, type CommentRecord } from '@/services/commentService';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface CommentListProps {
  postId: string;
  onCommentAdded?: () => void;
  onBack?: () => void;
  autoFocus?: boolean;
  className?: string;
  bottomComposer?: boolean;
  hideReactions?: boolean;
}

export const CommentList = ({ 
  postId, 
  onCommentAdded,
  onBack,
  autoFocus = false,
  className = '',
  bottomComposer = false
}: CommentListProps) => {
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Normalized post ID (always string)
  const normalizedPostId = typeof postId === 'string' ? postId : String(postId);

  // Query comments for the post
  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError } = useInfiniteQuery({
    queryKey: ['comments', normalizedPostId, user?.id, 'paged'],
    initialPageParam: undefined as Pick<CommentRecord,'id'|'created_at'> | undefined,
    queryFn: async ({pageParam}) => {
      const result = await getComments(normalizedPostId,0,50,pageParam);
      if (result.error) throw result.error;
      return result.data || [];
    },
    getNextPageParam:last=>last.length===50?last[last.length-1]:undefined,
    retry:false,
    enabled: !!normalizedPostId,
    staleTime: 10000, // 10 seconds
  });
  const comments=useMemo(()=>[...new Map((data?.pages.flat()??[]).map(comment=>[comment.id,comment])).values()],[data]);

  // Get comment count
  const { data: commentCount = 0 } = useQuery({
    queryKey: ['comments-count', normalizedPostId, user?.id],
    queryFn: () => getCommentCount(normalizedPostId),
    enabled: !!normalizedPostId,
    staleTime: 10000,
  });

  // Handle adding a new comment or reply
  const handleCommentAdded = useCallback(async () => {
    await Promise.all([refetch(), queryClient.invalidateQueries({ queryKey: ['comments-count', normalizedPostId] })]);
    if (onCommentAdded) {
      onCommentAdded();
    }
    setReplyToCommentId(null);
  }, [refetch, onCommentAdded, queryClient, normalizedPostId]);

  // Handle clicks on reply button
  const handleReplyClick = useCallback((commentId: string) => {
    setReplyToCommentId(commentId);
    
    // Scroll to the reply form after a short delay
    setTimeout(() => {
      const replyElement = document.getElementById(`reply-${commentId}`);
      if (replyElement) {
        replyElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, []);

  // Organize comments into threaded view
  const organizedComments = useMemo(() => {
    if (!comments || !Array.isArray(comments)) return [];
    
    // Create a map of comments by ID for quick lookup
    const commentMap = new Map<string, Comment>();
    const topLevelComments: Comment[] = [];
    
    // First pass - add all comments to the map
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, children: [] });
    });
    
    // Second pass - organize into parent-child relationships
    comments.forEach(comment => {
      const currentComment = commentMap.get(comment.id);
      if (!currentComment) return;
      
      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        // This is a reply - add to parent's children
        const parentComment = commentMap.get(comment.parent_id);
        if (parentComment && parentComment.children) {
          parentComment.children.push(currentComment);
        }
      } else {
        // This is a top-level comment
        topLevelComments.push(currentComment);
      }
    });
    
    // Sort top level comments by created_at (newest first)
    return topLevelComments.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [comments]);

  // Loading state
  if (isLoading) {
    return (
      <div className="py-6 text-center">
        <Loader2 className="w-6 h-6 mx-auto animate-spin text-blue-500" />
        <p className="text-sm text-gray-500 mt-2">Loading comments...</p>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    console.error('Error loading comments:', error);
    return (
      <div className="py-6 text-center">
        <AlertCircle className="w-6 h-6 mx-auto text-red-500" />
        <p className="text-sm text-red-500 mt-2">Failed to load comments</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2" 
          onClick={() => refetch()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div 
      className={`w-full ${bottomComposer ? 'flex flex-col' : ''} ${className}`}
      ref={commentsContainerRef}
    >
      {/* Comments Header */}
      {onBack && <Button variant="ghost" onClick={onBack}>Back to post</Button>}
      <div className="flex items-center justify-between py-3 px-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-violet-50">Comments</h3>
          {commentCount > 0 && (
            <Badge variant="secondary" className="rounded-full">
              {commentCount}
            </Badge>
          )}
        </div>
        {commentCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs"
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        )}
      </div>
      
      {/* Comment input form */}
      <div className={bottomComposer ? "order-last px-4 py-3 border-t border-violet-400/20" : "px-4 py-3"}>
        <CommentForm 
          postId={normalizedPostId}
          onReplyComplete={handleCommentAdded}
          autoFocus={autoFocus}
          placeholder="Add a comment..."
        />
      </div>

      <Separator className="my-1" />

      {/* Comments list */}
      <div className="clipt-comment-history px-4 pt-2 pb-4 space-y-4">
        {organizedComments && organizedComments.length > 0 ? (
          organizedComments.map(comment => (
            <div key={comment.id} className="py-1">
              <CommentItem 
                postId={normalizedPostId}
                replyingId={replyToCommentId}
                comment={comment} 
                onReply={handleReplyClick}
                isReplying={replyToCommentId === comment.id}
                onReplyCancel={() => setReplyToCommentId(null)}
                onReplyAdded={handleCommentAdded}
              />
            </div>
          ))
        ) : (
          <div className="py-8 text-center">
            <div className="bg-[#19152b] rounded-xl p-6">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Be the first to share your thoughts!</p>
            </div>
          </div>
        )}
      </div>
      <div className="px-4 pb-4 space-y-2">
        {isFetchNextPageError && <p role="alert">Older comments could not be loaded. Your current comments are unchanged.</p>}
        {hasNextPage && <Button variant="outline" disabled={isFetchingNextPage} onClick={()=>void fetchNextPage()}>{isFetchingNextPage?'Loading older comments…':isFetchNextPageError?'Retry older comments':'Load older comments'}</Button>}
        {error && data && !isFetchNextPageError && <div role="alert"><p>Comments could not be refreshed.</p><Button variant="outline" onClick={()=>void refetch()}>Retry refresh</Button></div>}
      </div>
    </div>
  );
};
