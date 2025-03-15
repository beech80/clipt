
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { createComment } from '@/services/commentService';
import { toast } from 'sonner';
import { Loader2, Send, Smile } from 'lucide-react';

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
  const [showEmojis, setShowEmojis] = useState(false);

  // Common emojis for quick access
  const quickEmojis = ['❤️', '🔥', '👏', '😂', '🙌', '😍', '👍', '😮'];

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

  const insertEmoji = (emoji: string) => {
    setCommentText(prev => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <div className={`bg-gaming-950/60 backdrop-blur-sm rounded-lg ${className}`}>
      <form 
        onSubmit={handleSubmit} 
        className="flex items-center gap-2 p-3 relative"
      >
        {user && (
          <Avatar className="h-8 w-8 border border-purple-500/30">
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
          <div className="flex items-center bg-gaming-900 rounded-full border border-gaming-700 pl-3 pr-1 py-1">
            <input
              ref={inputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={placeholder}
              className="bg-transparent w-full text-sm placeholder:text-gaming-500 focus:outline-none"
              disabled={isSubmitting || !user}
            />
            
            <button
              type="button"
              className="p-1.5 text-gaming-400 hover:text-gaming-200 focus:outline-none"
              onClick={() => setShowEmojis(!showEmojis)}
            >
              <Smile size={18} />
            </button>
            
            {commentText.trim() && (
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                disabled={isSubmitting}
                className="ml-1 p-1.5 text-blue-500 hover:text-blue-400 rounded-full hover:bg-gaming-800"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={18} />}
              </Button>
            )}
          </div>
          
          {/* Emoji picker */}
          {showEmojis && (
            <div className="absolute left-0 right-0 bottom-full mb-2 bg-gaming-900 border border-gaming-700 rounded-lg p-2 z-10 shadow-lg">
              <div className="flex flex-wrap gap-2 justify-center">
                {quickEmojis.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="w-8 h-8 text-xl flex items-center justify-center hover:bg-gaming-800 rounded-full transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="text-gaming-400 hover:text-gaming-300 text-xs"
          >
            Cancel
          </Button>
        )}
      </form>
    </div>
  );
};
