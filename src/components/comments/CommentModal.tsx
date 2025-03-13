import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

const CommentModal: React.FC<CommentModalProps> = ({ isOpen, onClose, postId }) => {
  const navigate = useNavigate();
  
  // When modal is opened, close it immediately and scroll to comments section
  useEffect(() => {
    if (isOpen) {
      // Close modal
      onClose();
      
      // Find the post element and expand its comments
      setTimeout(() => {
        const postElement = document.getElementById(`post-${postId}`);
        if (postElement) {
          // Scroll to the post
          postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Find and click the "View comments" button if it exists
          const viewCommentsBtn = postElement.querySelector('[data-comments-toggle]');
          if (viewCommentsBtn) {
            (viewCommentsBtn as HTMLButtonElement).click();
          }
        } else {
          // If we can't find the post in the current view, navigate to it
          navigate(`/post/${postId}`);
        }
      }, 50);
    }
  }, [isOpen, onClose, postId, navigate]);

  // This modal is now just a fallback - it should redirect to inline comments
  return (
    <Dialog open={false} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gaming-900 border-gaming-700 text-white p-0 max-h-[90vh] overflow-hidden">
        <DialogTitle className="flex justify-between items-center p-4 border-b border-gaming-700">
          <h3 className="text-lg font-semibold">Comments</h3>
          <DialogClose asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogTitle>
        
        <div className="p-4 text-center">
          <p>Redirecting to comments section...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentModal;
