
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getComments, getCommentCount } from "@/services/commentService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNowStrict } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  autoFocusInput?: boolean;
}

const CommentModal: React.FC<CommentModalProps> = ({ 
  isOpen, 
  onClose, 
  postId,
  autoFocusInput = false
}) => {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const [post, setPost] = useState<any>(null);
  
  // Get the post content to display in the modal header
  useEffect(() => {
    if (isOpen && postId) {
      const fetchPost = async () => {
        try {
          const { data, error } = await supabase
            .from("posts")
            .select(`
              id,
              content,
              profiles:user_id (
                username,
                avatar_url
              )
            `)
            .eq("id", postId)
            .single();
          
          if (error) throw error;
          setPost(data);
        } catch (error) {
          console.error("Error fetching post:", error);
        }
      };
      
      fetchPost();
    }
  }, [isOpen, postId]);

  // Focus textarea when modal opens if autoFocusInput is true
  useEffect(() => {
    if (isOpen && autoFocusInput && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, autoFocusInput]);

  // Add comment mutation
  const addComment = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("You must be logged in to comment");
      
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            content,
            user_id: user.id,
            post_id: postId,
            parent_id: null
          }
        ])
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['comments-count', postId] });
      toast.success("Comment posted successfully");
      onClose();
    },
    onError: (error) => {
      console.error("Error adding comment:", error);
      toast.error("Failed to post comment");
    }
  });

  // Handle comment submission
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    if (!user) {
      toast.error("You must be logged in to comment");
      return;
    }
    
    setIsSubmitting(true);
    addComment.mutate(comment.trim(), {
      onSettled: () => {
        setIsSubmitting(false);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#1A1F2C] border-gray-700 text-white p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogTitle className="flex justify-between items-center p-4 border-b border-gray-700 bg-[#1A1F2C]">
            <h2 className="text-xl font-bold text-white">Add Comment</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          
          {/* Post info */}
          {post && (
            <div className="px-4 py-2 text-sm text-gray-400 bg-[#1A1F2C]/80">
              Commenting on post from <span className="text-purple-400">{post.profiles?.username || 'Unknown'}</span>
            </div>
          )}
          
          {/* Comment form */}
          <form onSubmit={handleSubmitComment} className="flex flex-col flex-grow p-4">
            <Textarea
              ref={textareaRef}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your comment..."
              className="min-h-[120px] bg-[#1A1F2C]/60 border-gray-700 text-white resize-none flex-grow mb-4 focus:border-purple-500 placeholder:text-gray-500"
            />
            
            <div className="flex justify-end gap-3 mt-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={onClose}
                className="border-purple-500 text-purple-400 hover:bg-purple-900/20"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !comment.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Post Comment
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentModal;
