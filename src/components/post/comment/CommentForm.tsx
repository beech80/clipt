
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

export const CommentForm = ({ postId, onCancel, parentId, onReplyComplete }: CommentFormProps) => {
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
    <form onSubmit={handleSubmitComment} className="p-4 space-y-4">
      <textarea
        placeholder="Write your comment..."
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        className="w-full min-h-[100px] bg-[#1e2230] text-white rounded-lg p-4 resize-none border border-[#9b87f5]/20 focus:border-[#9b87f5]/50 focus:ring-1 focus:ring-[#9b87f5]/50 placeholder:text-gray-500 outline-none transition-all"
      />
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-[#9b87f5]/20 hover:border-[#9b87f5]/50 text-gray-400 hover:text-white"
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit"
          className="bg-[#9b87f5] hover:bg-[#8b77e5] text-white transition-colors disabled:opacity-50"
          disabled={!newComment.trim()}
        >
          Post Comment
        </Button>
      </div>
    </form>
  );
};
