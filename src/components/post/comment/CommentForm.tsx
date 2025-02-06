
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

interface CommentFormProps {
  postId: string;
  onCancel?: () => void;
  parentId?: string | null;
  onReplyComplete?: () => void;
}

export const CommentForm = ({ postId, parentId, onReplyComplete }: CommentFormProps) => {
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to comment");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          content: newComment.trim(),
          post_id: postId,
          user_id: user.id,
          parent_id: parentId || null
        });

      if (error) throw error;

      toast.success("Comment added successfully!");
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      if (onReplyComplete) {
        onReplyComplete();
      }
    } catch (error) {
      toast.error("Error adding comment");
    }
  };

  return (
    <form onSubmit={handleSubmitComment} className="flex items-center gap-2 p-3">
      <input
        type="text"
        placeholder={parentId ? "Write a reply..." : "Write a comment..."}
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        className="flex-1 text-sm bg-gray-100 rounded-full px-4 py-2 outline-none placeholder:text-gray-500 focus:bg-gray-200 transition-colors"
      />
      <Button 
        type="submit"
        variant="ghost"
        size="sm"
        className="text-blue-500 font-semibold text-sm hover:text-blue-600 disabled:text-blue-300 disabled:hover:text-blue-300"
        disabled={!newComment.trim()}
      >
        Post
      </Button>
    </form>
  );
};
