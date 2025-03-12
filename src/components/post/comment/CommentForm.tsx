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
  autoFocus?: boolean;
}

export const CommentForm = ({ 
  postId, 
  onCancel, 
  parentId, 
  onReplyComplete, 
  onCommentAdded,
  autoFocus = false
}: CommentFormProps) => {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
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
  
  // Auto-focus the textarea if requested
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
    }
  }, [autoFocus]);

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
    <form onSubmit={handleSubmitComment} className="p-2">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          placeholder={user ? "Write your comment..." : "Please login to comment"}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={!user || isSubmitting}
          className="w-full min-h-[80px] bg-gaming-900 text-white rounded-lg p-3 resize-none border border-gaming-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder:text-gray-500 outline-none transition-all text-sm disabled:opacity-50 comment-textarea comment-form-input"
        />
        {!user && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <Button
              type="button"
              onClick={() => window.location.href = '/login'}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm shadow-lg"
            >
              Login to Comment
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex justify-between mt-3 items-center">
        <div className="text-xs text-gray-500">
          {user && newComment.length > 0 && (
            <span className={`transition-colors ${newComment.length > 500 ? 'text-red-500' : ''}`}>
              {newComment.length}/500
            </span>
          )}
        </div>
        
        <div className="flex space-x-2">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
              className="text-xs h-9 border-gaming-700 bg-gaming-800 hover:bg-gaming-700"
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={!user || isSubmitting || !newComment.trim() || newComment.length > 500} 
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-5 py-2 rounded-md text-xs h-9 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Posting...' : parentId ? 'Reply' : 'Comment'}
          </Button>
        </div>
      </div>
    </form>
  );
};
