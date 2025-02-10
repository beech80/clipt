
import { BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import userGuideContent from '../../../docs/USER_GUIDE.md?raw';

const UserGuide = () => {
  console.log('User Guide content:', userGuideContent); // Debug log

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-5 h-5 text-purple-500" />
        <h1 className="text-2xl font-bold">User Guide</h1>
      </div>
      
      <div className="prose dark:prose-invert max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({node, ...props}) => (
              <h2 className="flex items-center gap-2 text-xl font-semibold mt-8 mb-4" {...props} />
            ),
            h3: ({node, ...props}) => (
              <h3 className="text-lg font-semibold mt-6 mb-3" {...props} />
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
          {userGuideContent}
        </ReactMarkdown>
      </div>
    </Card>
  );
};

export default UserGuide;
