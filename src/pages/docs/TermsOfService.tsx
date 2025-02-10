
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
            h2: ({node, ...props}) => (
              <h2 className="flex items-center gap-2 text-xl font-semibold mt-8 mb-4" {...props}>
                {props.children}
              </h2>
            ),
            h3: ({node, ...props}) => (
              <h3 className="text-lg font-semibold mt-6 mb-3" {...props}>
                {props.children}
              </h3>
            ),
            ul: ({node, ...props}) => (
              <ul className="list-disc pl-6 space-y-2" {...props} />
            ),
            ol: ({node, ...props}) => (
              <ol className="list-decimal pl-6 space-y-2" {...props} />
            ),
            p: ({node, ...props}) => (
              <p className="my-4 text-muted-foreground" {...props} />
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
