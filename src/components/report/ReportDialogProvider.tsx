import { ReportDialog } from "./ReportDialog";
import { useReportDialog } from "@/hooks/use-report-dialog";
import { ReactNode } from "react";

interface ReportDialogProviderProps {
  children: ReactNode;
}

export function ReportDialogProvider({ children }: ReportDialogProviderProps) {
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
}