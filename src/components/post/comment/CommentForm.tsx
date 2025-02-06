
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
    <form onSubmit={handleSubmitComment} className="space-y-4">
      <Textarea
        placeholder="Write your comment..."
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        className="min-h-[100px] bg-[#2A2F3C] border-purple-500/50 focus-visible:ring-purple-500/30 text-white placeholder:text-white/50 resize-none rounded-lg"
      />
      <div className="flex justify-end gap-3">
        <Button 
          type="button"
          onClick={onCancel}
          variant="ghost"
          className="text-white hover:bg-white/5"
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          className="bg-purple-500 hover:bg-purple-600 text-white"
          disabled={!newComment.trim()}
        >
          Post Comment
        </Button>
      </div>
    </form>
  );
};
