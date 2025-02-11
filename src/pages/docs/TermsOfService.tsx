
import { File } from "lucide-react";
import { Card } from "@/components/ui/card";
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import termsContent from '../../../docs/TERMS_OF_SERVICE.md?raw';

const TermsOfService = () => {
  return (
    <Card className="p-6 space-y-4 bg-background">
      <div className="flex items-center gap-2 mb-6">
        <File className="w-5 h-5 text-purple-500" />
        <h1 className="text-2xl font-bold">Terms of Service</h1>
      </div>
      <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h1 className="text-3xl font-bold mb-6">{children}</h1>,
            h2: ({ children }) => <h2 className="text-2xl font-semibold mt-8 mb-4">{children}</h2>,
            h3: ({ children }) => <h3 className="text-xl font-medium mt-6 mb-3">{children}</h3>,
            ul: ({ children }) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
            li: ({ children }) => <li className="mb-2">{children}</li>,
            p: ({ children }) => <p className="mb-4">{children}</p>,
          }}
        >
          {termsContent}
        </ReactMarkdown>
      </div>
    </Card>
  );
};

export default TermsOfService;
