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
      <div className="bg-[#1A1F2C] min-h-[400px] flex items-center justify-center">
        <div className="text-center py-6">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Loading comments...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    console.error("Error displaying comments:", error);
    return (
      <div className="bg-[#1A1F2C] min-h-[400px] flex flex-col items-center justify-center">
        <div className="text-center py-6">
          <p className="text-red-500 text-lg">Error loading comments</p>
          <p className="text-sm text-gray-400 mt-2">{(error as Error).message || 'An unknown error occurred'}</p>
          <Button 
            variant="outline" 
            size="sm"
            className="mt-4"
            onClick={() => refetch()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
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
    <div className="bg-[#1A1F2C] min-h-[400px] flex flex-col">
      <div className="sticky top-0 z-10 bg-[#1A1F2C] py-4 px-4 border-b border-[#2A2F3C] flex items-center">
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
          <X className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">Comments</h2>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} onReplyAdded={handleCommentAdded} postId={normalizedPostId} />
          ))
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-500">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-[#2A2F3C] bg-[#1A1F2C] p-4">
        <CommentForm postId={normalizedPostId} onCommentAdded={handleCommentAdded} />
      </div>
    </div>
  );
};
