
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getComments, getCommentCount, createComment } from "@/services/commentService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNowStrict } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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
  const commentsContainerRef = React.useRef<HTMLDivElement>(null);
  
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

  // Fetch comments for the post
  const { data: comments = [], isLoading, error, refetch } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      if (!postId) return [];
      const result = await getComments(postId);
      return result.data || [];
    },
    enabled: !!postId && isOpen,
  });

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
      refetch();
    },
    onError: (error) => {
      console.error("Error adding comment:", error);
      toast.error("Failed to post comment");
    },
    onSettled: () => {
      setIsSubmitting(false);
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
    addComment.mutate(comment.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#1A1F2C] border-gray-700 text-white p-0 overflow-hidden max-h-[90vh] flex flex-col">
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
          <div className="px-4 py-2 text-sm text-gray-400 bg-[#1A1F2C]/80 border-b border-gray-700">
            Commenting on post from <span className="text-purple-400">{post.profiles?.username || 'Unknown'}</span>
          </div>
        )}
        
        {/* Comments section */}
        <div 
          ref={commentsContainerRef} 
          className="flex-grow overflow-y-auto p-4 space-y-4"
        >
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-sm text-gray-400">Loading comments...</p>
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment: any) => (
              <div key={comment.id} className="flex space-x-3 pb-3 border-b border-gray-700/50">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage 
                    src={comment.profiles?.avatar_url} 
                    alt={comment.profiles?.username || 'User'} 
                  />
                  <AvatarFallback className="bg-purple-800 text-white">
                    {comment.profiles?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-purple-400">{comment.profiles?.username || 'User'}</span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNowStrict(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{comment.content}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
        
        {/* Comment form */}
        <form onSubmit={handleSubmitComment} className="p-4 border-t border-gray-700 bg-[#1A1F2C]/90">
          <Textarea
            ref={textareaRef}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your comment..."
            className="min-h-[100px] bg-[#1A1F2C]/60 border-gray-700 text-white resize-none flex-grow mb-4 focus:border-purple-500 placeholder:text-gray-500"
          />
          
          <div className="flex justify-end gap-3">
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
      </DialogContent>
    </Dialog>
  );
};

export default CommentModal;
