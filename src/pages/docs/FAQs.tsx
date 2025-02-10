
import { HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import faqContent from '../../../docs/FAQS.md?raw';

const FAQs = () => {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="w-5 h-5 text-purple-500" />
        <h1 className="text-2xl font-bold">Frequently Asked Questions</h1>
      </div>
      <div className="prose dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{faqContent}</ReactMarkdown>
      </div>
    </Card>
  );
};

export default FAQs;
