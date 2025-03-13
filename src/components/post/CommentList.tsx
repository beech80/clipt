import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, MessageSquare, AlertCircle } from "lucide-react";
import { CommentItem } from "./comment/CommentItem";
import { CommentForm } from "./comment/CommentForm";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  parent_id?: string | null;
  likes_count: number;
  user_id: string;
  replies: Comment[];
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

interface CommentListProps {
  postId: string;
  onBack?: () => void;
  onCommentAdded?: () => void;
  autoFocus?: boolean;
  parentId?: string;
}

export const CommentList = ({ 
  postId, 
  onBack, 
  onCommentAdded,
  autoFocus = false,
  parentId
}: CommentListProps) => {
  // Ensure postId is always a string
  const normalizedPostId = typeof postId === 'string' ? postId : String(postId);
  const formRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [isFetching, setIsFetching] = useState(false);
  const queryClient = useQueryClient();

  // Scroll to comment form if autoFocus is true
  useEffect(() => {
    if (autoFocus && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [autoFocus]);

  // Add logging to see the postId value
  useEffect(() => {
    console.log(`CommentList component mounted with postId: ${normalizedPostId}`);
    
    // Additional check to see the exact type and value
    console.log('PostId type:', typeof normalizedPostId);
    console.log('PostId value:', normalizedPostId);
  }, [normalizedPostId]);

  // Exit early if no postId is provided or if it's invalid
  if (!normalizedPostId) {
    console.error("Empty postId received by CommentList");
    return (
      <div className="bg-[#1A1F2C] min-h-[400px] flex flex-col items-center justify-center">
        <div className="text-center py-6">
          <p className="text-red-500 text-lg">Error: Cannot identify post</p>
          <p className="text-red-500 text-sm mt-2">Please try refreshing the page</p>
          <Button 
            variant="outline" 
            size="sm"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  // Fetch comments for the post
  const { data: comments, isLoading, error, refetch } = useQuery<Comment[]>({
    queryKey: ['comments', normalizedPostId],
    queryFn: async () => {
      try {
        setIsFetching(true);
        
        // Fetch all comments for this post
        const { data: allComments, error } = await supabase
          .from('comments')
          .select(`
            id,
            content,
            created_at,
            updated_at,
            parent_id,
            user_id,
            likes_count,
            profiles:user_id (
              username,
              avatar_url
            )
          `)
          .eq('post_id', normalizedPostId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Organize comments into a tree structure (top-level comments and their replies)
        const commentTree: Comment[] = [];
        const commentMap = new Map<string, Comment>();
        
        // First pass: create all comment objects with empty replies arrays
        allComments.forEach((comment: any) => {
          const commentWithReplies = {
            ...comment,
            replies: [],
          };
          commentMap.set(comment.id, commentWithReplies);
        });
        
        // Second pass: organize into parent-child relationships
        allComments.forEach((comment: any) => {
          const commentWithReplies = commentMap.get(comment.id)!;
          
          if (!comment.parent_id) {
            // This is a top-level comment
            commentTree.push(commentWithReplies);
          } else {
            // This is a reply
            const parentComment = commentMap.get(comment.parent_id);
            if (parentComment) {
              parentComment.replies.push(commentWithReplies);
            } else {
              // Parent comment might have been deleted, so treat as top-level
              commentTree.push(commentWithReplies);
            }
          }
        });
        
        // Sort replies by creation date (oldest first)
        commentTree.forEach(comment => {
          comment.replies.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
        
        return commentTree;
      } catch (error) {
        console.error("Error fetching comments:", error);
        throw new Error('Failed to fetch comments');
      } finally {
        setIsFetching(false);
      }
    }
  });

  const handleCommentAdded = () => {
    refetch();
    if (onCommentAdded) onCommentAdded();
  };

  return (
    <div className="space-y-2">
      {/* Comment form at the top only on the main comment section */}
      {!parentId && user && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gaming-800">
          <CommentForm 
            postId={normalizedPostId} 
            onCommentAdded={() => {
              queryClient.invalidateQueries();
              if (onCommentAdded) onCommentAdded();
            }}
            autoFocus={autoFocus}
          />
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-pulse flex flex-col space-y-4 w-full px-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-gray-200 dark:bg-gaming-800 h-8 w-8"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gaming-800 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gaming-800 rounded w-full"></div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-gray-200 dark:bg-gaming-800 h-8 w-8"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gaming-800 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 dark:bg-gaming-800 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 text-center">
          <p className="text-red-500 text-sm">
            Failed to load comments. Please try again.
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => queryClient.invalidateQueries()}
            className="mt-2 text-xs"
          >
            Retry
          </Button>
        </div>
      )}

      {/* No comments yet */}
      {!isLoading && !error && comments && comments.length === 0 && (
        <div className="px-4 py-6 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No comments yet. Be the first to comment!
          </p>
        </div>
      )}

      {/* Comment list */}
      {!isLoading && !error && comments && comments.length > 0 && (
        <div className="relative">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={normalizedPostId}
              onReplyAdded={() => queryClient.invalidateQueries()}
            />
          ))}
        </div>
      )}
    </div>
  );
};
