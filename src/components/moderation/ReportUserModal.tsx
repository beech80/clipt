import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { AlertTriangle, ShieldAlert, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUsername: string;
}

// Predefined reporting reasons
const reportReasons = [
  { id: 'harassment', label: 'Harassment or Bullying', severity: 'high' },
  { id: 'hate_speech', label: 'Hate Speech', severity: 'high' },
  { id: 'violence', label: 'Violence or Threats', severity: 'high' },
  { id: 'inappropriate', label: 'Inappropriate Content', severity: 'medium' },
  { id: 'spam', label: 'Spam or Misleading', severity: 'medium' },
  { id: 'impersonation', label: 'Impersonation', severity: 'high' },
  { id: 'underage', label: 'Underage User', severity: 'high' },
  { id: 'other', label: 'Other', severity: 'medium' }
];

export const ReportUserModal = ({ isOpen, onClose, reportedUserId, reportedUsername }: ReportUserModalProps) => {
  const { user } = useAuth();
  const [reason, setReason] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset state when modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setReason('');
      setDetails('');
      setStep(1);
      setIsSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to report a user');
      return;
    }

    if (!reason) {
      toast.error('Please select a reason for your report');
      return;
    }

    try {
      setIsSubmitting(true);

      // First, store the report in the database
      const { error: reportError } = await supabase
        .from('user_reports' as any)
        .insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId,
          reason: reason,
          details: details,
          status: 'pending'
        });

      if (reportError) throw reportError;

      // Analyze the report for severe content using AI moderation
      // In a real implementation, this would call OpenAI's moderation API or a similar service
      const selectedReason = reportReasons.find(r => r.id === reason);
      const isSevere = selectedReason?.severity === 'high' && 
        (details.toLowerCase().includes('threat') || 
         details.toLowerCase().includes('harm') || 
         details.toLowerCase().includes('kill') ||
         details.toLowerCase().includes('hate') ||
         details.toLowerCase().includes('violent'));

      // If the content is deemed severe, automatically ban the user
      if (isSevere) {
        const { error: banError } = await supabase
          .from('banned_users' as any)
          .insert({
            user_id: reportedUserId,
            reason: `Automatically banned due to ${selectedReason?.label} report`,
            banned_by: 'system',
            details: `AI moderation flagged report as severe based on: ${details}`
          });

        if (banError) throw banError;

        // Update user status to banned
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ status: 'banned' } as any)
          .eq('id', reportedUserId);

        if (updateError) throw updateError;
      }

      setIsSuccess(true);
      setStep(2);
      
      // Close after success display
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-b from-gray-900 to-black border border-red-500/30 text-white">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2 text-red-400">
                  <ShieldAlert className="w-5 h-5" />
                  Report User
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  You are reporting {reportedUsername}. This report will be reviewed by our moderation team.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label className="text-white">Select a reason for reporting</Label>
                  <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
                    {reportReasons.map((reportReason) => (
                      <div key={reportReason.id} className="flex items-center space-x-2 rounded-md p-2 hover:bg-gray-800/50">
                        <RadioGroupItem 
                          value={reportReason.id} 
                          id={reportReason.id} 
                          className="border-red-500/50 text-red-500" 
                        />
                        <Label htmlFor={reportReason.id} className="flex-1 cursor-pointer">
                          {reportReason.label}
                        </Label>
                        {reportReason.severity === 'high' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/50 text-red-400 border border-red-500/30">
                            Severe
                          </span>
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Additional details</Label>
                  <Textarea 
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Please provide specific details about the issue..."
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 min-h-[100px]"
                  />
                </div>

                <div className="flex items-center gap-2 p-3 rounded-md bg-amber-900/20 border border-amber-500/30 text-amber-400 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <p>False reports may result in action against your account.</p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={onClose} className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting || !reason} 
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </Button>
              </DialogFooter>
            </motion.div>
          ) : (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <div className="w-16 h-16 rounded-full bg-green-900/30 border border-green-500/30 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-green-400" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Report Submitted</h3>
              <p className="text-gray-400 text-center mb-6">
                Thank you for helping keep the CLIPT community safe. Our team will review your report.
              </p>
              
              <motion.div 
                className="w-full bg-gray-800/50 h-2 rounded-full overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 3 }}
              >
                <div className="h-full bg-green-500"></div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ReportUserModal;
, 