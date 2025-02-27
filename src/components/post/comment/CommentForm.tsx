
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio("/sounds/alert.mp3");
    audioRef.current.volume = 0.5; // Set volume to 50%
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Log when the component is mounted with the postId
  useEffect(() => {
    if (postId) {
      console.log("CommentForm initialized with postId:", postId);
    } else {
      console.error("CommentForm mounted with invalid or missing postId");
    }
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

    // Clear validation - ensure postId is provided
    if (!postId) {
      console.error("Cannot submit comment: Missing postId");
      toast.error("Cannot identify post for this comment");
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log(`Submitting comment to post ${postId} by user ${user.id}`);
      
      // Construct comment data
      const commentData = {
        post_id: postId,
        user_id: user.id,
        content: newComment.trim(),
        ...(parentId ? { parent_id: parentId } : {})
      };
      
      console.log("Sending comment data:", commentData);
      
      // Insert the comment
      const { data, error } = await supabase
        .from('comments')
        .insert(commentData)
        .select();

      if (error) {
        console.error("Error adding comment:", error);
        toast.error(`Error: ${error.message}`);
        setIsSubmitting(false);
        return;
      }

      console.log("Comment added successfully:", data);

      // Play success sound
      if (audioRef.current) {
        try {
          await audioRef.current.play();
        } catch (err) {
          console.warn("Could not play audio notification:", err);
        }
      }

      // Clear form and notify success
      setNewComment("");
      toast.success("Comment added successfully!");
      
      // Refresh comments data
      await queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      await queryClient.invalidateQueries({ queryKey: ['comments-count', postId] });
      
      // If replying, call the callback
      if (onReplyComplete) {
        onReplyComplete();
      }
    } catch (error: any) {
      console.error("Comment submission error:", error);
      toast.error(`Error: ${error?.message || "Unknown error adding comment"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmitComment} className="p-4">
      {!postId && (
        <div className="text-red-500 text-sm mb-2">
          Error: Cannot identify post. Please try refreshing the page.
        </div>
      )}
      
      <Textarea
        placeholder={user ? "Write your comment..." : "Please login to comment"}
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        disabled={!user || isSubmitting || !postId}
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
          disabled={!user || !newComment.trim() || isSubmitting || !postId}
        >
          {isSubmitting ? "Posting..." : "Post"}
        </Button>
      </div>
    </form>
  );
};
