import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SendIcon, Smile } from "lucide-react";
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
  autoFocus = false,
  placeholder = "Add a comment...",
  buttonText = "Post"
}: CommentFormProps & {
  placeholder?: string;
  buttonText?: string;
}) => {
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
    <div>
      {user ? (
        <form onSubmit={handleSubmitComment} className="w-full">
          <div className="flex items-center gap-3">
            {/* User avatar */}
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              <Avatar className="w-full h-full">
                <AvatarImage 
                  src={user?.user_metadata?.avatar_url} 
                  alt={user?.user_metadata?.name || 'User'} 
                />
                <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500 text-white">
                  {(user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* Input container */}
            <div className="flex-1 flex items-center rounded-full bg-gaming-800 border border-gaming-700">
              <input
                ref={textareaRef as any}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={placeholder}
                disabled={isSubmitting}
                className="flex-1 bg-transparent border-0 text-sm px-4 py-2 focus:outline-none focus:ring-0 text-gaming-100"
              />
              <div className="flex items-center">
                <button 
                  type="button"
                  className="text-gray-400 hover:text-gray-300 p-2"
                >
                  <Smile className="h-5 w-5" />
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className={`text-blue-400 hover:text-blue-300 font-medium px-3 py-1 ${!newComment.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {buttonText}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-center p-3 bg-gaming-800 rounded-lg">
          <p className="text-sm text-gray-400">
            Please <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300" onClick={() => toast.info("Please login to comment")}>login</Button> to comment
          </p>
        </div>
      )}
    </div>
  );
};
