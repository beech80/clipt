import { ReportDialog } from "./ReportDialog";
import { useReportDialog } from "@/hooks/use-report-dialog";

export function ReportDialogProvider() {
  const { isOpen, contentId, contentType, closeReportDialog } = useReportDialog();

  return (
    <ReportDialog
      isOpen={isOpen}
      onClose={closeReportDialog}
      contentId={contentId}
      contentType={contentType}
    />
  );
}