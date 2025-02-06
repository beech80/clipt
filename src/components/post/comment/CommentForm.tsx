
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

interface CommentFormProps {
  postId: string;
  onCancel: () => void;
}

export const CommentForm = ({ postId, onCancel }: CommentFormProps) => {
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
          user_id: user.id
        });

      if (error) throw error;

      toast.success("Comment added successfully!");
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    } catch (error) {
      toast.error("Error adding comment");
    }
  };

  return (
    <form onSubmit={handleSubmitComment} className="flex items-center gap-2 px-4 py-3 border-t border-gray-200">
      <input
        type="text"
        placeholder="Add a comment..."
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-500"
      />
      <Button 
        type="submit"
        variant="ghost"
        className="text-blue-500 font-semibold text-sm hover:text-blue-600 disabled:text-blue-300 disabled:hover:text-blue-300"
        disabled={!newComment.trim()}
      >
        Post
      </Button>
    </form>
  );
};
