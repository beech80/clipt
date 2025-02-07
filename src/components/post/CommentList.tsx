
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
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
    }
  });

  return (
    <div className="bg-[#1A1F2C] min-h-[400px] flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b border-[#9b87f5]/20">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold text-white">Comments</h2>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-[#9b87f5]" />
          </div>
        ) : comments?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No comments yet</p>
            <p className="text-gray-500 text-sm">Be the first to comment</p>
          </div>
        ) : (
          <div className="p-4 space-y-6">
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
      <div className="border-t border-[#9b87f5]/20">
        <CommentForm postId={postId} />
      </div>
    </div>
  );
};

export default CommentList;
