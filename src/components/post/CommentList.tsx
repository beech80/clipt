
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { CommentItem } from "./comment/CommentItem";
import { CommentForm } from "./comment/CommentForm";

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
  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      // Validate postId
      if (!postId) {
        throw new Error('Post ID is required');
      }

      // Fetch all comments for the post
      const { data: allComments, error } = await supabase
        .from('comments')
        .select(`
          *,
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

      // Process comments into a tree structure
      const typedComments = allComments as (Omit<Comment, 'replies'> & { post_id: string })[];
      const commentMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      typedComments.forEach((comment) => {
        const commentWithReplies = { ...comment, replies: [] } as Comment;
        commentMap.set(comment.id, commentWithReplies);
        
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id);
          if (parent) {
            parent.replies.push(commentWithReplies);
          }
        } else {
          rootComments.push(commentWithReplies);
        }
      });

      return rootComments;
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  return (
    <div className="bg-[#1A1F2C] min-h-[400px] flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-[#9b87f5]" />
          </div>
        ) : comments?.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-400 text-sm">No comments yet</p>
            <p className="text-gray-500 text-xs">Start the conversation</p>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {comments?.map((comment) => (
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
