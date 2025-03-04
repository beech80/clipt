import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, X } from "lucide-react";
import { CommentItem } from "./comment/CommentItem";
import { CommentForm } from "./comment/CommentForm";
import { useEffect } from "react";

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
}

export const CommentList = ({ postId, onBack, onCommentAdded }: CommentListProps) => {
  // Ensure postId is always a string
  const normalizedPostId = typeof postId === 'string' ? postId : String(postId);
  
  // Add logging to see the postId value
  useEffect(() => {
    console.log(`CommentList component mounted with postId: ${normalizedPostId}`);
    
    // Additional check to see the exact type and value
    console.log('PostId type:', typeof normalizedPostId);
    console.log('PostId value:', normalizedPostId);
    
    // Add focus to comment form when component mounts to improve UX
    const commentTextarea = document.querySelector('.comment-textarea');
    if (commentTextarea && commentTextarea instanceof HTMLElement) {
      setTimeout(() => {
        commentTextarea.focus();
      }, 500);
    }
  }, [normalizedPostId]);

  // Exit early if no postId is provided or if it's invalid
  if (!normalizedPostId) {
    console.error("Empty postId received by CommentList");
    return (
      <div className="bg-gray-900 p-4 flex flex-col items-center justify-center">
        <div className="text-center py-4">
          <p className="text-red-500 text-sm">Error: Cannot identify post</p>
          <p className="text-red-500 text-xs mt-2">Please try refreshing the page</p>
          <Button 
            variant="outline" 
            size="sm"
            className="mt-2 text-xs"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  const { data: comments, isLoading, error, refetch } = useQuery({
    queryKey: ['comments', normalizedPostId],
    queryFn: async () => {
      console.log(`Fetching comments for post: ${normalizedPostId}`);
      
      try {
        const { data, error } = await supabase
          .from('comments')
          .select(`
            id,
            content,
            created_at,
            parent_id,
            likes_count,
            user_id,
            profiles:user_id (
              username,
              avatar_url
            )
          `)
          .eq('post_id', normalizedPostId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching comments:", error);
          throw error;
        }

        console.log(`Retrieved ${data?.length || 0} comments for post ${normalizedPostId}`);

        // Process comments into a tree structure
        const typedComments = data as unknown as (Omit<Comment, 'replies'>)[];
        const commentMap = new Map<string, Comment>();
        const rootComments: Comment[] = [];
        
        // First pass: create all comment objects with empty replies array
        typedComments.forEach(comment => {
          commentMap.set(comment.id, { ...comment, replies: [] });
        });
        
        // Second pass: populate replies and build root comments list
        typedComments.forEach(comment => {
          const fullComment = commentMap.get(comment.id)!;
          
          if (comment.parent_id && commentMap.has(comment.parent_id)) {
            // This is a reply, add it to parent's replies
            const parentComment = commentMap.get(comment.parent_id)!;
            parentComment.replies.push(fullComment);
          } else {
            // This is a root comment
            rootComments.push(fullComment);
          }
        });
        
        // Sort root comments by creation date (newest first)
        rootComments.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        return rootComments;
      } catch (err) {
        console.error("Error in comments query function:", err);
        throw err;
      }
    },
    retry: 2, // Retry failed queries up to 2 times
    refetchOnWindowFocus: false,
  });

  // Handle loading state
  if (isLoading) {
    return (
      <div className="bg-gray-900 p-4 flex items-center justify-center">
        <div className="text-center py-4">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-400">Loading comments...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    console.error("Error displaying comments:", error);
    return (
      <div className="bg-gray-900 p-4 flex flex-col items-center justify-center">
        <div className="text-center py-4">
          <p className="text-red-500 text-sm">Error loading comments</p>
          <Button 
            variant="outline" 
            size="sm"
            className="mt-2 text-xs"
            onClick={() => refetch()}
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const handleCommentAdded = () => {
    refetch();
    if (onCommentAdded) onCommentAdded();
  };

  return (
    <div className="bg-gray-900 border-t border-gray-800">
      {onBack && (
        <div className="p-2 border-b border-gray-800 flex items-center">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-1">
            <X className="h-4 w-4" />
          </Button>
          <h3 className="text-sm font-medium">Comments</h3>
        </div>
      )}

      <div className="p-3 space-y-3">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} onReplyAdded={handleCommentAdded} postId={normalizedPostId} />
          ))
        ) : (
          <div className="py-4 text-center">
            <p className="text-gray-500 text-xs">No comments yet.</p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-800 p-2">
        <CommentForm postId={normalizedPostId} onCommentAdded={handleCommentAdded} />
      </div>
    </div>
  );
};
