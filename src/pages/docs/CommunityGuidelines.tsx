
import { Users, FileText, ShieldCheck, MessageSquare, HeartHandshake } from "lucide-react";
import { Card } from "@/components/ui/card";
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import guidelinesContent from '../../../docs/COMMUNITY_GUIDELINES.md?raw';
import { Separator } from "@/components/ui/separator";

const CommunityGuidelines = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-8 h-8 text-purple-500" />
          <div>
            <h1 className="text-3xl font-bold">Community Guidelines</h1>
            <p className="text-muted-foreground">
              Our standards for a safe and inclusive community
            </p>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-start gap-3 p-4 bg-card rounded-lg border">
            <ShieldCheck className="w-5 h-5 text-purple-500 mt-1" />
            <div>
              <h3 className="font-semibold">Safety First</h3>
              <p className="text-sm text-muted-foreground">We prioritize the safety and well-being of our community members</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-card rounded-lg border">
            <MessageSquare className="w-5 h-5 text-purple-500 mt-1" />
            <div>
              <h3 className="font-semibold">Respectful Communication</h3>
              <p className="text-sm text-muted-foreground">Maintain respectful and constructive dialogue</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-card rounded-lg border">
            <HeartHandshake className="w-5 h-5 text-purple-500 mt-1" />
            <div>
              <h3 className="font-semibold">Inclusive Environment</h3>
              <p className="text-sm text-muted-foreground">Create a welcoming space for everyone</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-card rounded-lg border">
            <FileText className="w-5 h-5 text-purple-500 mt-1" />
            <div>
              <h3 className="font-semibold">Content Standards</h3>
              <p className="text-sm text-muted-foreground">Guidelines for sharing and creating content</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Guidelines Content */}
      <Card className="p-6">
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{guidelinesContent}</ReactMarkdown>
        </div>
      </Card>
    </div>
  );
};

export default CommunityGuidelines;

