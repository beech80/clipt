import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  contentType: 'post' | 'comment' | 'stream' | 'chat_message';
}

const reportReasons = [
  { id: 'inappropriate', label: 'Inappropriate Content' },
  { id: 'harassment', label: 'Harassment or Bullying' },
  { id: 'spam', label: 'Spam or Misleading' },
  { id: 'violence', label: 'Violence or Harm' },
  { id: 'copyright', label: 'Copyright Violation' },
  { id: 'other', label: 'Other' }
];

export function ReportDialog({ isOpen, onClose, contentId, contentType }: ReportDialogProps) {
  const [reason, setReason] = useState<string>('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please login to report content");
      return;
    }

    if (!reason) {
      toast.error("Please select a reason for reporting");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Submitting report...");

    try {
      const { error } = await supabase
        .from('content_reports')
        .insert({
          reporter_id: user.id,
          content_id: contentId,
          content_type: contentType,
          reason: reason,
          notes: details.trim() || null,
          severity_level: 'medium',
          review_priority: reason === 'violence' || reason === 'harassment'
        });

      if (error) throw error;

      toast.success("Report submitted successfully", { id: toastId });
      onClose();
      setReason('');
      setDetails('');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error("Failed to submit report", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Content</DialogTitle>
          <DialogDescription>
            Help us understand why you're reporting this content. Your report will be reviewed by our moderators.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <Label>Reason for reporting</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {reportReasons.map((reportReason) => (
                <div key={reportReason.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={reportReason.id} id={reportReason.id} />
                  <Label htmlFor={reportReason.id}>{reportReason.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Additional Details (Optional)</Label>
            <Textarea
              id="details"
              placeholder="Please provide any additional context..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !reason}
          >
            Submit Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}