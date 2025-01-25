import { ReactNode } from "react";
import { ReportDialog } from "./ReportDialog";
import { useReportDialog } from "@/hooks/use-report-dialog";

interface ReportDialogProviderProps {
  children: ReactNode;
}

export const ReportDialogProvider = ({ children }: ReportDialogProviderProps) => {
  const { isOpen, contentId, contentType, closeReportDialog } = useReportDialog();

  return (
    <>
      {isOpen && (
        <ReportDialog
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