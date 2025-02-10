
import { File } from "lucide-react";
import { Card } from "@/components/ui/card";
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import termsContent from '../../../docs/TERMS_OF_SERVICE.md?raw';

const TermsOfService = () => {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <File className="w-5 h-5 text-purple-500" />
        <h1 className="text-2xl font-bold">Terms of Service</h1>
      </div>
      <div className="prose dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{termsContent}</ReactMarkdown>
      </div>
    </Card>
  );
};

export default TermsOfService;
