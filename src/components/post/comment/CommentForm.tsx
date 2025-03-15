import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { createComment } from '@/services/commentService';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Loader2, Smile } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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

  // Emoji picker constants
  const emojis = ['❤️', '👍', '🔥', '👏', '😂', '😮', '😢', '🙏'];
  
  const addEmoji = (emoji: string) => {
    setCommentText(prev => prev + emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`flex items-center gap-2 w-full ${className}`}
    >
      {user && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage 
            src={user.user_metadata?.avatar_url || ''} 
            alt={user.user_metadata?.username || 'User'} 
          />
          <AvatarFallback className="bg-gradient-to-br from-purple-700 to-blue-500 text-white">
            {user.user_metadata?.username?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className="relative flex-grow flex bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden pl-3 pr-1 py-1">
        <Input
          ref={inputRef}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={placeholder}
          className="flex-grow border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pl-0 h-auto py-0.5"
        />
        
        {/* Emoji picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              type="button" 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground flex-shrink-0"
            >
              <Smile className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="end">
            <div className="flex gap-2 flex-wrap max-w-[200px]">
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => addEmoji(emoji)}
                  className="text-xl hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        
        <Button 
          type="submit"
          disabled={isSubmitting || !commentText.trim()}
          size="sm"
          variant="ghost"
          className={`h-8 ml-1 font-medium ${!commentText.trim() ? 'text-blue-300' : 'text-blue-500'} hover:text-blue-600 hover:bg-transparent`}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : buttonText}
        </Button>
      </div>
      
      {onCancel && (
        <Button 
          onClick={onCancel} 
          size="sm" 
          variant="ghost" 
          className="h-9 px-2"
        >
          Cancel
        </Button>
      )}
    </form>
  );
};
