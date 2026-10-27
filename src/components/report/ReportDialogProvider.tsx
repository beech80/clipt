import { ReactNode } from "react";
import { ReportDialog } from "./ReportDialog";
import { useReportDialog } from "@/hooks/use-report-dialog";
import { useAuth } from '@/contexts/AuthContext';

interface ReportDialogProviderProps {
  children: ReactNode;
}

export const ReportDialogProvider = ({ children }: ReportDialogProviderProps) => {
  const { isOpen, contentId, contentType, closeReportDialog } = useReportDialog();
  const { user } = useAuth();

  return (
    <>
      {isOpen && (
        <ReportDialog
          key={`${user?.id ?? 'signed-out'}:${contentType}:${contentId}`}
          isOpen={isOpen}
          onClose={closeReportDialog}
          contentId={contentId}
          contentType={contentType}
        />
      )}
      {children}
    </>
  );
};
