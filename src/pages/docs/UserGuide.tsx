
import { BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import userGuideContent from '../../../docs/USER_GUIDE.md?raw';

const UserGuide = () => {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-5 h-5 text-purple-500" />
        <h1 className="text-2xl font-bold">User Guide</h1>
      </div>
      <div className="prose dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{userGuideContent}</ReactMarkdown>
      </div>
    </Card>
  );
};

export default UserGuide;
