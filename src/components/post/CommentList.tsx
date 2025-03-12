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
      <div className="bg-gaming-800 min-h-[400px] flex items-center justify-center rounded-md shadow-inner">
        <div className="text-center py-10">
          <div className="relative mx-auto w-12 h-12 mb-5">
            <Loader2 className="h-12 w-12 animate-spin mx-auto absolute text-purple-500 opacity-75" />
            <MessageSquare className="h-6 w-6 absolute inset-0 m-auto text-white" />
          </div>
          <p className="text-sm text-gray-300 animate-pulse">Loading comments...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    console.error("Error displaying comments:", error);
    return (
      <div className="bg-gaming-800 min-h-[400px] flex flex-col items-center justify-center rounded-md shadow-inner">
        <div className="text-center py-8 px-4 max-w-md">
          <div className="bg-red-500/10 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-red-400 text-lg font-semibold">Unable to load comments</p>
          <p className="text-sm text-gray-400 mt-2 mb-4">{(error as Error).message || 'An unknown error occurred'}</p>
          <Button 
            variant="outline" 
            size="sm"
            className="mt-2 bg-gaming-700 hover:bg-gaming-600 border-gaming-600 text-white"
            onClick={() => {
              setIsFetching(true);
              refetch().finally(() => setIsFetching(false));
            }}
            disabled={isFetching}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
            {isFetching ? "Retrying..." : "Try Again"}
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
    <div className="bg-gaming-800 min-h-[400px] flex flex-col overflow-hidden">
      {/* Main comment list container */}
      <div className="flex-1 px-3 py-2 overflow-y-auto comment-list-container custom-scrollbar">
        {comments && comments.length > 0 ? (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="comment-item-appear" style={{animationDelay: `${comments.indexOf(comment) * 50}ms`}}>
                <CommentItem 
                  comment={comment} 
                  onReplyAdded={handleCommentAdded} 
                  postId={normalizedPostId} 
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="bg-gaming-700/30 rounded-full w-14 h-14 mx-auto mb-3 flex items-center justify-center">
              <MessageSquare className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-gray-400 mb-2">No comments yet</p>
            <p className="text-sm text-gray-500">Be the first to share your thoughts!</p>
          </div>
        )}
      </div>

      {/* Comment form */}
      <div 
        ref={formRef} 
        className="sticky bottom-0 border-t border-gaming-700 bg-gaming-800/95 backdrop-blur-sm p-3 shadow-lg transition-all duration-300"
      >
        <CommentForm 
          postId={normalizedPostId} 
          onCommentAdded={handleCommentAdded} 
          autoFocus={autoFocus}
        />
      </div>
    </div>
  );
};
