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
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
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

  // Emoji picker constants with popular emojis
  const popularEmojis = ['😊', '👍', '❤️', '🔥', '👏', '🎮', '😂', '🙌', '🤔', '😍', '😎', '👀', '🚀', '✨'];
  const gameEmojis = ['🎮', '🎯', '🎲', '🎪', '🏆', '🥇', '🏅', '🎖️', '🎨', '🎭'];
  
  const addEmoji = (emoji: string) => {
    setCommentText(prev => prev + emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`relative group ${className}`}
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full opacity-30 group-focus-within:opacity-70 blur group-hover:opacity-50 transition duration-300"></div>
      <div className="relative flex items-center gap-2 bg-gaming-800 p-2 rounded-full border border-gaming-700 shadow-lg">
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
        
        <div className="relative flex-grow flex bg-transparent rounded-full overflow-hidden pl-2 pr-1">
          <Input
            ref={inputRef}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={placeholder}
            className="flex-grow border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pl-0 h-auto py-1.5 text-white placeholder:text-gray-500"
          />
          
          {/* Improved emoji picker */}
          <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
            <PopoverTrigger asChild>
              <Button 
                type="button" 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 rounded-full text-gray-400 hover:text-white flex-shrink-0 hover:bg-gaming-700"
              >
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="bg-gaming-800 border-gaming-700 p-3 w-64 shadow-lg rounded-xl">
              <div className="mb-2">
                <div className="text-sm text-gray-400 mb-1">Popular</div>
                <div className="flex flex-wrap gap-1">
                  {popularEmojis.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        addEmoji(emoji);
                        setIsEmojiPickerOpen(false);
                      }}
                      className="text-xl hover:bg-gaming-700 p-1.5 rounded-md transition-colors w-9 h-9"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Gaming</div>
                <div className="flex flex-wrap gap-1">
                  {gameEmojis.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        addEmoji(emoji);
                        setIsEmojiPickerOpen(false);
                      }}
                      className="text-xl hover:bg-gaming-700 p-1.5 rounded-md transition-colors w-9 h-9"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button 
            type="submit"
            disabled={isSubmitting || !commentText.trim()}
            className={`bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full px-4 ml-2 transition-all duration-200 ${!commentText.trim() ? 'opacity-70' : 'opacity-100'}`}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : null}
            {buttonText}
          </Button>
        </div>
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
