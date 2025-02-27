
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface CommentFormProps {
  postId: string;
  onCancel?: () => void;
  parentId?: string | null;
  onReplyComplete?: () => void;
}

export const CommentForm = ({ postId, onCancel, parentId, onReplyComplete }: CommentFormProps) => {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Add this for debugging - as a useEffect to avoid repeated logs
  useEffect(() => {
    console.log("CommentForm initialized with postId:", postId);
  }, [postId]);

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

    // Check if postId exists and is valid
    if (!postId || typeof postId !== 'string' || postId.trim() === '') {
      console.error("Invalid postId:", postId);
      toast.error("Error identifying post");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Log the request for debugging
      console.log("Attempting to submit comment with data:", {
        post_id: postId,
        user_id: user.id,
        content: newComment.trim(),
        parent_id: parentId
      });
      
      // Make sure we're sending the exact format expected by Supabase
      const commentData = {
        post_id: postId,
        user_id: user.id,
        content: newComment.trim(),
        parent_id: parentId || null
      };
      
      console.log("Final comment data being sent to Supabase:", commentData);
      
      const { data, error } = await supabase
        .from('comments')
        .insert(commentData)
        .select();

      if (error) {
        console.error("Error adding comment:", error);
        throw error;
      }

      console.log("Comment added successfully:", data);

      // Clear form and notify success
      setNewComment("");
      toast.success("Comment added successfully!");
      
      // Refresh comments data
      await queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      
      // If replying, call the callback
      if (onReplyComplete) {
        onReplyComplete();
      }
    } catch (error) {
      console.error("Comment submission error:", error);
      toast.error("Error adding comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmitComment} className="p-4">
      <Textarea
        placeholder={user ? "Write your comment..." : "Please login to comment"}
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        disabled={!user || isSubmitting}
        className="w-full min-h-[60px] bg-[#1e2230] text-white rounded-lg p-2 resize-none border border-[#9b87f5]/20 focus:border-[#9b87f5]/50 focus:ring-1 focus:ring-[#9b87f5]/50 placeholder:text-gray-500 outline-none transition-all text-sm disabled:opacity-50"
      />
      <div className="flex justify-end gap-2 mt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-7 text-xs border-[#9b87f5]/20 hover:border-[#9b87f5]/50 text-gray-400 hover:text-white"
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit"
          className="h-7 text-xs bg-[#9b87f5] hover:bg-[#8b77e5] text-white transition-colors disabled:opacity-50"
          disabled={!user || !newComment.trim() || isSubmitting}
        >
          {isSubmitting ? "Posting..." : "Post"}
        </Button>
      </div>
      {/* Debug element - remove in production */}
      <div className="text-xs text-gray-500 mt-1 opacity-50">
        {postId ? `Ready to post comment to: ${postId.substring(0, 8)}...` : 'No post ID available'}
      </div>
    </form>
  );
};
