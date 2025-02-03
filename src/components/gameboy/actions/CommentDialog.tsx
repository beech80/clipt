import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  comment: string;
  onCommentChange: (value: string) => void;
  onSubmit: () => void;
}

const CommentDialog = ({
  isOpen,
  onClose,
  comment,
  onCommentChange,
  onSubmit
}: CommentDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#1A1F2C] text-white">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">Add Comment</h2>
        </div>
        
        <Textarea
          placeholder="Write your comment..."
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          className="min-h-[100px] bg-[#2A2F3C] border-gaming-400/30 text-white"
        />
        
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gaming-400/30 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            className="bg-gaming-500 hover:bg-gaming-600 text-white"
          >
            Post Comment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentDialog;