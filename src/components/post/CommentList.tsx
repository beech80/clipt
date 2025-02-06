
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { CommentItem } from "./comment/CommentItem";
import { CommentForm } from "./comment/CommentForm";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  parent_id?: string | null;
  likes_count: number;
  user_id: string;
  replies: Comment[];  // Add this to fix the TypeScript error
  profiles: {
    username: string;
    avatar_url: string;
  };
}

interface CommentListProps {
  postId: string;
  onBack: () => void;
}

const CommentList = ({ postId, onBack }: CommentListProps) => {
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
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organize comments into a tree structure
      const commentMap = new Map();
      const rootComments: Comment[] = [];

      allComments.forEach((comment: Comment) => {
        comment.replies = [];
        commentMap.set(comment.id, comment);
        
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id);
          if (parent) {
            parent.replies.push(comment);
          }
        } else {
          rootComments.push(comment);
        }
      });

      return rootComments;
    }
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Comments</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Comments list */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : comments?.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No comments yet</p>
              <p className="text-gray-400 text-sm">Be the first to comment</p>
            </div>
          ) : (
            <div className="py-4 px-4 space-y-6">
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
        <div className="border-t border-gray-200">
          <CommentForm postId={postId} />
        </div>
      </div>
    </div>
  );
};

export default CommentList;
