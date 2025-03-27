import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CommentItem, Comment } from './comment/CommentItem';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getComments, getCommentCount } from '@/services/commentService';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface CommentListProps {
  postId: string;
  onCommentAdded?: () => void;
  autoFocus?: boolean;
  className?: string;
  onBack?: () => void;
}

export const CommentList = ({ 
  postId, 
  onCommentAdded,
  autoFocus = false,
  className = '',
  onBack
}: CommentListProps) => {
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const { user } = useAuth();

  // Normalized post ID (always string)
  const normalizedPostId = typeof postId === 'string' ? postId : String(postId);

  // Query comments for the post
  const { data: comments, isLoading, error, refetch } = useQuery({
    queryKey: ['comments', normalizedPostId],
    queryFn: async () => {
      const result = await getComments(normalizedPostId);
      return result.data || [];
    },
    enabled: !!normalizedPostId,
    staleTime: 10000, // 10 seconds
  });

  // Get comment count
  const { data: commentCount = 0 } = useQuery({
    queryKey: ['comments-count', normalizedPostId],
    queryFn: () => getCommentCount(normalizedPostId),
    enabled: !!normalizedPostId,
    staleTime: 10000,
  });

  // Handle adding a new comment or reply
  const handleCommentAdded = useCallback(() => {
    refetch();
    if (onCommentAdded) {
      onCommentAdded();
    }
    setReplyToCommentId(null);
  }, [refetch, onCommentAdded]);

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

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    // Here you would typically send the emoji reaction to the backend
    toast.success(`Reacted with ${emoji}`);
  };

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
  if (error) {
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
      className={`w-full ${className}`}
      ref={commentsContainerRef}
    >
      {/* Comments Header */}
      <div className="flex items-center justify-between py-3 px-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Comments</h3>
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

      <Separator className="my-1" />

      {/* Comments list */}
      <div className="px-4 pt-2 pb-4 space-y-4">
        {organizedComments && organizedComments.length > 0 ? (
          organizedComments.map(comment => (
            <div key={comment.id} className="py-1">
              <CommentItem 
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
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Be the first to share your thoughts!</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick reaction buttons */}
      {organizedComments && organizedComments.length > 0 && (
        <>
          <Separator />
          <div className="px-4 py-3 flex items-center justify-center">
            <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-full p-1">
              {['❤️', '👍', '🔥', '👏', '😂'].map(emoji => (
                <button 
                  key={emoji}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    selectedEmoji === emoji 
                      ? 'bg-white dark:bg-gray-700 shadow-sm transform scale-110' 
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => handleEmojiSelect(emoji)}
                >
                  <span className="text-lg">{emoji}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
