import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { createComment } from '@/services/commentService';
import { toast } from 'sonner';
import { Loader2, Smile, Send, X } from 'lucide-react';
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
  placeholder = "Write your comment...",
  buttonText = "Post Comment",
  className = '',
  autoFocus = false
}) => {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const { user } = useAuth();

  // Auto focus textarea if requested
  React.useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
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
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className={`shadow-lg ${className}`}>
      {/* Header with title */}
      <div className="bg-gaming-900 p-4 rounded-t-lg border-b border-gaming-700 flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Add Comment</h3>
        {onCancel && (
          <Button 
            onClick={onCancel} 
            size="icon"
            variant="ghost" 
            className="h-8 w-8 rounded-full hover:bg-gaming-700"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Content showing which post we're commenting on */}
      {parentId ? (
        <div className="px-4 py-2 bg-gaming-800 text-sm text-gray-400">
          Replying to comment
        </div>
      ) : (
        <div className="px-4 py-2 bg-gaming-800 text-sm text-gray-400">
          Commenting on post from {user?.user_metadata?.username || 'user'}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-gaming-800 p-4 rounded-b-lg">
        {/* Textarea for comment */}
        <div className="relative mb-4">
          <textarea
            ref={textareaRef}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={placeholder}
            className="w-full h-24 bg-gaming-900 border border-gaming-700 rounded-lg p-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
          />
          
          {/* Emoji picker button */}
          <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
            <PopoverTrigger asChild>
              <Button 
                type="button" 
                size="sm" 
                variant="ghost" 
                className="absolute bottom-2 right-2 h-8 w-8 p-0 rounded-full text-gray-400 hover:text-white hover:bg-gaming-700"
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
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <Button 
              onClick={onCancel} 
              type="button"
              variant="outline" 
              className="border-gaming-600 hover:bg-gaming-700 text-gray-300"
            >
              Cancel
            </Button>
          )}
          
          <Button 
            type="submit"
            disabled={isSubmitting || !commentText.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white px-6 py-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {buttonText}
          </Button>
        </div>
      </form>
    </div>
  );
};
