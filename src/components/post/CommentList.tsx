import { useQuery } from "@tanstack/react-query";
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
}

export const CommentList = ({ 
  postId, 
  onBack, 
  onCommentAdded,
  autoFocus = false 
}: CommentListProps) => {
  // Ensure postId is always a string
  const normalizedPostId = typeof postId === 'string' ? postId : String(postId);
  const formRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [isFetching, setIsFetching] = useState(false);

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

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500 mb-4" />
        <p className="text-gray-400 text-center">Loading comments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <div className="bg-red-500/10 p-3 rounded-full mb-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <p className="text-red-400 mb-2 text-center font-medium">Failed to load comments</p>
        <p className="text-gray-400 text-sm text-center mb-4">
          We couldn't load the comments for this post. Please try again.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const hasComments = comments && comments.length > 0;

  return (
    <div className="p-4 md:p-6">
      {/* Comment Form */}
      <div 
        ref={formRef} 
        className={cn(
          "mb-6 p-4 bg-gaming-800 rounded-lg border-b border-gaming-700",
          !hasComments && "border-b-0"
        )}
      >
        <h3 className="text-white font-medium mb-4 flex items-center">
          <MessageSquare className="mr-2 h-4 w-4 text-purple-400" />
          Add Your Comment
        </h3>
        {user ? (
          <CommentForm 
            postId={normalizedPostId} 
            onCommentAdded={handleCommentAdded}
            autoFocus={autoFocus} 
          />
        ) : (
          <div className="text-center py-4 bg-gaming-700/30 rounded-lg">
            <p className="text-gray-400 mb-2">Sign in to leave a comment</p>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => window.location.href = '/signin'} 
              className="bg-purple-600 hover:bg-purple-700"
            >
              Sign In
            </Button>
          </div>
        )}
      </div>

      {/* Comments List */}
      {hasComments ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">
              {comments.length === 1 
                ? '1 Comment' 
                : `${comments.length} Comments`}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-xs text-gray-400 hover:text-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem 
                key={comment.id} 
                comment={comment}
                postId={normalizedPostId}
                onReplyAdded={handleCommentAdded} 
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-gaming-800/30 rounded-lg border border-dashed border-gaming-700">
          <div className="bg-purple-500/10 p-3 rounded-full mb-3">
            <MessageSquare className="h-7 w-7 text-purple-400" />
          </div>
          <h3 className="text-white font-medium mb-1">No comments yet</h3>
          <p className="text-gray-400 text-sm max-w-md mb-4">
            Be the first to share your thoughts on this post!
          </p>
          {!user && (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => window.location.href = '/signin'} 
              className="bg-purple-600 hover:bg-purple-700"
            >
              Sign In to Comment
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
