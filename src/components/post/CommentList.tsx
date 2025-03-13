import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CommentForm } from './comment/CommentForm';
import { CommentItem, Comment } from './comment/CommentItem';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle, AlertCircle, Heart, Hand, Flame, ThumbsUp, Smile } from 'lucide-react';
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
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const { user } = useAuth();

  // Normalized post ID (always string)
  const normalizedPostId = typeof postId === 'string' ? postId : String(postId);

  console.log('CommentList rendering for postId:', normalizedPostId);

  // Query comments for the post
  const { data: comments, isLoading, error, refetch } = useQuery({
    queryKey: ['comments', normalizedPostId],
    queryFn: async () => {
      console.log('Fetching comments for post:', normalizedPostId);
      const result = await getComments(normalizedPostId);
      console.log('Comments result:', result);
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
    
    console.log('Organizing comments:', comments.length);
    
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
      <div className="py-4 text-center text-gaming-100">
        <Loader2 className="w-5 h-5 mx-auto animate-spin text-blue-500" />
        <p className="text-sm text-gray-500 mt-2">Loading comments...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    console.error('Error loading comments:', error);
    return (
      <div className="py-4 text-center text-red-500">
        <AlertCircle className="w-5 h-5 mx-auto" />
        <p className="text-sm mt-2">Failed to load comments</p>
      </div>
    );
  }

  console.log('Rendering comments UI, comment count:', organizedComments.length);

  return (
    <div 
      className={`w-full ${className}`}
      ref={commentsContainerRef}
    >
      <div className="py-2 px-3 border-b border-gaming-800">
        <h3 className="font-semibold text-center text-gaming-100">Comments</h3>
      </div>
      
      {/* Comment input form */}
      <div className="px-4 py-3 border-b border-gaming-800">
        <CommentForm 
          postId={normalizedPostId}
          onReplyComplete={handleCommentAdded}
          autoFocus={autoFocus}
        />
      </div>

      {/* Comments list */}
      <div className="divide-y divide-gaming-800/30">
        {organizedComments && organizedComments.length > 0 ? (
          organizedComments.map(comment => (
            <div key={comment.id} className="px-4">
              <CommentItem 
                comment={comment} 
                onReply={handleReplyClick}
                isReplying={replyToCommentId === comment.id}
                onReplyCancel={() => setReplyToCommentId(null)}
                onReplyAdded={handleCommentAdded}
              />
              
              {/* Reply form */}
              {replyToCommentId === comment.id && (
                <div id={`reply-${comment.id}`} className="ml-11 mb-3">
                  <CommentForm 
                    postId={normalizedPostId}
                    parentId={comment.id}
                    onReplyComplete={handleCommentAdded}
                    onCancel={() => setReplyToCommentId(null)}
                    placeholder={`Reply to ${comment.profiles?.username || 'User'}...`}
                    buttonText="Reply"
                  />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>

      {/* Instagram-style emoji reactions at bottom */}
      <div className="pt-3 pb-2 px-4 border-t border-gaming-800 flex items-center justify-between">
        <div className="flex space-x-6">
          <button 
            className={`text-2xl ${selectedEmoji === '❤️' ? 'text-red-500' : 'text-gaming-400 hover:text-gaming-300'}`}
            onClick={() => handleEmojiSelect('❤️')}
          >
            ❤️
          </button>
          <button 
            className={`text-2xl ${selectedEmoji === '🙌' ? 'text-yellow-500' : 'text-gaming-400 hover:text-gaming-300'}`}
            onClick={() => handleEmojiSelect('🙌')}
          >
            🙌
          </button>
          <button 
            className={`text-2xl ${selectedEmoji === '🔥' ? 'text-orange-500' : 'text-gaming-400 hover:text-gaming-300'}`}
            onClick={() => handleEmojiSelect('🔥')}
          >
            🔥
          </button>
          <button 
            className={`text-2xl ${selectedEmoji === '👏' ? 'text-yellow-500' : 'text-gaming-400 hover:text-gaming-300'}`}
            onClick={() => handleEmojiSelect('👏')}
          >
            👏
          </button>
          <button 
            className={`text-2xl ${selectedEmoji === '😊' ? 'text-yellow-500' : 'text-gaming-400 hover:text-gaming-300'}`}
            onClick={() => handleEmojiSelect('😊')}
          >
            😊
          </button>
          <button 
            className={`text-2xl ${selectedEmoji === '😂' ? 'text-yellow-500' : 'text-gaming-400 hover:text-gaming-300'}`}
            onClick={() => handleEmojiSelect('😂')}
          >
            😂
          </button>
          <button 
            className={`text-2xl ${selectedEmoji === '😮' ? 'text-yellow-500' : 'text-gaming-400 hover:text-gaming-300'}`}
            onClick={() => handleEmojiSelect('😮')}
          >
            😮
          </button>
          <button 
            className={`text-2xl ${selectedEmoji === '😢' ? 'text-blue-500' : 'text-gaming-400 hover:text-gaming-300'}`}
            onClick={() => handleEmojiSelect('😢')}
          >
            😢
          </button>
        </div>
      </div>
    </div>
  );
};
