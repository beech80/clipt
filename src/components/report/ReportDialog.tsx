import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ContentReportError, submitContentReport, supportsContentReport } from '@/lib/content-report';

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
  // This global dialog has no Radix DialogTrigger. Capture its actual opener
  // before the focus scope mounts so Escape/Cancel can return keyboard users.
  const [returnFocusTo] = useState<HTMLElement | null>(() =>
    typeof document !== 'undefined' && document.activeElement instanceof HTMLElement
      && document.activeElement !== document.body ? document.activeElement : null);
  const [reason, setReason] = useState<string>('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submission = useRef(false);
  const mounted = useRef(true);
  const activeToast = useRef<string | number | null>(null);
  const { user } = useAuth();
  const supported = supportsContentReport(contentType);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (activeToast.current !== null) toast.dismiss(activeToast.current);
    };
  }, []);

  const handleSubmit = async () => {
    if (submission.current) return;
    if (!user) {
      toast.error("Please login to report content");
      return;
    }

    if (!supported) return;
    if (!reason) {
      toast.error("Please select a reason for reporting");
      return;
    }

    submission.current = true;
    setIsSubmitting(true);
    const toastId = toast.loading("Submitting report...");
    activeToast.current = toastId;

    try {
      await submitContentReport({ contentId, contentType, reason, details, expectedUserId: user.id });
      if (!mounted.current) return;

      toast.success("Report submitted successfully", { id: toastId });
      onClose();
      setReason('');
      setDetails('');
    } catch (error) {
      const message = error instanceof ContentReportError && error.kind === 'auth'
        ? 'Your sign-in could not be verified. Please sign in again before reporting.'
        : error instanceof ContentReportError && error.kind === 'invalid'
          ? 'The report details could not be validated. Please check the target and reason.'
          : 'Report was not confirmed. It may have been received; please avoid repeated submissions.';
      if (mounted.current) toast.error(message, { id: toastId });
    } finally {
      submission.current = false;
      activeToast.current = null;
      if (mounted.current) setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open && !submission.current) onClose(); }}>
      <DialogContent className="clipt-report-dialog sm:max-w-[640px]" onCloseAutoFocus={event => {
        if (returnFocusTo?.isConnected) { event.preventDefault(); returnFocusTo.focus(); }
      }}>
        <DialogHeader>
          <DialogTitle>Report Content</DialogTitle>
          <DialogDescription>
            Help us understand why you're reporting this content. Your report will be reviewed by our moderators.
          </DialogDescription>
        </DialogHeader>

        {!supported && <p role="alert">Individual chat-message reports are not available here. Report the stream instead, or contact <a className="underline" href="mailto:beecher@cliptgaming.com">beecher@cliptgaming.com</a>. Do not send passwords or private messages by email.</p>}

        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <Label>Reason for reporting</Label>
            <RadioGroup value={reason} onValueChange={setReason} disabled={isSubmitting} className="clipt-report-reasons">
              {reportReasons.map((reportReason) => (
                <div key={reportReason.id} className="flex items-center space-x-2 rounded-lg border border-purple-500/40 p-3">
                  <RadioGroupItem value={reportReason.id} id={reportReason.id} />
                  <Label htmlFor={reportReason.id} className="flex-1 min-h-8 flex items-center cursor-pointer">{reportReason.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Additional Details (Optional)</Label>
            <Textarea
              id="details"
              maxLength={2000}
              placeholder="Please provide any additional context..."
              value={details}
              disabled={isSubmitting}
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
            disabled={isSubmitting || !reason || !supported}
          >
            Submit Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
