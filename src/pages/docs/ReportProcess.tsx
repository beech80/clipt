
import { Flag } from "lucide-react";
import { Card } from "@/components/ui/card";
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import reportContent from '../../../docs/REPORT_PROCESS.md?raw';

const ReportProcess = () => {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Flag className="w-5 h-5 text-purple-500" />
        <h1 className="text-2xl font-bold">Report & Appeal Process</h1>
      </div>
      <div className="prose dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{reportContent}</ReactMarkdown>
      </div>
    </Card>
  );
};

export default ReportProcess;
