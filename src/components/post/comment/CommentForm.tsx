import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { createComment } from "@/services/commentService"; // Import the new service

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

  // Validate postId on mount
  useEffect(() => {
    console.log(`CommentForm initialized with postId: ${postId}`);
    if (!postId || typeof postId !== 'string' || postId.trim() === '') {
      console.error("Invalid postId in CommentForm:", postId);
    }
  }, [postId]);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio("/sounds/alert.mp3");
    audioRef.current.volume = 0.5;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Early return if no valid postId
  if (!postId || typeof postId !== 'string' || postId.trim() === '') {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 text-sm">Error: Cannot identify post</p>
        <p className="text-red-500 text-xs mt-1">Please try refreshing the page</p>
      </div>
    );
  }

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

    // Double check postId before submission
    if (!postId || typeof postId !== 'string' || postId.trim() === '') {
      console.error("Cannot submit comment: Invalid postId", postId);
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
      
      // Use the new commentService instead of directly calling supabase
      const { data, error } = await createComment(commentData);

      if (error) {
        console.error("Error adding comment:", error);
        toast.error(`Error: ${error.message}`);
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
      <Textarea
        placeholder={user ? "Write your comment..." : "Please login to comment"}
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        disabled={!user || isSubmitting}
        className="w-full min-h-[60px] bg-[#1e2230] text-white rounded-lg p-2 resize-none border border-[#9b87f5]/20 focus:border-[#9b87f5]/50 focus:ring-1 focus:ring-[#9b87f5]/50 placeholder:text-gray-500 outline-none transition-all text-sm disabled:opacity-50"
      />
      <div className="flex justify-end mt-2 space-x-2">
        {onCancel && (
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-sm"
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={!user || isSubmitting || !newComment.trim()} 
          className={`bg-[#9b87f5] hover:bg-[#8a78d9] text-white px-4 py-2 rounded text-sm ${isSubmitting ? 'opacity-70' : ''}`}
        >
          {isSubmitting ? 'Posting...' : parentId ? 'Reply' : 'Comment'}
        </Button>
      </div>
    </form>
  );
};
