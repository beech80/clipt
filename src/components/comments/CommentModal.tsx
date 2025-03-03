import React, { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CommentList } from '@/components/post/CommentList';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId?: string;
}

const CommentModal: React.FC<CommentModalProps> = ({ isOpen, onClose, postId }) => {
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Log for debugging
    console.log(`Comment modal ${isOpen ? 'opened' : 'closed'} for post ${postId}`);
    
    // When opening, focus on the comment textarea after a small delay
    if (isOpen) {
      setTimeout(() => {
        const textarea = document.querySelector('.comment-form-input');
        if (textarea instanceof HTMLElement) {
          textarea.focus();
        }
      }, 300);
    }
  }, [isOpen, postId]);

  if (!postId) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-[600px] h-[90vh] max-h-[900px] flex flex-col p-0 gap-0 bg-[#1A1F2C] border-[#2A2F3C]"
        initialFocus={initialFocusRef}
      >
        <DialogHeader className="sticky top-0 z-10 px-6 py-4 border-b border-[#2A2F3C] flex flex-row items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="absolute left-2"
            ref={initialFocusRef}
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle className="text-center flex-1 text-lg font-bold">Comments</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <CommentList 
            postId={postId} 
            onCommentAdded={() => toast.success('Comment added!')}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentModal;
