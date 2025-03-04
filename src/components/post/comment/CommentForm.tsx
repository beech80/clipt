import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

interface CommentFormProps {
  postId: string;
  onCancel?: () => void;
  parentId?: string | null;
  onReplyComplete?: () => void;
  onCommentAdded?: () => void;
}

export const CommentForm = ({ postId, onCancel, parentId, onReplyComplete, onCommentAdded }: CommentFormProps) => {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Ensure postId is always a string
  const normalizedPostId = typeof postId === 'string' ? postId : String(postId);

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

  // Log for debugging
  useEffect(() => {
    console.log("CommentForm Debug:", { 
      postId: normalizedPostId,
      postIdType: typeof normalizedPostId,
      user: user?.id,
      parentId 
    });
  }, [normalizedPostId, user, parentId]);

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

    if (!normalizedPostId) {
      console.error("Cannot submit comment: Invalid postId", normalizedPostId);
      toast.error("Cannot identify post for this comment");
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log(`Submitting comment to post ${normalizedPostId} by user ${user.id}`);
      
      // Create comment directly
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: normalizedPostId,
          user_id: user.id,
          content: newComment.trim(),
          ...(parentId ? { parent_id: parentId } : {})
        })
        .select();

      if (error) {
        console.error("Error adding comment:", error);
        toast.error(`Error: ${error.message}`);
        return;
      }

      console.log("Comment added successfully:", data);

      // Play sound
      if (audioRef.current) {
        try {
          audioRef.current.play().catch(() => {
            console.log("Audio play failed - this is normal in some browsers");
          });
        } catch (err) {
          console.warn("Could not play audio notification");
        }
      }

      // Clear form
      setNewComment("");
      toast.success("Comment added successfully!");
      
      // Force refresh comments
      if (onCommentAdded) {
        onCommentAdded();
      }
      
      if (onReplyComplete) {
        onReplyComplete();
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['comments', normalizedPostId] });
      queryClient.invalidateQueries({ queryKey: ['comments-count', normalizedPostId] });
      
    } catch (error: any) {
      console.error("Comment submission error:", error);
      toast.error("Error adding comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmitComment} className="space-y-2">
      <Textarea
        placeholder={user ? "Write a comment..." : "Please login to comment"}
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        disabled={!user || isSubmitting}
        className="w-full min-h-[40px] bg-gray-800 text-white rounded text-xs border border-gray-700 focus:border-gray-600 resize-none placeholder:text-gray-500 comment-textarea"
      />
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-xs h-6 py-0 px-2"
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={!user || isSubmitting || !newComment.trim()}
          className="text-xs h-6 py-0 px-2 bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? "Sending..." : "Comment"}
        </Button>
      </div>
    </form>
  );
};
