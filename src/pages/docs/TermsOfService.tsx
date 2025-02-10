
import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import termsContent from '../../../docs/TERMS_OF_SERVICE.md?raw';

const TermsOfService = () => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-6 h-6 text-purple-500" />
        <h1 className="text-2xl font-bold">Terms of Service</h1>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({node, ...props}) => (
              <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />
            ),
            h2: ({node, ...props}) => (
              <h2 className="text-2xl font-semibold mt-8 mb-4" {...props} />
            ),
            h3: ({node, ...props}) => (
              <h3 className="text-xl font-semibold mt-6 mb-3" {...props} />
            ),
            ul: ({node, ...props}) => (
              <ul className="list-disc pl-6 space-y-2 my-4" {...props} />
            ),
            ol: ({node, ...props}) => (
              <ol className="list-decimal pl-6 space-y-2 my-4" {...props} />
            ),
            p: ({node, ...props}) => (
              <p className="my-4 text-muted-foreground leading-relaxed" {...props} />
            ),
            code: ({node, ...props}) => (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm" {...props} />
            ),
            pre: ({node, ...props}) => (
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4" {...props} />
            ),
            a: ({node, ...props}) => (
              <a className="text-primary hover:underline" {...props} />
            )
          }}
        >
          {termsContent}
        </ReactMarkdown>
      </div>
    </Card>
  );
};

export default TermsOfService;

