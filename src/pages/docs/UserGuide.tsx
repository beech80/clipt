
import { BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Link} from "react-router-dom";
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import userGuideContent from '../../../docs/USER_GUIDE.md?raw';

const UserGuide = () => {
  return (
    <main className="clipt-user-guide mx-auto max-w-3xl p-4 sm:p-6">
    <Card className="p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen aria-hidden="true" className="w-5 h-5 text-purple-300" />
        <h1 className="text-2xl font-bold">User Guide</h1>
      </div>
      
      <section aria-labelledby="support-contact" className="mb-6 space-y-2">
        <h2 id="support-contact" className="text-xl font-semibold">Contact support</h2>
        <p>For account, upload, playback or safety concerns, email <a className="underline break-all" href="mailto:beecher@cliptgaming.com">beecher@cliptgaming.com</a>. Never include your password, verification codes or private keys.</p>
        <p><Link className="underline" to="/delete-account">Account deletion help</Link></p>
      </section>
      <Button asChild className="mb-5"><Link to="/clipts?tour=controls">Replay Home tutorial</Link></Button>
      <div className="prose dark:prose-invert max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({node, ...props}) => (
              <h2 className="text-xl font-semibold mt-8 mb-4" {...props} />
            ),
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
          {userGuideContent}
        </ReactMarkdown>
      </div>
    </Card>
    </main>
  );
};

export default UserGuide;
