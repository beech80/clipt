import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { createComment } from '@/services/commentService';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface CommentFormProps {
  postId: string;
  parentId?: string | null;
  onReplyComplete?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  buttonText?: string;
  className?: string;
  autoFocus?: boolean;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  postId,
  parentId = null,
  onReplyComplete,
  onCancel,
  placeholder = "Add a comment...",
  buttonText = "Post",
  className = '',
  autoFocus = false
}) => {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Auto focus input if requested
  React.useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to comment');
      return;
    }
    
    if (!commentText.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createComment({
        content: commentText,
        post_id: postId,
        user_id: user.id,
        parent_id: parentId
      });
      
      setCommentText('');
      
      if (onReplyComplete) {
        onReplyComplete();
      }
      
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`flex items-center gap-2 ${className}`}
    >
      {user && (
        <Avatar className="h-8 w-8">
          <AvatarImage 
            src={user.user_metadata?.avatar_url || ''} 
            alt={user.user_metadata?.username || 'User'} 
          />
          <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500 text-white">
            {user.user_metadata?.username?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className="relative flex-grow">
        <Input
          ref={inputRef}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={placeholder}
          className="rounded-full border-0 bg-gaming-950 px-4 py-2 h-10 text-sm placeholder:text-gaming-500"
          disabled={isSubmitting || !user}
        />
      </div>
      
      {commentText.trim() && (
        <Button
          type="submit"
          variant="ghost"
          disabled={isSubmitting || !commentText.trim()}
          className="text-blue-500 font-semibold text-sm hover:text-blue-400 hover:bg-transparent p-0"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : buttonText}
        </Button>
      )}
      
      {onCancel && (
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="text-gaming-400 hover:text-gaming-300 text-xs p-0"
        >
          Cancel
        </Button>
      )}
    </form>
  );
};
