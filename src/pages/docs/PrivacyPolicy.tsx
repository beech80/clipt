
import { Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import privacyContent from '../../../docs/PRIVACY_POLICY.md?raw';
import { LegalLinks } from '@/components/LegalLinks';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <main className="clipt-auth mx-auto w-full min-w-0 max-w-3xl px-3 py-6">
    <Card className="p-6 space-y-4 break-words">
      <div className="flex items-center gap-2 mb-6">
        <Shield aria-hidden="true" className="w-5 h-5 text-purple-500" />
        <h1 className="text-2xl font-bold">Privacy Policy</h1>
      </div>
      <div className="prose dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{h1: ({node, ...props}) => <h2 {...props} />}}>{privacyContent}</ReactMarkdown>
      </div>
      <Link to="/delete-account" className="inline-flex min-h-11 items-center text-purple-200 underline">Account deletion and retention information</Link>
      <LegalLinks />
    </Card>
    </main>
  );
};

export default PrivacyPolicy;
