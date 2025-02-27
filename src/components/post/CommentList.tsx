
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
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
}

export const CommentList = ({ postId, onBack }: CommentListProps) => {
  // Add logging to see the postId value
  useEffect(() => {
    console.log(`CommentList component mounted with postId: ${postId}`);
  }, [postId]);

  // Exit early if no postId is provided
  if (!postId || typeof postId !== 'string' || postId.trim() === '') {
    console.error("Invalid or empty postId received by CommentList:", postId);
    return (
      <div className="bg-[#1A1F2C] min-h-[400px] flex flex-col items-center justify-center">
        <div className="text-center py-6">
          <p className="text-red-500 text-lg">Error: Cannot identify post</p>
          <p className="text-red-500 text-sm mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  const { data: comments, isLoading, error } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      console.log(`Fetching comments for post: ${postId}`);
      
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
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching comments:", error);
        throw error;
      }

      console.log(`Retrieved ${data?.length || 0} comments for post ${postId}`);

      // Process comments into a tree structure
      const typedComments = data as unknown as (Omit<Comment, 'replies'>)[];
      const commentMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      typedComments.forEach((comment) => {
        const commentWithReplies = { ...comment, replies: [] } as Comment;
        commentMap.set(comment.id, commentWithReplies);
      });

      // Build hierarchy after all comments are in the map
      typedComments.forEach((comment) => {
        if (comment.parent_id && commentMap.has(comment.parent_id)) {
          const parent = commentMap.get(comment.parent_id);
          if (parent) {
            parent.replies.push(commentMap.get(comment.id)!);
          } else {
            rootComments.push(commentMap.get(comment.id)!);
          }
        } else {
          rootComments.push(commentMap.get(comment.id)!);
        }
      });

      return rootComments;
    },
    enabled: !!postId,
    retry: 2,
    retryDelay: 1000
  });

  if (error) {
    console.error("Error in comment query:", error);
    return (
      <div className="bg-[#1A1F2C] min-h-[400px] flex flex-col items-center justify-center">
        <div className="text-center py-6">
          <p className="text-red-500 text-lg">Error loading comments</p>
          <p className="text-red-500 text-sm mt-2">{error.message || "Please try again later"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1F2C] min-h-[400px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[#252B3B] border-b border-[#9b87f5]/20">
        <h3 className="text-xl font-semibold text-white">Comments</h3>
        {onBack && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-[#9b87f5]" />
          </div>
        ) : !comments || comments.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-400 text-sm">No comments yet</p>
            <p className="text-gray-500 text-xs">Start the conversation</p>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {comments.map((comment) => (
              <CommentItem 
                key={comment.id} 
                comment={comment}
                postId={postId}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[#9b87f5]/20 mt-auto">
        <CommentForm postId={postId} />
      </div>
    </div>
  );
};

export default CommentList;
