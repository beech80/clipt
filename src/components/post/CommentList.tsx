import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CommentForm } from './comment/CommentForm';
import { CommentItem, Comment } from './comment/CommentItem';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getComments, getCommentCount } from '@/services/commentService';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface CommentListProps {
  postId: string;
  onCommentAdded?: () => void;
  autoFocus?: boolean;
  className?: string;
}

export const CommentList = ({ 
  postId, 
  onCommentAdded,
  autoFocus = false,
  className = ''
}: CommentListProps) => {
  const { user } = useAuth();
  const normalizedPostId = String(postId);
  const [replyToComment, setReplyToComment] = useState<string | null>(null);

  // Fetch comments for this post
  const {
    data: comments,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['comments', normalizedPostId],
    queryFn: async () => {
      try {
        const response = await getComments(normalizedPostId);
        return response.data || [];
      } catch (err) {
        console.error("Failed to fetch comments:", err);
        return [];
      }
    },
    staleTime: 1000 * 60, // 1 minute
  });

  // Refresh comments when a new comment is added
  const handleCommentAdded = useCallback(() => {
    // Refetch comments
    void refetch();
    
    // Clear reply state if active
    setReplyToComment(null);
    
    // Callback to parent if provided
    if (onCommentAdded) {
      onCommentAdded();
    }
  }, [refetch, onCommentAdded]);

  // Memoize the comment tree
  const commentTree = useMemo(() => {
    const allComments = comments || [];
    
    // Convert flat array to nested tree structure
    const topLevelComments: Comment[] = [];
    const commentMap = new Map<string, Comment>();
    
    // First pass: create a map of id -> comment
    allComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, children: [] });
    });
    
    // Second pass: build the tree
    allComments.forEach(comment => {
      const commentWithChildren = commentMap.get(comment.id)!;
      
      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        // This is a reply, add it to its parent's children
        const parent = commentMap.get(comment.parent_id)!;
        parent.children = [...(parent.children || []), commentWithChildren];
      } else {
        // This is a top-level comment
        topLevelComments.push(commentWithChildren);
      }
    });
    
    return topLevelComments;
  }, [comments]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-6 px-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
        <h3 className="text-lg font-semibold mb-1">Failed to load comments</h3>
        <p className="text-sm text-gray-400 mb-4">Please try again later</p>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => refetch()}
          className="bg-gaming-800 border-gaming-700 hover:bg-gaming-700"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (comments?.length === 0) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex flex-col items-center py-5">
          <MessageCircle className="h-10 w-10 text-gray-500 mb-2" />
          <p className="text-center text-sm text-gray-400">No comments yet. Be the first to comment!</p>
        </div>
        <CommentForm 
          postId={normalizedPostId} 
          onCommentAdded={handleCommentAdded}
          autoFocus={autoFocus}
        />
      </div>
    );
  }

  // Render comment tree
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Comment form at the top */}
      <div className="px-4 pt-4 pb-2">
        <CommentForm 
          postId={normalizedPostId} 
          onCommentAdded={handleCommentAdded}
          autoFocus={autoFocus}
        />
      </div>
      
      {/* Comments list with nested structure */}
      <div className="px-4 divide-y divide-gaming-800">
        {commentTree.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            depth={0}
            onReply={(commentId) => setReplyToComment(commentId)}
            isReplying={replyToComment === comment.id}
            onReplyCancel={() => setReplyToComment(null)}
            onReplyAdded={handleCommentAdded}
          />
        ))}
      </div>
      
      {/* Load more comments button (if needed in the future) */}
      {comments && comments.length > 10 && (
        <div className="px-4 py-2 text-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-blue-400 hover:text-blue-300"
          >
            Load more comments
          </Button>
        </div>
      )}
    </div>
  );
};
