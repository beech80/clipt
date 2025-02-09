
import { Code } from "lucide-react";
import { Card } from "@/components/ui/card";
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import apiContent from '../../../docs/API_DOCUMENTATION.md?raw';

const ApiDocumentation = () => {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Code className="w-5 h-5 text-purple-500" />
        <h1 className="text-2xl font-bold">API Documentation</h1>
      </div>
      <div className="prose dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{apiContent}</ReactMarkdown>
      </div>
    </Card>
  );
};

export default ApiDocumentation;
