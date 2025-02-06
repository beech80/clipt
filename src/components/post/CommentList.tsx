
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
      const { data, error } = await supabase
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

      if (error) throw error;
      return data as Comment[];
    }
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-full max-w-lg bg-[#1A1F2C] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="hover:bg-white/5"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Button>
            <h1 className="text-lg font-semibold text-white">Add Comment</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="hover:bg-white/5"
          >
            <X className="h-5 w-5 text-white" />
          </Button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-white/50" />
            </div>
          ) : comments?.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-white/70">No comments yet</p>
              <p className="text-white/50 text-sm">Be the first to comment</p>
            </div>
          ) : (
            <div className="py-4 px-4 space-y-4">
              {comments?.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </div>

        {/* Comment input */}
        <div className="border-t border-white/10 p-4">
          <CommentForm postId={postId} onCancel={onBack} />
        </div>
      </div>
    </div>
  );
};

export default CommentList;
