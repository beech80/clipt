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
      postId,
      postIdType: typeof postId,
      user: user?.id,
      parentId 
    });
  }, [postId, user, parentId]);

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

    if (!postId) {
      console.error("Cannot submit comment: Invalid postId", postId);
      toast.error("Cannot identify post for this comment");
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log(`Submitting comment to post ${postId} by user ${user.id}`);
      
      // Create comment directly
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
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
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['comments-count', postId] });
      
    } catch (error: any) {
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
