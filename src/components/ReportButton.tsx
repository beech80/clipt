import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";
import { useReportDialog } from "@/hooks/use-report-dialog";

interface ReportButtonProps {
  contentId: string;
  contentType: 'post' | 'comment' | 'stream' | 'chat_message';
  variant?: 'default' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ReportButton({ 
  contentId, 
  contentType,
  variant = 'ghost',
  size = 'sm'
}: ReportButtonProps) {
  const { openReportDialog } = useReportDialog();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => openReportDialog(contentId, contentType)}
      className="text-muted-foreground hover:text-foreground"
    >
      <Flag className="h-4 w-4 mr-2" />
      Report
    </Button>
  );
}