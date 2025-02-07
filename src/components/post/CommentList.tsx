
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
    avatar_url: string;
  };
}

interface CommentListProps {
  postId: string;
  onBack: () => void;
}

export const CommentList = ({ postId, onBack }: CommentListProps) => {
  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
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

      // Type the comments properly before organizing them
      const typedComments = allComments as (Omit<Comment, 'replies'> & { post_id: string })[];
      
      // Organize comments into a tree structure
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
    }
  });

  return (
    <div className="bg-gaming-900/95 backdrop-blur-sm">
      {/* Comments list */}
      <div className="max-h-[70vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : comments?.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-400">No comments yet</p>
            <p className="text-gray-500 text-sm">Be the first to comment</p>
          </div>
        ) : (
          <div className="py-4 px-4 space-y-4">
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

      {/* Comment input */}
      <div className="border-t border-gaming-400/20 bg-gaming-800/80">
        <CommentForm postId={postId} />
      </div>
    </div>
  );
};

export default CommentList;
