import { ReactNode } from "react";
import { ReportDialog } from "./ReportDialog";
import { useReportDialog } from "@/hooks/use-report-dialog";

interface ReportDialogProviderProps {
  children: ReactNode;
}

export const ReportDialogProvider: React.FC<ReportDialogProviderProps> = ({ children }) => {
  const { isOpen, contentId, contentType, closeReportDialog } = useReportDialog();

  return (
    <>
      <ReportDialog
        isOpen={isOpen}
        onClose={closeReportDialog}
        contentId={contentId}
        contentType={contentType}
      />
      {children}
    </>
  );
};